import { createContext, useState } from "react";
export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const addToCart = (item, qty = 1, sauce = null) => {
    setCart((prev) => {
      const ex = prev.find((p) => p.uid === item.uid && p.sauce === sauce);
      if (ex)
        return prev.map((p) => (p === ex ? { ...p, qty: p.qty + qty } : p));
      return [...prev, { ...item, qty, sauce }];
    });
  };

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        isCartOpen,
        setIsCartOpen,
        selectedItem,
        setSelectedItem,
        addToCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
