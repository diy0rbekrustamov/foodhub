import { useState, useMemo, useEffect } from "react";
import { getCategories, getProducts } from "../firebase/services";
import { menu as initialMenuData } from "../data/menuData";
import MenuCard from "../components/home/MenuCard";
import CartDrawer from "../components/cart/CartDrawer";
import ItemModal from "../components/cart/ItemModal";
import { Search, RefreshCw } from "lucide-react";

export default function MenuPage() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState(initialMenuData);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories().catch(() => []),
          getProducts().catch(() => []),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (prods && prods.length > 0) {
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
      } catch (e) {
        console.warn("Fallback menu used:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categoryList = useMemo(() => {
    if (categories.length > 0) {
      return [{ slug: "all", name: "Hammasi" }, ...categories];
    }
    return [
      { slug: "all", name: "Hammasi" },
      { slug: "burgers", name: "Burgerlar" },
      { slug: "pizza", name: "Pitsa" },
      { slug: "chicken", name: "Tovuq" },
      { slug: "sides", name: "Snegki" },
      { slug: "drinks", name: "Ichimliklar" },
      { slug: "combos", name: "Kombo" },
    ];
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((m) => {
      const byCat = active === "all" || m.cat === active || m.categoryId === active;
      const byQ =
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        (m.desc && m.desc.toLowerCase().includes(q.toLowerCase()));
      return byCat && byQ;
    });
  }, [products, active, q]);

  return (
    <div className="bg-[#f5f1ea] min-h-screen pt-28 pb-20 px-5 md:px-12 text-[#1a1612]">
      <div className="max-w-6xl mx-auto">
        {/* Title and search bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#e63946] mb-2">
              FoodHub Tanlovi
            </p>
            <h1 className="font-black text-4xl md:text-5xl leading-[0.9] tracking-tighter">
              To'liq <span className="text-[#e63946] italic">menyu.</span>
            </h1>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Qidiruv: masalan Smash..."
              className="bg-white border border-black/10 rounded-full pl-11 pr-5 py-3.5 w-full text-xs md:text-sm outline-none focus:border-[#e63946] shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-black/15 pb-4">
          {categoryList.map((c) => (
            <button
              key={c.slug}
              onClick={() => setActive(c.slug)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition ${
                active === c.slug
                  ? "bg-[#1a1612] text-[#f5f1ea] shadow-md"
                  : "bg-white hover:bg-black/5 text-black/80 border border-black/5"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-[#e63946]" />
          </div>
        )}

        {/* Products Grid */}
        {filtered.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/5">
            <p className="font-black text-xl text-black/80">Taom topilmadi</p>
            <p className="text-sm text-black/50 mt-1">Boshqa so'z bilan qidiring yoki kategoriya filtrini tozalang</p>
            <button
              onClick={() => {
                setActive("all");
                setQ("");
              }}
              className="mt-4 px-6 py-2 bg-[#e63946] text-white rounded-full font-bold text-xs"
            >
              Filtrni tozalash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <MenuCard key={item.id || item.uid} item={item} />
            ))}
          </div>
        )}
      </div>

      <CartDrawer />
      <ItemModal />
    </div>
  );
}
