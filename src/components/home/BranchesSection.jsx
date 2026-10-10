import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin, Phone, Clock, Navigation, Compass, ExternalLink, CheckCircle } from "lucide-react";
import { getBranches } from "../../firebase/services";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyC6wA-wLsoAGFJXGbPqJSzfxVglAjahAKE";

export default function BranchesSection() {
  const [branches, setBranches] = useState([]);
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeBranch, setActiveBranch] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.7747, lng: 64.4286 }); // Bukhara
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    async function load() {
      const list = await getBranches(false); // active branches only
      setBranches(list || []);
      if (list && list.length > 0) {
        setActiveBranch(list[0]);
        setMapCenter({ lat: Number(list[0].latitude), lng: Number(list[0].longitude) });
      }
    }
    load();
  }, []);

  // Unique cities from branches
  const cities = Array.from(new Set(branches.map((b) => b.city).filter(Boolean)));

  const filteredBranches = branches.filter((b) => {
    if (selectedCity === "all") return true;
    return b.city?.toLowerCase() === selectedCity.toLowerCase();
  });

  const handleSelectBranch = (branch) => {
    setActiveBranch(branch);
    setMapCenter({ lat: Number(branch.latitude), lng: Number(branch.longitude) });
    setZoom(15);
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
              Buxoro, Toshkent va butun O'zbekiston bo'ylab FoodHub restoranlari. Issiq taomlar, qulay lokatsiyalar va tezkor yetkazib berish.
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCity("all");
                setZoom(12);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCity === "all"
                  ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/30"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Barcha filiallar ({branches.length})
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
                      setMapCenter({ lat: Number(firstInCity.latitude), lng: Number(firstInCity.longitude) });
                      setZoom(14);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
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

        {/* Interactive Map & Branch List Layout */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          {/* Left: Google Map */}
          <div className="relative h-[420px] md:h-[500px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                style={{ width: "100%", height: "100%" }}
                defaultCenter={mapCenter}
                center={mapCenter}
                defaultZoom={13}
                zoom={zoom}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              >
                {filteredBranches.map((branch) => {
                  const isSelected = activeBranch?.id === branch.id;
                  const lat = Number(branch.latitude);
                  const lng = Number(branch.longitude);
                  if (isNaN(lat) || isNaN(lng)) return null;

                  return (
                    <AdvancedMarker
                      key={branch.id}
                      position={{ lat, lng }}
                      onClick={() => handleSelectBranch(branch)}
                    >
                      <div
                        className={`relative -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer transition transform hover:scale-110 ${
                          isSelected ? "scale-115 z-30" : "z-10"
                        }`}
                      >
                        <div
                          className={`px-3 py-1.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-1.5 whitespace-nowrap border ${
                            isSelected
                              ? "bg-[#e63946] text-white border-white ring-4 ring-[#e63946]/30"
                              : "bg-[#0e0b08] text-white border-amber-400/40 hover:border-amber-400"
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{branch.name}</span>
                        </div>
                        <div
                          className={`w-2.5 h-2.5 rotate-45 -mt-1.5 shadow ${
                            isSelected ? "bg-[#e63946]" : "bg-[#0e0b08]"
                          }`}
                        />
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </APIProvider>

            <div className="absolute bottom-3 left-3 bg-[#0e0b08]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-white/80 border border-white/10 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Har bir filialda yangi tayyorlanadi</span>
            </div>
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
                      className="text-xs font-bold text-[#e63946] hover:text-[#ff4d5c] flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Xaritada belgilash
                    </button>

                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" /> Yo'nalish
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
