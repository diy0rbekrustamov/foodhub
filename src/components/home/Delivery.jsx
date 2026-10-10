import MapPicker from "../map/MapPicker";

export default function Delivery() {
  return (
    <section id="delivery" className="bg-[#f5f1ea] text-[#1a1612] py-20 px-5 md:px-12">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-[#e63946] mb-2">
            Logistika
          </p>
          <h2 className="font-black text-4xl md:text-5xl leading-[0.92] tracking-tighter">
            Tez <span className="text-[#e63946] italic">yetkazamiz.</span>
          </h2>
          <p className="text-black/60 mt-4 text-sm leading-relaxed">
            Oshxonamizdan 8km radiusda yetkazib beramiz. Maxsus termobokslar taomning haroratini 60°C dan yuqori saqlaydi.
          </p>

          <div className="mt-8 space-y-3">
            {[
              {
                n: "A zona — Markaziy",
                m: "0–3 km · 150 ming+ bepul",
                eta: "20–25 min",
                price: "10 000 so'm",
              },
              {
                n: "B zona — O'rta",
                m: "3–6 km · 200 ming+ bepul",
                eta: "25–30 min",
                price: "15 000 so'm",
              },
              {
                n: "C zona — Tashqi",
                m: "6–8 km · 250 ming+ bepul",
                eta: "30–40 min",
                price: "25 000 so'm",
              },
            ].map((z) => (
              <div
                key={z.n}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-black/5 shadow-sm"
              >
                <div className="w-10 h-10 bg-[#e63946]/10 text-[#e63946] font-black rounded-xl flex items-center justify-center shrink-0">
                  {z.n.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[#1a1612]">{z.n}</p>
                  <p className="text-xs text-black/50">{z.m}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm block">{z.eta}</span>
                  <span className="text-[11px] text-black/40">{z.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1612] text-white p-6 md:p-8 rounded-3xl shadow-xl border border-white/10">
          <div className="mb-4">
            <h3 className="font-black text-xl">Xaritada Manzilni Aniqlash</h3>
            <p className="text-xs text-white/60 mt-1">
              Xaritaga bosib yoki GPS orqali joylashuvingizni belgilang
            </p>
          </div>
          <MapPicker />
        </div>
      </div>
    </section>
  );
}
