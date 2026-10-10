export default function HowItWorks() {
  return (
    <section id="how" className="bg-[#1a1612] text-[#f5f1ea] py-20 px-5 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-7 items-end mb-16">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#e63946] mb-2">
              Tezkor va Qulay
            </p>
            <h2 className="font-black text-4xl md:text-5xl leading-[0.92] tracking-tighter">
              Uch qadam.
              <br />
              <span className="text-[#e63946] italic">Yigirma yetti daqiqa.</span>
            </h2>
          </div>
          <p className="text-white/60 text-sm max-w-sm">
            Ilova yuklash shart emas. Ortiqcha ro'yxatdan o'tishlar yo'q. Bir necha tugma orqali issiq ovqat eshigingizda bo'ladi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              t: "Buyurtmani yig'ing",
              d: "Menyudan taomlarni tanlang, sous va qo'shimchalarni sozlang, savatga qo'shing.",
            },
            {
              n: "02",
              t: "Manzilni xaritada tanlang",
              d: "Google Maps orqali aniq lokatsiyangizni belgilang yoki joriy joylashuvni aniqlang.",
            },
            {
              n: "03",
              t: "Kuryerni kuting",
              d: "To'lovni kuryer kelganda naqd yoki Click / Payme / Uzum orqali amalga oshiring.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:-translate-y-1.5 transition shadow-lg"
            >
              <span className="font-black text-5xl leading-none text-[#e63946]">
                {s.n}
              </span>
              <h3 className="font-extrabold text-xl mt-4 text-white">{s.t}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
