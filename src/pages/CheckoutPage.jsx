import { useContext, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, getBranches } from "../firebase/services";
import MapPicker from "../components/map/MapPicker";
import {
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Building2,
  Truck,
  MapPin,
} from "lucide-react";

export default function CheckoutPage() {
  const { cart, total, setCart } = useContext(CartContext);
  const { currentUser } = useAuth();

  const [deliveryType, setDeliveryType] = useState("delivery"); // 'delivery' | 'pickup'
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [locationData, setLocationData] = useState({
    lat: 41.311082,
    lng: 69.279654,
    address: "Toshkent markazi",
    distance: 0,
    deliveryFee: 15000,
  });

  const sub = total;
  // If pickup: 0 delivery fee. If delivery: free over 150k or distance based
  const deliveryFee =
    deliveryType === "pickup"
      ? 0
      : sub > 150000 || sub === 0
      ? 0
      : locationData.deliveryFee || 15000;
  const serviceFee = sub > 0 ? 5000 : 0;
  const grandTotal = sub + deliveryFee + serviceFee;

  const [form, setForm] = useState(() => ({
    name: currentUser?.displayName || "",
    phone: currentUser?.phoneNumber || "+998 ",
    notes: "",
    when: "Imkon qadar tezroq (25-35 min)",
  }));

  const [payMethod, setPayMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load active branches for pickup option
  useEffect(() => {
    async function load() {
      const list = await getBranches(false);
      setBranches(list || []);
      if (list && list.length > 0) {
        setSelectedBranchId(list[0].id);
      }
    }
    load();
  }, []);

  // Update form if user logs in afterwards
  useEffect(() => {
    if (currentUser) {
      if (currentUser.phoneNumber) {
        setForm((f) => (f.phone === "+998 " ? { ...f, phone: currentUser.phoneNumber } : f));
      }
      if (currentUser.displayName) {
        setForm((f) => (!f.name ? { ...f, name: currentUser.displayName } : f));
      }
    }
  }, [currentUser]);

  // Handle map coordinates & address update
  const handleLocationChange = useCallback((loc) => {
    setLocationData((prev) => {
      if (
        prev.lat === loc.lat &&
        prev.lng === loc.lng &&
        prev.address === loc.address &&
        prev.deliveryFee === loc.deliveryFee
      ) {
        return prev;
      }
      return loc;
    });
  }, []);

  // SUBMIT ORDER (Strict Requirement 2: loading states & duplicate prevention)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    setError(null);

    if (!form.name.trim()) {
      setError("Iltimos, ismingizni kiriting.");
      return;
    }

    const cleanPhone = form.phone.replace(/\s+/g, "");
    if (cleanPhone.length < 9) {
      setError("Telefon raqamini to'liq kiriting (+998 90 123 45 67).");
      return;
    }

    if (cart.length === 0) {
      setError("Savatingiz bo'sh. Menyudan taom tanlang.");
      return;
    }

    const selectedBranch = branches.find((b) => b.id === selectedBranchId);

    setLoading(true); // Disable submit button immediately
    const orderNumber = "FH-" + Math.floor(100000 + Math.random() * 900000);

    try {
      await createOrder({
        orderNumber,
        customerId: currentUser?.uid || "guest",
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        deliveryType,
        branchId: deliveryType === "pickup" ? selectedBranchId : null,
        branchName: deliveryType === "pickup" ? selectedBranch?.name : null,
        address:
          deliveryType === "pickup"
            ? `Filialdan olib ketish: ${selectedBranch?.name} (${selectedBranch?.address})`
            : locationData.address || "Xaritadan ko'rsatilgan manzil",
        location: {
          lat: deliveryType === "pickup" ? selectedBranch?.latitude || 39.7731 : locationData.lat,
          lng: deliveryType === "pickup" ? selectedBranch?.longitude || 64.4206 : locationData.lng,
        },
        notes: form.notes.trim(),
        items: cart.map((i) => ({
          id: i.id || i.uid,
          name: i.name,
          price: i.price,
          qty: i.qty,
          sauce: i.sauce || "Klassik",
        })),
        subtotal: sub,
        deliveryFee,
        serviceFee,
        total: grandTotal,
        payMethod,
        status: "pending",
      });

      // Clear cart and show confirmation on success
      setCart([]);
      setSuccess(orderNumber);
    } catch (err) {
      console.error("Order creation error:", err);
      // Keep user on form and re-enable button on error
      setError("Buyurtma yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (success) {
    return (
      <div className="min-h-screen bg-[#0e0b08] text-white flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full bg-[#14100c] border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black">Buyurtma Qabul Qilindi!</h2>
          <p className="text-white/60 text-sm mt-3">
            Oshxonamiz taomlarni tayyorlashni boshladi.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 my-6">
            <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Buyurtma raqami</p>
            <p className="text-2xl font-black text-[#e63946] font-mono mt-1">#{success}</p>
            <p className="text-xs text-white/70 mt-2">
              Jami summa: <strong>{grandTotal.toLocaleString()} so'm</strong> ({payMethod.toUpperCase()})
            </p>
          </div>

          <Link
            to="/"
            className="block w-full bg-[#e63946] hover:bg-[#ff4d5c] py-4 rounded-full font-bold text-sm shadow-xl transition"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f1ea] min-h-screen pt-28 px-5 md:px-12 pb-20 text-[#1a1612]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            to="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black/60 hover:text-black mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Menyuga qaytish
          </Link>
          <h1 className="font-black text-3xl md:text-4xl tracking-tight">
            Buyurtmani Rasmiylashtirish
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-xs md:text-sm text-red-600 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
          {/* LEFT: DELIVERY & LOCATION */}
          <div className="bg-[#1a1612] text-[#f5f1ea] p-6 md:p-10 rounded-3xl shadow-xl space-y-6">
            {/* Delivery vs Pickup Selector */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  deliveryType === "delivery"
                    ? "bg-[#e63946] text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Truck className="w-4 h-4" />
                Yetkazib berish (Kuryer)
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("pickup")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  deliveryType === "pickup"
                    ? "bg-[#e63946] text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Filialdan olib ketish (Pickup)
              </button>
            </div>

            {deliveryType === "delivery" ? (
              <>
                <div>
                  <h2 className="text-2xl font-black mb-1">Yetkazib Berish Manzili</h2>
                  <p className="text-xs text-white/60">
                    Xaritadan aniq nuqtani belgilang, kuryer shu manzilga olib boradi.
                  </p>
                </div>
                {/* Interactive Google Maps Picker */}
                <MapPicker onLocationChange={handleLocationChange} />
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1">FoodHub Filialini Tanlang</h2>
                  <p className="text-xs text-white/60">
                    O'zingizga yaqin filialni tanlang va taomingizni navbatsiz olib keting.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedBranchId === b.id
                          ? "bg-white/10 border-[#e63946] shadow-lg ring-1 ring-[#e63946]"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#e63946]" /> {b.name}
                        </p>
                        <p className="text-xs text-white/60 mt-0.5">
                          {b.city}, {b.address}
                        </p>
                        <p className="text-[10px] text-white/40 mt-1 flex items-center gap-2">
                          <span>{b.phone}</span> · <span>{b.openingHours || "10:00 — 02:00"}</span>
                        </p>
                      </div>
                      <input
                        type="radio"
                        checked={selectedBranchId === b.id}
                        onChange={() => setSelectedBranchId(b.id)}
                        className="accent-[#e63946] w-4 h-4 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Inputs */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                  Ismingiz *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs md:text-sm text-white outline-none focus:border-[#e63946] transition"
                  placeholder="Aziz Karimov"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                  Telefon raqam *
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs md:text-sm text-white outline-none focus:border-[#e63946] transition"
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                  Qavat / Kvartira / Maxsus izoh
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs md:text-sm text-white outline-none focus:border-[#e63946] transition"
                  placeholder="Dom 14, 3-podyezd, 4-qavat, kod 1234..."
                />
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY & PAYMENT */}
          <div className="space-y-6">
            {/* Items summary */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#e63946]" /> Savatdagi Taomlar ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <p className="text-xs text-black/50 py-4">Savat bo'sh. Menyudan taom tanlang.</p>
              ) : (
                <div className="divide-y divide-black/5 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.uid || item.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-sm text-[#1a1612]">{item.name}</p>
                        <p className="text-black/50">
                          {item.qty} dona {item.sauce && `· Sous: ${item.sauce}`}
                        </p>
                      </div>
                      <span className="font-bold text-sm">
                        {(item.price * item.qty).toLocaleString()} so'm
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Calculation */}
              <div className="pt-4 mt-4 border-t border-black/5 space-y-2 text-xs">
                <div className="flex justify-between text-black/60">
                  <span>Taomlar summasi</span>
                  <span>{sub.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Yetkazib berish</span>
                  <span>
                    {deliveryType === "pickup" ? (
                      <span className="text-emerald-600 font-bold">Olib ketish (Bepul)</span>
                    ) : deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">Bepul (Aksiya)</span>
                    ) : (
                      `${deliveryFee.toLocaleString()} so'm`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Xizmat ko'rsatish</span>
                  <span>{serviceFee.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#1a1612] pt-3 border-t border-black/10">
                  <span>Jami to'lov:</span>
                  <span className="text-[#e63946]">{grandTotal.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>

            {/* Payment Method & Submit */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="font-black text-xl mb-4">To'lov Usulini Tanlang</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "cash", label: "Naqd pul 💵" },
                  { id: "click", label: "CLICK" },
                  { id: "payme", label: "Payme" },
                  { id: "uzum", label: "Uzum Bank" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs md:text-sm border-2 transition ${
                      payMethod === m.id
                        ? "bg-[#1a1612] text-white border-[#1a1612] shadow-md"
                        : "bg-white border-black/10 text-black/80 hover:bg-black/5"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Strict Loading & Duplicate Prevention Submit Button (Requirement 2) */}
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full mt-6 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-4 rounded-full font-black text-sm md:text-base shadow-xl shadow-[#e63946]/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Buyurtma rasmiylashtirilmoqda...
                  </>
                ) : (
                  `Tasdiqlash · ${grandTotal.toLocaleString()} so'm`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
