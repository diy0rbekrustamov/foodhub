import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ShoppingBag, User, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const { count, setIsCartOpen } = useContext(CartContext);
  const { currentUser, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 py-4 bg-[#0e0b08]/85 backdrop-blur-md border-b border-white/10">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 font-black text-xl text-[#f5f1ea]">
        <span className="w-9 h-9 bg-[#e63946] rounded-full relative flex items-center justify-center shadow-lg">
          <span className="w-4 h-4 bg-[#0e0b08] rounded-full"></span>
        </span>
        FoodHub
      </Link>

      {/* Navigation links */}
      <div className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-widest">
        <Link
          to="/menu"
          className={pathname === "/menu" ? "text-white" : "text-white/70 hover:text-white transition"}
        >
          Menyu
        </Link>
        <a href="/#branches" className="text-white/70 hover:text-white transition">
          Filiallar
        </a>
        <a href="/#how" className="text-white/70 hover:text-white transition">
          Qanday ishlaydi
        </a>
        <a href="/#delivery" className="text-white/70 hover:text-white transition">
          Yetkazish
        </a>

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-extrabold transition bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20"
          >
            <Shield className="w-3.5 h-3.5" /> Admin Panel
          </Link>
        )}
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-3">
        {/* Auth status */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              {currentUser.phoneNumber || currentUser.email?.split("@")[0] || "Mijoz"}
            </span>
            <button
              onClick={logout}
              title="Chiqish"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </Link>
        )}

        {/* Cart Drawer Trigger */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-4 md:px-5 py-2.5 rounded-full font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Savat</span>
          <span className="bg-[#0e0b08] min-w-5 h-5 rounded-full flex items-center justify-center text-xs px-1.5 font-black">
            {count}
          </span>
        </button>
      </div>
    </nav>
  );
}
