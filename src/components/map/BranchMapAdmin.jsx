import { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import {
  MapPin,
  Search,
  Compass,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Crosshair,
  Loader2,
} from "lucide-react";
import { searchAddress, reverseGeocode } from "../../utils/geocoding";

const DEFAULT_CENTER = { lat: 39.7747, lng: 64.4286 }; // Bukhara

const CITY_PRESETS = [
  { name: "Buxoro", lat: 39.7747, lng: 64.4286, zoom: 13 },
  { name: "Toshkent", lat: 41.311082, lng: 69.279654, zoom: 12 },
  { name: "Samarqand", lat: 39.6542, lng: 66.9750, zoom: 13 },
  { name: "Farg'ona", lat: 40.3842, lng: 71.7843, zoom: 13 },
  { name: "Andijon", lat: 40.7821, lng: 72.3442, zoom: 13 },
];

function createAdminBranchIcon(branch, isSelected) {
  const bg = isSelected
    ? "#fbbf24"
    : branch.isActive
    ? "#1a1612"
    : "#374151";
  const border = isSelected
    ? "#f59e0b"
    : branch.isActive
    ? "#10b981"
    : "#6b7280";
  const textColor = isSelected ? "#000000" : "#ffffff";
  const dotColor = branch.isActive ? "#10b981" : "#ef4444";
  const scale = isSelected ? "scale(1.15)" : "scale(1)";
  const zIndex = isSelected ? 1000 : 200;

  return L.divIcon({
    className: "admin-branch-marker",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%) ${scale}; cursor: pointer; z-index: ${zIndex}; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: ${bg}; color: ${textColor}; border: 1.5px solid ${border}; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; box-shadow: 0 8px 16px rgba(0,0,0,0.4); white-space: nowrap; display: flex; align-items: center; gap: 5px;">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background-color: ${dotColor};"></span>
          <span>${branch.name}</span>
        </div>
        <div style="width: 7px; height: 7px; background-color: ${bg}; transform: rotate(45deg); margin-top: -4px; border-right: 1.5px solid ${border}; border-bottom: 1.5px solid ${border};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createFormPinIcon() {
  return L.divIcon({
    className: "admin-form-target-pin",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; z-index: 1200;">
        <div style="background-color: #e63946; color: white; border: 2px solid white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 900; box-shadow: 0 10px 20px rgba(230,57,70,0.5); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 8 4 4-4 4M8 12h8"/></svg>
          Filial Nuqtasi
        </div>
        <div style="width: 10px; height: 10px; background-color: #e63946; transform: rotate(45deg); margin-top: -5px; border-right: 2px solid white; border-bottom: 2px solid white;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createGpsUserIcon() {
  return L.divIcon({
    className: "admin-gps-pin",
    html: `
      <div style="position: relative; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 30px; height: 30px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></span>
        <span style="position: relative; width: 12px; height: 12px; border-radius: 9999px; background: #2563eb; border: 2px solid white;"></span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function BranchMapAdmin({
  branches = [],
  selectedBranch = null,
  onSelectBranch,
  onEditBranch,
  onToggleStatus,
  onDeleteBranch,
  onAddAtCoordinates,
  isFormOpen = false,
  formCoordinates = null,
  onCoordinateChange,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const branchMarkersRef = useRef(new Map());
  const formMarkerRef = useRef(null);
  const userGpsMarkerRef = useRef(null);

  // Address search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Filter state inside map
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const searchDebounceRef = useRef(null);

  // Filter branches
  const filteredBranches = branches.filter((b) => {
    const matchCity =
      cityFilter === "all" || b.city?.toLowerCase() === cityFilter.toLowerCase();
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && b.isActive) ||
      (statusFilter === "inactive" && !b.isActive);
    return matchCity && matchStatus;
  });

  // Handle map click
  const handleMapClick = useCallback(
    async (lat, lng) => {
      const geoInfo = await reverseGeocode(lat, lng);
      const formattedAddress = geoInfo?.street
        ? `${geoInfo.street}, ${geoInfo.city}`
        : geoInfo?.displayName?.split(",").slice(0, 3).join(",") ||
          `Koordinatalar: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const data = {
        lat,
        lng,
        address: formattedAddress,
        city: geoInfo?.city || "Buxoro",
        country: geoInfo?.country || "O'zbekiston",
      };

      if (onCoordinateChange) {
        onCoordinateChange(data);
      } else if (onAddAtCoordinates) {
        onAddAtCoordinates(data);
      }
    },
    [onCoordinateChange, onAddAtCoordinates]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
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

    // Map click
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      handleMapClick(lat, lng);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [handleMapClick]);

  // Update Branch Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    branchMarkersRef.current.forEach((m) => m.remove());
    branchMarkersRef.current.clear();

    filteredBranches.forEach((branch) => {
      const lat = Number(branch.latitude);
      const lng = Number(branch.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = selectedBranch?.id === branch.id;
      const marker = L.marker([lat, lng], {
        icon: createAdminBranchIcon(branch, isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      }).addTo(map);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectBranch) onSelectBranch(branch);
      });

      branchMarkersRef.current.set(branch.id, marker);
    });
  }, [filteredBranches, selectedBranch, onSelectBranch]);

  // Handle Form Coordinates Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (formCoordinates?.lat && formCoordinates?.lng) {
      const lat = Number(formCoordinates.lat);
      const lng = Number(formCoordinates.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        if (formMarkerRef.current) {
          formMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            icon: createFormPinIcon(),
            draggable: true,
            zIndexOffset: 1200,
          }).addTo(map);

          marker.on("dragend", async (e) => {
            const pos = e.target.getLatLng();
            handleMapClick(pos.lat, pos.lng);
          });

          formMarkerRef.current = marker;
        }

        map.flyTo([lat, lng], 15, { duration: 0.8 });
        return;
      }
    }

    if (formMarkerRef.current) {
      formMarkerRef.current.remove();
      formMarkerRef.current = null;
    }
  }, [formCoordinates, handleMapClick]);

  // Center on selected branch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedBranch?.latitude || !selectedBranch?.longitude) return;

    const lat = Number(selectedBranch.latitude);
    const lng = Number(selectedBranch.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [selectedBranch]);

  // Address search with Nominatim
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchAddress(val);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectSearchResult = (result) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([result.lat, result.lng], 16, { duration: 1 });
    }

    setShowResults(false);
    setSearchQuery(result.name);

    if (onCoordinateChange) {
      onCoordinateChange({
        lat: result.lat,
        lng: result.lng,
        address: result.street || result.displayName,
        city: result.city || "Buxoro",
        country: result.country || "O'zbekiston",
      });
    }
  };

  // Admin GPS Location
  const handleAdminLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        if (userGpsMarkerRef.current) {
          userGpsMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userGpsMarkerRef.current = L.marker([latitude, longitude], {
            icon: createGpsUserIcon(),
            zIndexOffset: 600,
          }).addTo(map);
        }

        map.flyTo([latitude, longitude], 15, { duration: 1 });
        handleMapClick(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[520px] md:h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#14100c]">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row gap-2 pointer-events-none">
        {/* Real Geocoding Search Bar */}
        <div className="relative flex-1 max-w-md pointer-events-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Shahar, ko'cha yoki joy nomini qidiring (masalan: Labi Hovuz, Buxoro)..."
              className="w-full bg-[#0e0b08]/90 backdrop-blur-md border border-white/20 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e63946] shadow-xl"
            />
            <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-3" />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-[#e63946] animate-spin absolute right-3 top-3" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1a1612]/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5 z-[1100]">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition flex items-start gap-2.5 group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#e63946] shrink-0 mt-0.5 group-hover:scale-110 transition" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{res.name}</p>
                    <p className="text-[10px] text-white/60 truncate">{res.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City Presets & GPS Location button */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleAdminLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-lg cursor-pointer disabled:opacity-50"
            title="Mening hozirgi lokatsiyamni belgilash"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Crosshair className="w-3 h-3" />
            )}
            Mening lokatsiyam
          </button>

          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([city.lat, city.lng], city.zoom, {
                    duration: 0.8,
                  });
                }
                setCityFilter("all");
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0e0b08]/85 backdrop-blur-md hover:bg-white/15 border border-white/10 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-lg cursor-pointer"
            >
              <Compass className="w-3 h-3 text-[#e63946]" />
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Stats Overlay */}
      <div className="absolute top-18 md:top-16 left-4 z-[1000] flex items-center gap-2 pointer-events-auto">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0e0b08]/85 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white shadow-lg focus:outline-none cursor-pointer"
        >
          <option value="all">Barcha holatlar ({branches.length})</option>
          <option value="active">
            Faqat Faol ({branches.filter((b) => b.isActive).length})
          </option>
          <option value="inactive">
            Faqat Nofaol ({branches.filter((b) => !b.isActive).length})
          </option>
        </select>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Selected Branch Floating Card */}
      {selectedBranch && !isFormOpen && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-[1050] bg-[#0e0b08]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-white">{selectedBranch.name}</h4>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    selectedBranch.isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {selectedBranch.isActive ? "Faol" : "Nofaol"}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#e63946] shrink-0" />
                <span>
                  {selectedBranch.city}, {selectedBranch.address}
                </span>
              </p>
            </div>
            <button
              onClick={() => onSelectBranch(null)}
              className="text-white/40 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-white/60 bg-white/5 p-2 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedBranch.phone || "Telefon yo'q"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedBranch.openingHours || "10:00 — 02:00"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
            <span className="font-mono text-[10px] text-white/40">
              {Number(selectedBranch.latitude).toFixed(4)},{" "}
              {Number(selectedBranch.longitude).toFixed(4)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleStatus(selectedBranch)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer"
              >
                {selectedBranch.isActive ? (
                  <>
                    <XCircle className="w-3 h-3 text-red-400" /> O'chirish
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Yoqish
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onEditBranch(selectedBranch)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#e63946] hover:bg-[#ff4d5c] text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Tahrirlash
              </button>

              <button
                type="button"
                onClick={() => onDeleteBranch(selectedBranch)}
                className="p-1.5 rounded-lg text-xs text-white/60 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                title="O'chirish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Helper Tip */}
      <div className="absolute bottom-3 right-3 z-[1000] hidden md:flex items-center gap-2 bg-[#0e0b08]/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white/70 shadow-lg pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-[#e63946]" />
        <span>Filial joylashuvini belgilash uchun xaritaga bosing</span>
      </div>
    </div>
  );
}
