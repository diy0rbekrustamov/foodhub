import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
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

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyC6wA-wLsoAGFJXGbPqJSzfxVglAjahAKE";

const DEFAULT_CENTER = { lat: 39.7747, lng: 64.4286 }; // Bukhara center

const CITY_PRESETS = [
  { name: "Buxoro", lat: 39.7747, lng: 64.4286, zoom: 13 },
  { name: "Toshkent", lat: 41.311082, lng: 69.279654, zoom: 12 },
  { name: "Samarqand", lat: 39.6542, lng: 66.9750, zoom: 13 },
  { name: "Farg'ona", lat: 40.3842, lng: 71.7843, zoom: 13 },
  { name: "Andijon", lat: 40.7821, lng: 72.3442, zoom: 13 },
];

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
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);

  // Address search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Filter state inside map
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const searchDebounceRef = useRef(null);

  // Center map on selected branch or form coordinates
  const lastCenterKeyRef = useRef("");
  useEffect(() => {
    let target = null;
    if (formCoordinates?.lat && formCoordinates?.lng) {
      target = { lat: Number(formCoordinates.lat), lng: Number(formCoordinates.lng) };
    } else if (selectedBranch?.latitude && selectedBranch?.longitude) {
      target = { lat: Number(selectedBranch.latitude), lng: Number(selectedBranch.longitude) };
    }

    if (target) {
      const key = `${target.lat.toFixed(4)}_${target.lng.toFixed(4)}`;
      if (lastCenterKeyRef.current !== key) {
        lastCenterKeyRef.current = key;
        setMapCenter(target);
        setZoom(15);
      }
    }
  }, [formCoordinates, selectedBranch]);

  // Handle Search Input with real Geocoding API
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

  // Select Search Result
  const handleSelectSearchResult = (result) => {
    setMapCenter({ lat: result.lat, lng: result.lng });
    setZoom(15);
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

  // Handle Map Click (to place or move pin)
  const handleMapClick = useCallback(
    async (e) => {
      if (!e.detail?.latLng) return;
      const { lat, lng } = e.detail.latLng;

      if (onCoordinateChange) {
        // Reverse geocode to get street and city
        const geoInfo = await reverseGeocode(lat, lng);
        onCoordinateChange({
          lat,
          lng,
          address: geoInfo?.street ? `${geoInfo.street}, ${geoInfo.city}` : `Koordinatalar: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: geoInfo?.city || "",
          country: geoInfo?.country || "O'zbekiston",
        });
      } else if (onAddAtCoordinates) {
        const geoInfo = await reverseGeocode(lat, lng);
        onAddAtCoordinates({
          lat,
          lng,
          address: geoInfo?.street ? `${geoInfo.street}, ${geoInfo.city}` : `Koordinatalar: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: geoInfo?.city || "Buxoro",
          country: geoInfo?.country || "O'zbekiston",
        });
      }
    },
    [onCoordinateChange, onAddAtCoordinates]
  );

  // Filter branches for markers
  const filteredBranches = branches.filter((b) => {
    const matchCity = cityFilter === "all" || b.city?.toLowerCase() === cityFilter.toLowerCase();
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && b.isActive) ||
      (statusFilter === "inactive" && !b.isActive);
    return matchCity && matchStatus;
  });

  return (
    <div className="relative w-full h-[520px] md:h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#14100c]">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row gap-2 pointer-events-none">
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
            <div className="absolute left-0 right-0 mt-2 bg-[#1a1612]/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition flex items-start gap-2.5 group"
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

        {/* City Presets Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                setMapCenter({ lat: city.lat, lng: city.lng });
                setZoom(city.zoom);
                setCityFilter("all");
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0e0b08]/85 backdrop-blur-md hover:bg-white/15 border border-white/10 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-lg"
            >
              <Compass className="w-3 h-3 text-[#e63946]" />
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Stats Overlay */}
      <div className="absolute top-18 md:top-16 left-4 z-20 flex items-center gap-2 pointer-events-auto">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0e0b08]/85 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white shadow-lg focus:outline-none"
        >
          <option value="all">Barcha holatlar ({branches.length})</option>
          <option value="active">Faqat Faol ({branches.filter((b) => b.isActive).length})</option>
          <option value="inactive">Faqat Nofaol ({branches.filter((b) => !b.isActive).length})</option>
        </select>
      </div>

      {/* Interactive Google Map */}
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          style={{ width: "100%", height: "100%" }}
          defaultCenter={DEFAULT_CENTER}
          center={mapCenter}
          defaultZoom={13}
          zoom={zoom}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        >
          {/* Form / New Branch Target Pin (Draggable / Highlighted) */}
          {formCoordinates && (
            <AdvancedMarker
              position={{
                lat: Number(formCoordinates.lat),
                lng: Number(formCoordinates.lng),
              }}
            >
              <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center animate-bounce">
                <div className="bg-[#e63946] text-white px-3 py-1 rounded-full text-xs font-black shadow-2xl flex items-center gap-1 border-2 border-white ring-4 ring-[#e63946]/40">
                  <Crosshair className="w-3.5 h-3.5" />
                  Yangi Filial Nuqtasi
                </div>
                <div className="w-3 h-3 bg-[#e63946] rotate-45 -mt-1.5 border-r border-b border-white" />
              </div>
            </AdvancedMarker>
          )}

          {/* Existing Branch Markers */}
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            const lat = Number(branch.latitude);
            const lng = Number(branch.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <AdvancedMarker
                key={branch.id}
                position={{ lat, lng }}
                onClick={() => onSelectBranch && onSelectBranch(branch)}
              >
                <div
                  className={`relative -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer transition transform hover:scale-110 ${
                    isSelected ? "scale-110 z-30" : "z-10"
                  }`}
                >
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black shadow-xl flex items-center gap-1 border whitespace-nowrap ${
                      isSelected
                        ? "bg-amber-400 text-black border-amber-300 ring-4 ring-amber-400/30"
                        : branch.isActive
                        ? "bg-[#1a1612] text-white border-emerald-500/50 hover:border-emerald-400"
                        : "bg-neutral-800 text-white/50 border-neutral-700 opacity-60"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        branch.isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    <span>{branch.name}</span>
                  </div>
                  <div
                    className={`w-2.5 h-2.5 rotate-45 -mt-1.5 shadow ${
                      isSelected
                        ? "bg-amber-400"
                        : branch.isActive
                        ? "bg-[#1a1612]"
                        : "bg-neutral-800"
                    }`}
                  />
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>

      {/* Selected Branch Floating Card */}
      {selectedBranch && !isFormOpen && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-30 bg-[#0e0b08]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom">
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
              className="text-white/40 hover:text-white text-xs p-1"
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
              {Number(selectedBranch.latitude).toFixed(4)}, {Number(selectedBranch.longitude).toFixed(4)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleStatus(selectedBranch)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
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
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#e63946] hover:bg-[#ff4d5c] text-white transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Tahrirlash
              </button>

              <button
                type="button"
                onClick={() => onDeleteBranch(selectedBranch)}
                className="p-1.5 rounded-lg text-xs text-white/60 hover:text-red-400 hover:bg-white/10 transition"
                title="O'chirish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Helper Tip */}
      <div className="absolute bottom-3 right-3 z-20 hidden md:flex items-center gap-2 bg-[#0e0b08]/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white/70 shadow-lg pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-[#e63946]" />
        <span>Filial qo'shish uchun xaritadagi istalgan nuqtaga bosing</span>
      </div>
    </div>
  );
}
