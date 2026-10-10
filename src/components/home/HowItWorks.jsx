export default function HowItWorks() {
  return (
    <section id="how" className="bg-[#1a1612] text-[#f5f1ea] py- px-5 md:px-">
      <div className="max-w- mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-7 items-end mb-16">
          <h2 className="font-black text- leading-[0.9] tracking-tighter">
            Uch qadam.
            <br />
            <span className="text-[#e63946] italic">Yigirma yetti daqiqa.</span>
          </h2>
          <p className="text-white/60 max-w-">
            Ilova yuklash yo'q. Akkaunt yaratish yo'q. Nimani xohlasangiz
            tanlang.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              n: "01",
              t: "Buyurtmani yig'ing",
              d: "Menyuni ko'rib chiqing, qo'shish uchun bosing.",
            },
            {
              n: "02",
              t: "Manzilni kiriting",
              d: "Bino, kvartira, qorovul kodi. 8km radius.",
            },
            { n: "03", t: "To'lang", d: "Click, Payme, Uzum yoki naqd." },
          ].map((s) => (
            <div
              key={s.n}
              className="bg-white/[0.04] border border-white/10 rounded- p-8 hover:bg-white/[0.07] hover:-translate-y-1 transition"
            >
              <span className="font-black text- leading-none text-[#e63946]">
                {s.n}
              </span>
              <h3 className="font-extrabold text- mt-4">{s.t}</h3>
              <p className="text-sm text-white/60 mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
