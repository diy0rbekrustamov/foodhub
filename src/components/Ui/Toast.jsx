import { useContext } from "react";
import { CartContext } from "../../context/CartContext";
export default function Toast() {
  const { toast } = useContext(CartContext);
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1612] text-white px-6 py-4 rounded-2xl flex items-center gap-3 z-[110] shadow-2xl">
      <span className="w-7 h-7 bg-[#e63946] rounded-full flex items-center justify-center font-black">
        ✓
      </span>
      <div>
        <p className="font-bold text-sm">{toast.title}</p>
        <p className="text-xs opacity-60">{toast.sub}</p>
      </div>
    </div>
  );
}
