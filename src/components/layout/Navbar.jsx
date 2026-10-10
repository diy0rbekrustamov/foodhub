import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { CartContext } from "../../context/CartContext";

export default function Navbar() {
  const { count, setIsCartOpen } = useContext(CartContext);
  const { pathname } = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px- py-3.5 bg-[#0e0b08]/65 backdrop-blur- border-b border-white/10">
      <Link
        to="/"
        className="flex items-center gap-2.5 font-black text- text-[#f5f1ea]"
      >
        <span className="w-9 h-9 bg-[#e63946] rounded-full relative flex items-center justify-center">
          <span className="w-4 h-4 bg-[#0e0b08] rounded-full"></span>
        </span>
        Burner Co.
      </Link>
      <div className="hidden md:flex gap-7 text- uppercase tracking-widest">
        <Link
          to="/menu"
          className={pathname === "/menu" ? "text-white" : "text-white/70"}
        >
          Menyu
        </Link>
        <a href="/#how" className="text-white/70">
          Qanday ishlaydi
        </a>
        <a href="/#delivery" className="text-white/70">
          Yetkazish
        </a>
      </div>
      <button
        onClick={() => setIsCartOpen(true)}
        className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2"
      >
        Savat{" "}
        <span className="bg-[#0e0b08] min-w- h- rounded-full flex items-center justify-center text-xs px-1">
          {count}
        </span>
      </button>
    </nav>
  );
}
