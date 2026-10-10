import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin, Navigation, Compass, AlertCircle } from "lucide-react";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyC6wA-wLsoAGFJXGbPqJSzfxVglAjahAKE";

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

// Calculate Haversine distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Determine delivery zone and fee
export function getDeliveryZoneInfo(distKm) {
  if (distKm <= 3) {
    return { zone: "A", name: "A zona — Markaziy", eta: "20–25 min", fee: 10000, freeThreshold: 150000 };
  } else if (distKm <= 6) {
    return { zone: "B", name: "B zona — O'rta", eta: "25–30 min", fee: 15000, freeThreshold: 200000 };
  } else if (distKm <= 8) {
    return { zone: "C", name: "C zona — Tashqi", eta: "30–40 min", fee: 25000, freeThreshold: 250000 };
  }
  return { zone: "D", name: "D zona — 8km dan uzoq", eta: "45–60 min", fee: 35000, freeThreshold: 350000 };
}

export default function MapPicker({ onLocationChange, defaultLocation = RESTAURANT_LOCATION }) {
  const [pos, setPos] = useState({
    lat: defaultLocation.lat || RESTAURANT_LOCATION.lat,
    lng: defaultLocation.lng || RESTAURANT_LOCATION.lng,
    address: defaultLocation.address || "Toshkent markazi",
  });
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Derived calculations (no cascading setState)
  const distance = useMemo(() => {
    return calculateDistanceKm(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      pos.lat,
      pos.lng
    );
  }, [pos.lat, pos.lng]);

  const zoneInfo = useMemo(() => {
    return getDeliveryZoneInfo(distance);
  }, [distance]);

  // Memoized change notifier to prevent infinite render loops
  const lastNotifiedRef = useRef("");

  useEffect(() => {
    if (!onLocationChange) return;
    const key = `${pos.lat.toFixed(5)}_${pos.lng.toFixed(5)}_${pos.address}`;
    if (lastNotifiedRef.current === key) return;
    lastNotifiedRef.current = key;

    onLocationChange({
      lat: pos.lat,
      lng: pos.lng,
      address: pos.address,
      distance,
      zone: zoneInfo.zone,
      deliveryFee: zoneInfo.fee,
    });
  }, [pos.lat, pos.lng, pos.address, distance, zoneInfo, onLocationChange]);

  // Handle map click to place pin
  const handleMapClick = useCallback((e) => {
    if (!e.detail?.latLng) return;
    const { lat, lng } = e.detail.latLng;
    const newAddress = `Manzil: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setPos({
      lat,
      lng,
      address: newAddress,
    });
    setGeoError(null);
  }, []);

  // Use Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setPos({
          lat: latitude,
          lng: longitude,
          address: "Sizning joriy joylashuvingiz",
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation error:", err.message);
        setGeoError("Joylashuv aniqlanmadi. Xaritadan nuqtani tanlang.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      {/* City Presets & GPS Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CITIES).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPos({ lat: v.lat, lng: v.lng, address: `${v.name} markazi` })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                Math.abs(pos.lat - v.lat) < 0.05 && Math.abs(pos.lng - v.lng) < 0.05
                  ? "bg-[#e63946] text-white shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {v.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-[#e63946]" : ""}`} />
          {isLocating ? "Aniqlanmoqda..." : "Mening joylashuvim"}
        </button>
      </div>

      {geoError && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {geoError}
        </div>
      )}

      {/* Map Container */}
      <div className="relative h-64 md:h-72 w-full rounded-2xl overflow-hidden border border-white/15 shadow-inner">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ width: "100%", height: "100%" }}
            defaultCenter={{ lat: pos.lat, lng: pos.lng }}
            center={{ lat: pos.lat, lng: pos.lng }}
            defaultZoom={13}
            zoom={14}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          >
            {/* User Selected Marker */}
            <AdvancedMarker position={{ lat: pos.lat, lng: pos.lng }}>
              <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div className="bg-[#e63946] text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 whitespace-nowrap">
                  <MapPin className="w-3 h-3" />
                  Yetkazish joyi
                </div>
                <div className="w-3 h-3 bg-[#e63946] rotate-45 -mt-1.5 shadow" />
              </div>
            </AdvancedMarker>

            {/* Restaurant Central Kitchen Marker */}
            <AdvancedMarker position={RESTAURANT_LOCATION}>
              <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center opacity-85">
                <div className="bg-[#1a1612] text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold shadow whitespace-nowrap">
                  🍔 FoodHub Markazi
                </div>
                <div className="w-2 h-2 bg-[#1a1612] rotate-45 -mt-1" />
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>

        {/* Floating Helper Tip */}
        <div className="absolute bottom-2 left-2 right-2 md:right-auto bg-[#0e0b08]/80 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-[#e63946]" />
          <span>Nuqtani belgilash uchun xaritaga bosing</span>
        </div>
      </div>

      {/* Selected Location and Delivery Summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white/80 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#e63946]" /> {pos.address}
          </span>
          <span className="font-mono text-white/50">
            {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
          </span>
        </div>
        <div className="flex flex-wrap justify-between items-center pt-2 border-t border-white/10 text-white/70">
          <span>
            Masofa: <strong className="text-white">{distance} km</strong> · {zoneInfo.name} ({zoneInfo.eta})
          </span>
          <span className="text-[#e63946] font-bold">
            Yetkazish: {zoneInfo.fee.toLocaleString()} so'm
          </span>
        </div>
      </div>
    </div>
  );
}
