import { useContext, useState, useEffect } from "react";
import { CartContext } from "../../context/CartContext";
export default function ItemModal() {
  const {
    selectedItem: item,
    setSelectedItem,
    addToCart,
  } = useContext(CartContext);
  const [qty, setQty] = useState(1);
  const [sauce, setSauce] = useState("Klassik");
  useEffect(() => {
    setQty(1);
    setSauce("Klassik");
  }, [item]);
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
      <div
        onClick={() => setSelectedItem(null)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative bg-[#f5f1ea] w-full max-w- rounded- overflow-hidden max-h- flex flex-col">
        <div className="h- relative bg-[#1a1612]">
          <img src={item.img} className="w-full h-full object-cover" alt="" />
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full font-bold text-xl"
          >
            ×
          </button>
          <span className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text- uppercase font-bold">
            {item.cat}
          </span>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="font-black text-">{item.name}</h3>
          <p className="text-[#e63946] font-black text-2xl">
            {item.price.toLocaleString()} so'm
          </p>
          <p className="text-sm text-black/60 mt-3">{item.desc}</p>
          <div className="mt-5">
            <p className="font-bold text-sm mb-2">Sous</p>
            <div className="flex flex-wrap gap-2">
              {["Klassik", "Achchiq", "Sarimsoqli", "BBQ"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSauce(s)}
                  className={`px-4 py-2 rounded-full border font-bold text-sm ${sauce === s ? "bg-black text-white" : "bg-white border-black/10"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex items-center justify-between bg-[#f5f1ea]">
          <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 border">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-8 h-8 rounded-full hover:bg-black hover:text-white"
            >
              −
            </button>
            <span className="font-black w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-8 h-8 rounded-full hover:bg-black hover:text-white"
            >
              +
            </button>
          </div>
          <button
            onClick={() => {
              addToCart(item, qty, sauce);
              setSelectedItem(null);
            }}
            className="bg-[#e63946] text-white px-6 py-3 rounded-full font-bold"
          >
            Qo'shish · {(item.price * qty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}
