import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0e0b08] border-t border-white/10 px-5 md:px-12 pt-20 pb-8 text-[#f5f1ea]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <h2 className="flex items-center gap-3 font-black text-2xl text-white">
            <span className="w-8 h-8 bg-[#e63946] rounded-full flex items-center justify-center">
              <span className="w-3.5 h-3.5 bg-[#0e0b08] rounded-full"></span>
            </span>
            FoodHub
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mt-4 max-w-sm">
            Kechki oshxona — smash burgerlar, qo'l cho'zilgan pitsa va suvli tovuq. Buxoro, Toshkent va butun respublika bo'ylab tez yetkazib beramiz.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest font-extrabold text-white mb-4">
            Menyu
          </p>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li>
              <Link to="/menu" className="hover:text-white transition">Burgerlar</Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-white transition">Pitsa</Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-white transition">Tovuq qanotlari</Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-white transition">Kombolar</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest font-extrabold text-white mb-4">
            Xizmat
          </p>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li>
              <a href="/#delivery" className="hover:text-white transition">Yetkazish zonalari</a>
            </li>
            <li>
              <a href="/#how" className="hover:text-white transition">Qanday ishlaydi</a>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-white transition">Buyurtmani rasmiylashtirish</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest font-extrabold text-white mb-4">
            Aloqa & Ish Vaqti
          </p>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li className="font-bold text-white">+998 71 234 56 67</li>
            <li>Har kuni 11:00 — 03:00 gacha</li>
            <li>Toshkent sh., Amir Temur ko'chasi, 12</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
        <span>© 2026 FoodHub. Barcha huquqlar himoyalangan.</span>
        <span>Kechki ochlik uchun eng yaxshi tanlov</span>
      </div>
    </footer>
  );
}
