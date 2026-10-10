import { useEffect, useState } from "react";

const CITIES = {
  tashkent: { name: "Toshkent", lat: 41.311, lng: 69.279 },
  samarkand: { name: "Samarqand", lat: 39.654, lng: 66.975 },
  bukhara: { name: "Buxoro", lat: 39.774, lng: 64.428 },
};

export default function MapPicker() {
  const [pos, setPos] = useState({
    lat: 41.311,
    lng: 69.279,
    label: "Toshkent",
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      setPos({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        label: "Sizning joylashuvingiz",
      });
    });
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(CITIES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setPos({ lat: v.lat, lng: v.lng, label: v.name })}
            className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold hover:bg-white/20"
          >
            {v.name}
          </button>
        ))}
      </div>
      <div className="h- rounded-xl overflow-hidden border border-white/10">
        <iframe
          title="map"
          className="w-full h-full border-0 invert-[0.9] hue-rotate-180"
          src={`https://maps.google.com/maps?q=${pos.lat},${pos.lng}&z=13&output=embed`}
        />
      </div>
      <p className="text-xs opacity-50 mt-2 font-mono">
        {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · {pos.label}
      </p>
    </div>
  );
}
