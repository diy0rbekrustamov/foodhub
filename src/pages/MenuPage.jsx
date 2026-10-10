import { useState, useMemo } from "react";
import { menu } from "../data/menuData";
import MenuCard from "../components/home/MenuCard";
import CartDrawer from "../components/cart/CartDrawer";
import ItemModal from "../components/cart/ItemModal";

const cats = [
  { id: "all", label: "Hammasi" },
  { id: "burgers", label: "Burgerlar" },
  { id: "pizza", label: "Pitsa" },
  { id: "chicken", label: "Tovuq" },
  { id: "sides", label: "Snegki" },
  { id: "drinks", label: "Ichimliklar" },
  { id: "combos", label: "Kombo" },
];

export default function MenuPage() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return menu.filter((m) => {
      const byCat = active === "all" || m.cat === active;
      const byQ = m.name.toLowerCase().includes(q.toLowerCase());
      return byCat && byQ;
    });
  }, [active, q]);

  return (
    <div className="bg-[#f5f1ea] min-h-screen pt- pb-20 px-5 md:px-">
      <div className="max-w- mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <h1 className="font-black text- leading-[0.9] tracking-tighter text-[#1a1612]">
            To'liq <span className="text-[#e63946] italic">menyu.</span>
          </h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Qidiruv: masalan Smash..."
            className="bg-white border border-black/10 rounded-full px-6 py-3 w-full md:w- outline-none focus:border-[#e63946]"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-10 border-b border-black pb-4">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${active === c.id ? "bg-[#1a1612] text-[#f5f1ea]" : "bg-transparent hover:bg-black/5"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-">
          {filtered.map((item) => (
            <MenuCard key={item.uid} item={item} />
          ))}
        </div>
      </div>
      <CartDrawer />
      <ItemModal />
    </div>
  );
}
