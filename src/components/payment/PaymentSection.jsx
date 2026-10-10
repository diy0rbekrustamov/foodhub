import { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function PaymentSection() {
  const { total } = useContext(CartContext);
  const [method, setMethod] = useState("cash");
  const deliveryFee = total > 150000 || total === 0 ? 0 : 15000;
  const serviceFee = total > 0 ? 5000 : 0;
  const grand = total + deliveryFee + serviceFee;

  return (
    <section className="bg-[#0e0b08] text-white py-20 px-5 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest font-bold text-[#e63946] mb-2">
            To'lov Usullari
          </p>
          <h2 className="font-black text-4xl md:text-5xl leading-tight">
            Qanday <span className="text-[#e63946] italic">to'lashni</span> tanlang
          </h2>
        </div>

        <div className="grid gap-4">
          {/* Recommended: Cash on delivery */}
          <button
            type="button"
            onClick={() => setMethod("cash")}
            className={`text-left p-6 md:p-8 rounded-3xl flex justify-between items-center border-2 transition ${
              method === "cash"
                ? "bg-[#e63946] border-white text-white shadow-xl"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div>
              <p className="font-black text-2xl flex items-center gap-2">
                Naqd pul 💵
              </p>
              <p className="text-xs md:text-sm opacity-80 mt-1">Kuryer eshikka yetib kelganda</p>
            </div>
            <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              Tavsiya etiladi
            </span>
          </button>

          {/* Online payment methods */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: "click", label: "CLICK" },
              { id: "payme", label: "Payme" },
              { id: "uzum", label: "Uzum Bank" },
              { id: "anor", label: "Anorbank" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`py-5 rounded-2xl font-black text-sm border-2 transition ${
                  method === m.id
                    ? "bg-[#e63946] border-[#e63946] text-white shadow-lg"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Quick Order Summary Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mt-4 shadow-xl">
            <div className="space-y-2 text-xs md:text-sm text-white/70">
              <div className="flex justify-between">
                <span>Taomlar qiymati</span>
                <span className="font-mono text-white">{total.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span>Yetkazib berish</span>
                <span className="text-white">
                  {deliveryFee === 0 ? "Bepul" : `${deliveryFee.toLocaleString()} so'm`}
                </span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between">
                  <span>Xizmat ko'rsatish</span>
                  <span className="font-mono text-white">{serviceFee.toLocaleString()} so'm</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center font-black text-2xl md:text-3xl mt-6 pt-6 border-t border-white/10">
              <span>Jami:</span>
              <span className="text-[#e63946]">{grand.toLocaleString()} so'm</span>
            </div>

            <Link
              to="/checkout"
              className="mt-6 w-full bg-[#e63946] hover:bg-[#ff4d5c] text-white py-4 rounded-full font-extrabold text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#e63946]/25 transition"
            >
              Buyurtmani rasmiylashtirish <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
