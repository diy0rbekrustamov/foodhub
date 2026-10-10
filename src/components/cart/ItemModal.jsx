import { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { X, Plus, Minus, Check } from "lucide-react";

function ItemModalContent({ item, onClose, addToCart }) {
  const [qty, setQty] = useState(1);
  const [sauce, setSauce] = useState("Klassik");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <div className="relative bg-[#f5f1ea] text-[#1a1612] w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl z-10">
        {/* Item Image Header */}
        <div className="h-64 relative bg-[#1a1612] overflow-hidden">
          <img
            src={item.img || item.imageUrl}
            className="w-full h-full object-cover"
            alt={item.name}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs uppercase font-extrabold tracking-wider">
            {item.cat || item.categoryId}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-black text-2xl md:text-3xl leading-tight text-[#1a1612]">
                {item.name}
              </h3>
              {item.cal ? (
                <p className="text-xs text-black/50 mt-1 font-semibold">{item.cal} kkal</p>
              ) : null}
            </div>
            <p className="text-[#e63946] font-black text-xl md:text-2xl whitespace-nowrap">
              {(item.price || 0).toLocaleString()} so'm
            </p>
          </div>

          <p className="text-xs md:text-sm text-black/70 leading-relaxed">
            {item.desc || item.description}
          </p>

          {/* Sauce Options */}
          <div className="pt-2">
            <p className="font-bold text-xs uppercase tracking-wider text-black/60 mb-2.5">
              Sousni tanlang
            </p>
            <div className="flex flex-wrap gap-2">
              {["Klassik", "Achchiq", "Sarimsoqli", "BBQ"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSauce(s)}
                  className={`px-4 py-2 rounded-full font-bold text-xs transition border flex items-center gap-1.5 ${
                    sauce === s
                      ? "bg-[#1a1612] text-white border-[#1a1612] shadow-sm"
                      : "bg-white border-black/10 text-black/80 hover:bg-black/5"
                  }`}
                >
                  {sauce === s && <Check className="w-3.5 h-3.5 text-[#e63946]" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-black/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 bg-[#f5f1ea] rounded-full px-3 py-1.5 border border-black/10">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition text-xs"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-black w-6 text-center text-sm">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              addToCart(item, qty, sauce);
              onClose();
            }}
            className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-6 md:px-8 py-3.5 rounded-full font-black text-xs md:text-sm shadow-xl shadow-[#e63946]/25 transition"
          >
            Savatga qo'shish · {((item.price || 0) * qty).toLocaleString()} so'm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItemModal() {
  const { selectedItem: item, setSelectedItem, addToCart } = useContext(CartContext);

  if (!item) return null;
  return (
    <ItemModalContent
      key={item.id || item.uid}
      item={item}
      onClose={() => setSelectedItem(null)}
      addToCart={addToCart}
    />
  );
}
