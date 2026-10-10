import MapPicker from "../map/MapPicker";
export default function Delivery() {
  return (
    <section
      id="delivery"
      className="bg-[#f5f1ea] text-[#1a1612] py- px-5 md:px-"
    >
      <div className="max-w- mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-10">
        <div>
          <h2 className="font-black text- leading-[0.9] tracking-tighter">
            Tez <span className="text-[#e63946] italic">yetkazamiz.</span>
          </h2>
          <p className="text-black/60 mt-6 max-w-">
            Oshxonadan 8km radiusda, zonalarga bo'lingan.
          </p>
          <div className="mt-8 space-y-3">
            {[
              {
                n: "A zona — Markaziy",
                m: "0–3 km · 150 ming+ bepul",
                eta: "22 min",
              },
              { n: "B zona — O'rta", m: "3–6 km · 15 ming", eta: "28 min" },
              { n: "C zona — Tashqi", m: "6–8 km · 25 ming", eta: "35 min" },
            ].map((z) => (
              <div
                key={z.n}
                className="flex items-center gap-4 bg-white p-4 rounded-xl"
              >
                <div className="w-10 h-10 bg-[#e63946]/10 rounded-full" />
                <div className="flex-1">
                  <p className="font-bold text-">{z.n}</p>
                  <p className="text-xs opacity-60">{z.m}</p>
                </div>
                <span className="font-black">{z.eta}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1a1612] text-white p-7 rounded-">
          <h3 className="font-black text- mb-2">Manzilni xaritadan tanlang</h3>
          <MapPicker />
        </div>
      </div>
    </section>
  );
}
