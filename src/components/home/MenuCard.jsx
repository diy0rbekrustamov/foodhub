import { useContext } from "react";
import { CartContext } from "../../context/CartContext";

export default function MenuCard({ item }) {
  const { addToCart, setSelectedItem } = useContext(CartContext);
  return (
    <div
      onClick={() => setSelectedItem(item)}
      className="bg-[#1a1612] text-[#f5f1ea] rounded- overflow-hidden cursor-pointer hover:-translate-y-1 transition"
    >
      <img src={item.img} className="w-full h- object-cover" alt="" />
      <div className="p-5">
        <div className="flex justify-between text- uppercase tracking-widest opacity-50 mb-2">
          <span className="text-[#e63946] font-bold">{item.cat}</span>
          <span>{item.cal} kcal</span>
        </div>
        <h3 className="font-black text- leading-tight">{item.name}</h3>
        <p className="text- opacity-60 line-clamp-2 mt-1">{item.desc}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="font-black text-">
            {item.price.toLocaleString()} so'm
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(item);
            }}
            className="bg-[#e63946] px-4 py-2 rounded-full font-bold text-sm"
          >
            + Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}
