import { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Crosshair,
} from "lucide-react";
import { reverseGeocode, calculateDistanceKm } from "../../utils/geocoding";

// Fix Leaflet's default marker icon paths in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Restaurant central kitchen location (Amir Temur 12, Tashkent)
export const RESTAURANT_LOCATION = {
  lat: 41.311082,
  lng: 69.279654,
  address: "Amir Temur shoh ko'chasi, 12, Toshkent",
};

export const CITIES = {
  tashkent: { name: "Toshkent", lat: 41.311082, lng: 69.279654 },
  samarkand: { name: "Samarqand", lat: 39.6542, lng: 66.9750 },
  bukhara: { name: "Buxoro", lat: 39.7747, lng: 64.4286 },
};

// Determine delivery zone and fee
export function getDeliveryZoneInfo(distKm) {
  if (distKm <= 3) {
    return {
      zone: "A",
      name: "A zona — Markaziy",
      eta: "20–25 min",
      fee: 10000,
      freeThreshold: 150000,
    };
  } else if (distKm <= 6) {
    return {
      zone: "B",
      name: "B zona — O'rta",
      eta: "25–30 min",
      fee: 15000,
      freeThreshold: 200000,
    };
  } else if (distKm <= 8) {
    return {
      zone: "C",
      name: "C zona — Tashqi",
      eta: "30–40 min",
      fee: 25000,
      freeThreshold: 250000,
    };
  }
  return {
    zone: "D",
    name: "D zona — 8km dan uzoq",
    eta: "45–60 min",
    fee: 35000,
    freeThreshold: 350000,
  };
}

// User-specified LocationMarker component
export function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.5 });
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.8 });
    },
    locationerror(e) {
      console.warn("Location detection error:", e?.message || e);
    },
  });

  // Ensure map container calculates proper size and renders all tiles
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(t);
  }, [map]);

  // Synchronize map center when position changes from outside (e.g. GPS button, city presets)
  useEffect(() => {
    if (position) {
      const lat = typeof position.lat === "number" ? position.lat : position[0];
      const lng = typeof position.lng === "number" ? position.lng : position[1];
      if (typeof lat === "number" && typeof lng === "number") {
        map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
      }
    }
  }, [position, map]);

  // Initial user location detection
  useEffect(() => {
    try {
      map.locate({ enableHighAccuracy: true });
    } catch {
      // ignore
    }
  }, [map]);

  const markerPosition = useMemo(() => {
    if (!position) return null;
    if (Array.isArray(position)) return position;
    if (typeof position.lat === "number" && typeof position.lng === "number") {
      return [position.lat, position.lng];
    }
    return null;
  }, [position]);

  return markerPosition ? (
    <Marker
      position={markerPosition}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          if (marker) {
            setPosition(marker.getLatLng());
          }
        },
      }}
    >
      <Popup>
        <div style={{ color: "#111827", fontSize: "12px", minWidth: "130px" }}>
          <strong style={{ color: "#e63946", display: "block" }}>📍 Yetkazish joyi</strong>
          <span style={{ fontSize: "11px", color: "#4b5563" }}>
            {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
          </span>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

export default function MapPicker({
  onLocationChange,
  defaultLocation = RESTAURANT_LOCATION,
}) {
  const [position, setPosition] = useState({
    lat: defaultLocation.lat || RESTAURANT_LOCATION.lat,
    lng: defaultLocation.lng || RESTAURANT_LOCATION.lng,
  });

  const [address, setAddress] = useState(
    defaultLocation.address || "Toshkent markazi"
  );
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  // Normalize lat & lng
  const currentLat = typeof position.lat === "number" ? position.lat : position[0];
  const currentLng = typeof position.lng === "number" ? position.lng : position[1];

  // Calculate distance
  const distance = useMemo(() => {
    return calculateDistanceKm(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      currentLat,
      currentLng
    );
  }, [currentLat, currentLng]);

  const zoneInfo = useMemo(() => {
    return getDeliveryZoneInfo(distance);
  }, [distance]);

  const lastGeocodedRef = useRef({ lat: null, lng: null });
  useEffect(() => {
    if (
      lastGeocodedRef.current.lat === currentLat &&
      lastGeocodedRef.current.lng === currentLng
    ) {
      return;
    }
    lastGeocodedRef.current = { lat: currentLat, lng: currentLng };
    let isMounted = true;

    reverseGeocode(currentLat, currentLng)
      .then((geoRes) => {
        if (!isMounted) return;
        if (geoRes && (geoRes.fullAddress || geoRes.street || geoRes.displayName)) {
          const readable = geoRes.street
            ? `${geoRes.street}${geoRes.city ? `, ${geoRes.city}` : ""}`
            : geoRes.displayName?.split(",").slice(0, 3).join(",") ||
              `Manzil: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
          setAddress(readable);
        } else {
          setAddress(`Manzil: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddress(`Manzil: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentLat, currentLng]);

  // Notify parent component
  useEffect(() => {
    if (!onLocationChange) return;
    onLocationChange({
      lat: currentLat,
      lng: currentLng,
      address,
      distance,
      zone: zoneInfo.zone,
      deliveryFee: zoneInfo.fee,
    });
  }, [currentLat, currentLng, address, distance, zoneInfo, onLocationChange]);

  // City selection
  const handleCitySelect = (cityKey) => {
    const city = CITIES[cityKey];
    if (!city) return;
    setPosition({ lat: city.lat, lng: city.lng });
  };

  // User location GPS button handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({
        type: "error",
        text: "Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.",
      });
      return;
    }

    setIsLocating(true);
    setGeoStatus({ type: "info", text: "GPS orqali joylashuv qidirilmoqda..." });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setGeoStatus({
          type: "success",
          text: `Joylashuv aniqlandi: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation error:", err.message);
        setGeoStatus({
          type: "error",
          text: "Joylashuvni aniqlashga ruxsat berilmadi yoki signal topilmadi. Xaritadan nuqtani qo'lda tanlang.",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3.5">
      {/* City Presets & Live GPS button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CITIES).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleCitySelect(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                Math.abs(currentLat - v.lat) < 0.05 && Math.abs(currentLng - v.lng) < 0.05
                  ? "bg-[#e63946] text-white shadow-md shadow-[#e63946]/30"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {v.name}
            </button>
          ))}
        </div>

        {/* User Geolocation GPS button */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-50 active:scale-95 cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-blue-200" />
          )}
          {isLocating ? "Aniqlanmoqda..." : "Mening joylashuvim"}
        </button>
      </div>

      {/* Geolocation status indicator */}
      {geoStatus && (
        <div
          className={`text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 border transition ${
            geoStatus.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : geoStatus.type === "error"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
              : "bg-blue-500/10 border-blue-500/20 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {geoStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : geoStatus.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Navigation className="w-4 h-4 shrink-0 text-blue-400 animate-pulse" />
            )}
            <span className="truncate">{geoStatus.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoStatus(null)}
            className="text-white/40 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* User's Exact MapContainer component */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-inner">
        <MapContainer center={position} zoom={13} style={{ height: "360px", width: "100%" }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>

        {/* Floating helper badge */}
        <div className="absolute bottom-2 left-2 right-2 md:right-auto bg-[#0e0b08]/85 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-2 pointer-events-none z-[1000] border border-white/10 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-[#e63946] shrink-0" />
          <span>Nuqtani tanlash uchun xaritaga bosing yoki belgini suring</span>
        </div>
      </div>

      {/* Selected Location and Delivery Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-white/80 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold block">
              Yetkazish manzili
            </span>
            <span className="font-semibold text-white flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-[#e63946] shrink-0" />
              <span className="truncate">{address}</span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded shrink-0">
            {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </span>
        </div>

        <div className="flex flex-wrap justify-between items-center pt-2 border-t border-white/10 text-white/70">
          <span className="flex items-center gap-1">
            Masofa: <strong className="text-white font-bold">{distance} km</strong> · {zoneInfo.name} ({zoneInfo.eta})
          </span>
          <span className="text-[#e63946] font-black text-sm">
            Yetkazish: {zoneInfo.fee.toLocaleString()} so'm
          </span>
        </div>
      </div>
    </div>
  );
}
