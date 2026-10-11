import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Compass,
  ExternalLink,
  CheckCircle,
  Crosshair,
  Loader2,
} from "lucide-react";
import { getBranches } from "../../firebase/services";
import { calculateDistanceKm } from "../../utils/geocoding";

function createBranchIcon(isSelected, name) {
  const bg = isSelected ? "#e63946" : "#1a1612";
  const border = isSelected ? "#ffffff" : "rgba(245, 158, 11, 0.7)";
  const textColor = isSelected ? "#ffffff" : "#fbbf24";
  const scale = isSelected ? "scale(1.15)" : "scale(1)";
  const zIndex = isSelected ? 1000 : 100;

  return L.divIcon({
    className: "custom-branch-marker",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%) ${scale}; cursor: pointer; z-index: ${zIndex}; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: ${bg}; color: ${textColor}; border: 1.5px solid ${border}; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${name}
        </div>
        <div style="width: 8px; height: 8px; background-color: ${bg}; transform: rotate(45deg); margin-top: -4px; border-right: 1.5px solid ${border}; border-bottom: 1.5px solid ${border};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "custom-user-marker",
    html: `
      <div style="position: relative; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
        <span style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background: rgba(59, 130, 246, 0.6);"></span>
        <span style="position: relative; width: 12px; height: 12px; border-radius: 9999px; background: #2563eb; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function BranchesSection() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeBranch, setActiveBranch] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [nearestInfo, setNearestInfo] = useState(null);

  // Load branches from Firestore
  useEffect(() => {
    async function load() {
      const list = await getBranches(false); // active only
      setBranches(list || []);
      if (list && list.length > 0) {
        setActiveBranch(list[0]);
      }
    }
    load();
  }, []);

  const cities = Array.from(new Set(branches.map((b) => b.city).filter(Boolean)));

  const filteredBranches = branches.filter((b) => {
    if (selectedCity === "all") return true;
    return b.city?.toLowerCase() === selectedCity.toLowerCase();
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultLat = 39.7747;
    const defaultLng = 64.4286;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when branches change or active branch changes
  // Handle select branch
  const handleSelectBranch = useCallback((branch) => {
    setActiveBranch(branch);
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = Number(branch.latitude);
    const lng = Number(branch.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 15, { animate: true, duration: 1 });
    }
  }, []);

  // Update markers when branches change or active branch changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const validBranches = filteredBranches.filter(
      (b) => !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))
    );

    if (validBranches.length === 0) return;

    validBranches.forEach((branch) => {
      const lat = Number(branch.latitude);
      const lng = Number(branch.longitude);
      const isSelected = activeBranch?.id === branch.id;

      const marker = L.marker([lat, lng], {
        icon: createBranchIcon(isSelected, branch.name),
        zIndexOffset: isSelected ? 1000 : 100,
      }).addTo(map);

      marker.on("click", () => {
        handleSelectBranch(branch);
      });

      markersRef.current.set(branch.id, marker);
    });

    // Auto-fit bounds if no single active branch is focused
    if (validBranches.length > 0 && !activeBranch) {
      const group = new L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [filteredBranches, activeBranch, handleSelectBranch]);

  // Locate User & Find Nearest Branch
  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        const map = mapInstanceRef.current;
        if (!map) return;

        // Add or move user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const uMarker = L.marker([latitude, longitude], {
            icon: createUserIcon(),
            zIndexOffset: 500,
          }).addTo(map);
          uMarker.bindPopup(`
            <div style="font-size: 12px; color: white;">
              <strong style="color: #60a5fa;">📍 Sizning joylashuvingiz</strong>
            </div>
          `);
          userMarkerRef.current = uMarker;
        }

        // Find closest branch
        let closest = null;
        let minDistance = Infinity;

        branches.forEach((b) => {
          const bLat = Number(b.latitude);
          const bLng = Number(b.longitude);
          if (!isNaN(bLat) && !isNaN(bLng)) {
            const d = calculateDistanceKm(latitude, longitude, bLat, bLng);
            if (d < minDistance) {
              minDistance = d;
              closest = { ...b, distance: d };
            }
          }
        });

        if (closest) {
          setActiveBranch(closest);
          setNearestInfo(closest);
          map.flyTo([Number(closest.latitude), Number(closest.longitude)], 15, {
            duration: 1.2,
          });
        } else {
          map.flyTo([latitude, longitude], 14, { duration: 1 });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation error:", err.message);
        alert("Joylashuvingizni aniqlashga ruxsat berilmadi.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <section id="branches" className="bg-[#14100c] text-white py-20 px-5 md:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e63946] animate-ping" />
              <p className="text-xs uppercase tracking-widest font-bold text-[#e63946]">
                Filiallar Tarmog'i
              </p>
            </div>
            <h2 className="font-black text-4xl md:text-5xl leading-[0.95] tracking-tight">
              Bizning <span className="text-[#e63946] italic">filiallarimiz.</span>
            </h2>
            <p className="text-white/60 text-sm mt-3 max-w-xl">
              Buxoro, Toshkent va butun O'zbekiston bo'ylab FoodHub restoranlari. Tezkor tayyorlanadi, xaritada qulay ko'rsatilgan.
            </p>
          </div>

          {/* Controls: Find Nearest & City Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFindNearest}
              disabled={isLocating}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              {isLocating ? "Aniqlanmoqda..." : "Eng yaqin filialni topish"}
            </button>

            <button
              onClick={() => {
                setSelectedCity("all");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedCity === "all"
                  ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/30"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Barchasi ({branches.length})
            </button>

            {cities.map((city) => {
              const count = branches.filter((b) => b.city === city).length;
              return (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    const firstInCity = branches.find((b) => b.city === city);
                    if (firstInCity) {
                      handleSelectBranch(firstInCity);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    selectedCity === city
                      ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/30"
                      : "bg-white/10 hover:bg-white/20 text-white/80"
                  }`}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Nearest Info Banner */}
        {nearestInfo && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  Eng yaqin filial: {nearestInfo.name} ({nearestInfo.city})
                </span>
                <span className="text-blue-300/80">
                  Sizdan taxminan {nearestInfo.distance} km masofada joylashgan
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSelectBranch(nearestInfo)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold whitespace-nowrap cursor-pointer"
            >
              Ko'rish
            </button>
          </div>
        )}

        {/* Interactive Leaflet Map & Branch List */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          {/* Left: Leaflet Map */}
          <div className="relative h-[420px] md:h-[500px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full" />

            <div className="absolute bottom-3 left-3 bg-[#0e0b08]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-white/80 border border-white/10 flex items-center gap-2 z-[1000]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Har bir filialda yangi taomlar tayyorlanadi</span>
            </div>

            {userCoords && (
              <div className="absolute top-3 right-3 bg-blue-950/80 backdrop-blur-md text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 z-[1000] shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Lokatsiyangiz aniqlandi
              </div>
            )}
          </div>

          {/* Right: Branch Cards List */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredBranches.map((branch) => {
              const isSelected = activeBranch?.id === branch.id;
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;

              return (
                <div
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className={`p-4 md:p-5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border-[#e63946] shadow-xl ring-1 ring-[#e63946]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h3 className="font-black text-base text-white">{branch.name}</h3>
                      </div>
                      <p className="text-xs text-white/70 mt-1 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#e63946] shrink-0 mt-0.5" />
                        <span>
                          {branch.city}, {branch.address}
                        </span>
                      </p>
                    </div>

                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ochiq
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{branch.openingHours || "10:00 — 02:00"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <a
                        href={`tel:${branch.phone?.replace(/\s+/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-white transition underline"
                      >
                        {branch.phone || "+998 71 234 56 67"}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectBranch(branch)}
                      className="text-xs font-bold text-[#e63946] hover:text-[#ff4d5c] flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Xaritada ko'rsatish
                    </button>

                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" /> Yo'nalish olish
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
