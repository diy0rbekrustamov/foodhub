import { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";

export default function CartDrawer() {
  const { cart, setCart, isCartOpen, setIsCartOpen, total } =
    useContext(CartContext);
  const count = cart.reduce((a, c) => a + c.qty, 0);
  if (!isCartOpen) return null;
  return (
    <>
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/60 z-[90]"
      />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w- bg-[#f5f1ea] z-[100] flex flex-col">
        <div className="p-6 flex justify-between items-center border-b">
          <h3 className="font-black text-">Savatingiz · {count}</h3>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-full bg-black/5 text-xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-black text-xl">Savat bo'sh</p>
              <p className="text-sm opacity-60 mt-2">Menyudan taom qo'shing</p>
            </div>
          ) : (
            cart.map((i, idx) => (
              <div
                key={idx}
                className="flex gap-3 py-4 border-b border-black/10"
              >
                <img
                  src={i.img}
                  className="w-14 h-14 rounded-xl object-cover"
                  alt=""
                />
                <div className="flex-1">
                  <p className="font-bold text-sm">{i.name}</p>
                  <p className="text- opacity-60">{i.sauce}</p>
                  <p className="text-xs font-bold">
                    {i.price.toLocaleString()} x {i.qty}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setCart(cart.filter((_, j) => j !== idx))}
                    className="text- underline opacity-60"
                  >
                    O'chirish
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCart(
                          cart.map((c, j) =>
                            j === idx
                              ? { ...c, qty: Math.max(1, c.qty - 1) }
                              : c,
                          ),
                        )
                      }
                      className="w-6 h-6 border rounded-full"
                    >
                      −
                    </button>
                    <span className="font-bold text-sm">{i.qty}</span>
                    <button
                      onClick={() =>
                        setCart(
                          cart.map((c, j) =>
                            j === idx ? { ...c, qty: c.qty + 1 } : c,
                          ),
                        )
                      }
                      className="w-6 h-6 border rounded-full"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-black/[0.02] border-t">
          <div className="flex justify-between text-sm opacity-60">
            <span>Oraliq</span>
            <span>{total.toLocaleString()} so'm</span>
          </div>
          <div className="flex justify-between font-black text- mt-2">
            <span>Jami</span>
            <span>{(total + 5000).toLocaleString()} so'm</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => setIsCartOpen(false)}
            className="block text-center mt-4 bg-[#e63946] text-white py-4 rounded-full font-extrabold"
          >
            Rasmiylashtirish
          </Link>
        </div>
      </aside>
    </>
  );
}
