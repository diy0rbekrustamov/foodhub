import { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartDrawer() {
  const { cart, setCart, isCartOpen, setIsCartOpen, total } = useContext(CartContext);
  const count = cart.reduce((a, c) => a + c.qty, 0);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#f5f1ea] z-[100] flex flex-col shadow-2xl text-[#1a1612]">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#e63946]" />
            <h3 className="font-black text-xl">Savatingiz · {count} ta</h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-24 text-black/50">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-black text-xl text-black">Savat bo'sh</p>
              <p className="text-xs text-black/60 mt-1">
                Menyudan o'zingizga yoqqan taomlarni tanlang
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-3 bg-white rounded-2xl border border-black/5 shadow-sm"
              >
                <img
                  src={item.img || item.imageUrl}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-black/5"
                  alt={item.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-[#1a1612]">{item.name}</p>
                  {item.sauce && (
                    <p className="text-[11px] text-black/50">{item.sauce}</p>
                  )}
                  <p className="text-xs font-black text-[#e63946] mt-1">
                    {(item.price || 0).toLocaleString()} so'm
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => setCart(cart.filter((_, j) => j !== idx))}
                    className="text-black/40 hover:text-red-500 transition p-1"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 bg-black/5 px-2 py-1 rounded-full">
                    <button
                      onClick={() =>
                        setCart(
                          cart.map((c, j) =>
                            j === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c
                          )
                        )
                      }
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs min-w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() =>
                        setCart(
                          cart.map((c, j) =>
                            j === idx ? { ...c, qty: c.qty + 1 } : c
                          )
                        )
                      }
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-black/10 shadow-lg">
            <div className="space-y-1.5 text-xs text-black/60">
              <div className="flex justify-between">
                <span>Oraliq summa:</span>
                <span className="font-mono text-black font-semibold">{total.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span>Yetkazib berish (boshlang'ich):</span>
                <span>{total > 150000 ? "Bepul" : "15 000 so'm"}</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-lg text-black mt-3 pt-3 border-t border-black/10">
              <span>Jami:</span>
              <span className="text-[#e63946]">
                {(total + (total > 150000 ? 0 : 15000)).toLocaleString()} so'm
              </span>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="block text-center mt-4 bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3.5 rounded-full font-black text-sm shadow-xl shadow-[#e63946]/25 transition"
            >
              Buyurtmaga o'tish →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
