import { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { Plus } from "lucide-react";

export default function MenuCard({ item }) {
  const { addToCart, setSelectedItem } = useContext(CartContext);
  const isAvailable = item.isAvailable !== false;

  return (
    <div
      onClick={() => isAvailable && setSelectedItem(item)}
      className={`bg-[#1a1612] text-[#f5f1ea] rounded-2xl overflow-hidden transition flex flex-col justify-between ${
        isAvailable
          ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl shadow-lg border border-white/5 hover:border-white/15"
          : "opacity-60 grayscale cursor-not-allowed border border-white/5"
      }`}
    >
      <div className="relative h-48 w-full bg-black/20 overflow-hidden">
        <img
          src={item.img || item.imageUrl}
          className="w-full h-full object-cover transition duration-300 hover:scale-105"
          alt={item.name}
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-600/90 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Tugagan
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between text-[11px] uppercase tracking-widest opacity-60 mb-2 font-bold">
            <span className="text-[#e63946]">{item.cat || item.categoryId}</span>
            {item.cal ? <span>{item.cal} kcal</span> : null}
          </div>
          <h3 className="font-black text-lg leading-tight text-white">{item.name}</h3>
          <p className="text-xs opacity-60 line-clamp-2 mt-1.5 text-white/70">
            {item.desc || item.description}
          </p>
        </div>

        <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/10">
          <span className="font-black text-sm md:text-base text-white">
            {(item.price || 0).toLocaleString()} <span className="text-xs font-normal text-white/60">so'm</span>
          </span>
          <button
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) addToCart(item);
            }}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition ${
              isAvailable
                ? "bg-[#e63946] hover:bg-[#ff4d5c] text-white shadow-md shadow-[#e63946]/20"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}
