import { useState, useMemo } from "react";
import { menu } from "../../data/menuData";
import MenuCard from "./MenuCard";

export default function Menu() {
  const [cat, setCat] = useState("all");
  const filtered = useMemo(
    () => (cat === "all" ? menu : menu.filter((m) => m.cat === cat)),
    [cat],
  );
  return (
    <section id="menu" className="bg-[#f5f1ea] text-[#1a1612] py- px-5 md:px-">
      <div className="max-w- mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <h2 className="font-black text- leading-[0.9] tracking-tighter">
            To'liq <span className="text-[#e63946] italic">menyu.</span>
          </h2>
          <p className="max-w- text-black/60">
            Kategoriya tanlang, taom yig'ing, stolga ulashing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mb-9 pb-3 border-b border-black">
          {[
            "all",
            "burgers",
            "pizza",
            "chicken",
            "sides",
            "drinks",
            "combos",
          ].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm ${cat === c ? "bg-black text-white" : "hover:bg-black/5"}`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((i) => (
            <MenuCard key={i.uid} item={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
