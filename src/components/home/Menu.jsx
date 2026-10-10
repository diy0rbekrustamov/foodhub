import { useState, useMemo, useEffect } from "react";
import { getCategories, getProducts } from "../../firebase/services";
import { menu as fallbackMenu } from "../../data/menuData";
import MenuCard from "./MenuCard";
import { RefreshCw } from "lucide-react";

export default function Menu() {
  const [cat, setCat] = useState("all");
  const [products, setProducts] = useState(fallbackMenu);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories().catch(() => []),
          getProducts().catch(() => []),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (prods && prods.length > 0) {
          // Normalize uid to id if needed for compatibility
          const normalized = prods.map((p) => ({
            ...p,
            uid: p.id || p.uid,
            cat: p.categoryId || p.cat,
            img: p.imageUrl || p.img,
            cal: p.calories || p.cal || 0,
            desc: p.description || p.desc || "",
          }));
          setProducts(normalized);
        }
      } catch (err) {
        console.warn("Using fallback menu data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const categoryList = useMemo(() => {
    if (categories.length > 0) {
      return [{ slug: "all", name: "Barchasi" }, ...categories];
    }
    return [
      { slug: "all", name: "Barchasi" },
      { slug: "burgers", name: "Burgerlar" },
      { slug: "pizza", name: "Pitsa" },
      { slug: "chicken", name: "Tovuq" },
      { slug: "sides", name: "Snegki" },
      { slug: "drinks", name: "Ichimliklar" },
      { slug: "combos", name: "Kombo" },
    ];
  }, [categories]);

  const filtered = useMemo(() => {
    return cat === "all" ? products : products.filter((m) => m.cat === cat || m.categoryId === cat);
  }, [cat, products]);

  return (
    <section id="menu" className="bg-[#f5f1ea] text-[#1a1612] py-20 px-5 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#e63946] mb-2">
              Mazali & Toza
            </p>
            <h2 className="font-black text-4xl md:text-5xl leading-[0.95] tracking-tighter">
              To'liq <span className="text-[#e63946] italic">menyu.</span>
            </h2>
          </div>
          <p className="max-w-md text-black/60 text-sm">
            Kategoriya tanlang, sevimli taomlarni savatga yig'ing va bir necha daqiqada buyurtma bering.
          </p>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-black/15">
          {categoryList.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition ${
                cat === c.slug
                  ? "bg-[#1a1612] text-[#f5f1ea] shadow-md"
                  : "bg-black/5 hover:bg-black/10 text-black/80"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#e63946]" />
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <MenuCard key={item.id || item.uid} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
