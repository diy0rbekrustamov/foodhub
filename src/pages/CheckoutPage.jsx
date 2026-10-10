import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { createOrder } from "../firebase/firestore";
import MapPicker from "../components/map/MapPicker";

export default function CheckoutPage() {
  const { cart, total } = useContext(CartContext);
  const sub = total;
  const deliveryFee = sub > 150000 ? 0 : 15000;
  const serviceFee = 5000;
  const grandTotal = sub + deliveryFee + serviceFee;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    apt: "",
    notes: "",
    when: "Imkon qadar tezroq",
  });
  const [payMethod, setPayMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async () => {
    if (!form.name || form.phone.length < 12)
      return alert("Ism va telefonni to'ldir");
    if (cart.length === 0) return alert("Savat bo'sh");
    setLoading(true);
    const orderNum = "BC-" + Math.floor(1000 + Math.random() * 9000);
    await createOrder({
      orderNum,
      items: cart,
      customer: form,
      payMethod,
      total: grandTotal,
      status: "new",
      createdAt: new Date(),
    });
    setLoading(false);
    setSuccess(orderNum);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0e0b08] text-white flex items-center justify-center px-6">
        <div className="max-w- w-full bg-white/5 border border-white/10 rounded- p-10 text-center">
          <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="text-4xl font-black">Buyurtma qabul qilindi!</h2>
          <p className="text-white/60 mt-3">
            Raqamingiz{" "}
            <span className="text-[#e63946] font-black text-2xl">
              #{success}
            </span>
          </p>
          <a
            href="/"
            className="block mt-8 bg-[#e63946] py-4 rounded-full font-bold"
          >
            Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f1ea] min-h-screen pt- px-5 md:px- pb-20">
      <div className="max-w- mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-10">
        {/* LEFT */}
        <div className="bg-[#1a1612] text-[#f5f1ea] p-7 md:p-10 rounded-">
          <h2 className="text-3xl font-black mb-6">Yetkazib berish</h2>
          <MapPicker />

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <div>
              <label className="text- uppercase tracking-widest opacity-60">
                Ismingiz
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#e63946]"
                placeholder="Aziz Karimov"
              />
            </div>
            <div>
              <label className="text- uppercase tracking-widest opacity-60">
                Telefon
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text- uppercase tracking-widest opacity-60">
                Kvartira / Izoh
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                placeholder="Qorovul kodi, qavat..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="bg-white p-7 rounded- shadow-sm">
            <h3 className="font-black text-xl mb-4">Buyurtma</h3>
            {cart.map((i) => (
              <div
                key={i.uid + i.sauce}
                className="flex justify-between py-2 text-sm"
              >
                <span>
                  {i.name} x{i.qty}
                </span>
                <span className="font-bold">
                  {(i.price * i.qty).toLocaleString()} so'm
                </span>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 space-y-2 text-sm text-black/60">
              <div className="flex justify-between">
                <span>Mahsulotlar</span>
                <span>{sub.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span>Yetkazish</span>
                <span>
                  {deliveryFee === 0 ? "Bepul" : deliveryFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-black text-xl text-black pt-2">
                <span>Jami</span>
                <span>{grandTotal.toLocaleString()} so'm</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-">
            <h3 className="font-bold text-sm uppercase tracking-widest opacity-60 mb-4">
              To'lov usuli
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "cash", label: "Naqd 💵" },
                { id: "click", label: "CLICK" },
                { id: "payme", label: "Payme" },
                { id: "uzum", label: "Uzum" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`py-4 rounded-xl font-bold border-2 ${payMethod === m.id ? "bg-[#1a1612] text-white border-black" : "bg-white border-black/10"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="w-full mt-6 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-4 rounded-full font-extrabold text-"
            >
              {loading
                ? "Yuborilmoqda..."
                : `Tasdiqlash · ${grandTotal.toLocaleString()} so'm`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
