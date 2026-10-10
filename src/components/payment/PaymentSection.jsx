import { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";
export default function PaymentSection() {
  const { total } = useContext(CartContext);
  const [method, setMethod] = useState("cash");
  const grand = total + 5000;
  return (
    <section className="bg-[#0e0b08] text-white py- px-5 md:px-">
      <div className="max-w- mx-auto">
        <h2 className="text-center font-black text- leading-none">
          Qanday <span className="text-[#e63946] italic">to'lashni</span>{" "}
          tanlang
        </h2>
        <div className="mt-12 grid gap-4">
          <button
            onClick={() => setMethod("cash")}
            className={`text-left p-7 rounded- flex justify-between items-center border-2 ${method === "cash" ? "bg-[#e63946] border-white" : "bg-white/5 border-white/10"}`}
          >
            <div>
              <p className="font-black text-2xl">Naqd pul 💵</p>
              <p className="text-sm opacity-70">Kuryer kelganda</p>
            </div>
            <span className="bg-white text-black px-4 py-1 rounded-full text- font-bold">
              TAVSIYA
            </span>
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["click", "payme", "uzum", "anor"].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`py-5 rounded-xl font-black border ${method === m ? "bg-[#e63946] border-[#e63946]" : "bg-white/5 border-white/10"}`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded- p-7 mt-2">
            <div className="flex justify-between text-sm opacity-60">
              <span>Taomlar</span>
              <span>{total.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between font-black text-2xl mt-4 pt-4 border-t border-white/10">
              <span>Jami</span>
              <span>{grand.toLocaleString()} so'm</span>
            </div>
            <Link
              to="/checkout"
              className="block text-center mt-6 bg-[#e63946] py-4 rounded-full font-extrabold"
            >
              Buyurtmani tasdiqlash →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
