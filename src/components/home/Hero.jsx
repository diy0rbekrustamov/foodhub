import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0e0b08] text-[#f5f1ea] pt-32 pb-20 px-5 md:px-12">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_20%,rgba(230,57,70,0.28),transparent_65%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative z-10">
        <div>
          <p className="flex items-center gap-2 text-xs tracking-[0.14em] uppercase text-[#ff8c66] mb-6 font-bold">
            <span className="w-7 h-px bg-[#ff8c66]"></span> 2019 yildan — kechki oshxona
          </p>
          <h1 className="font-black text-5xl md:text-6xl lg:text-7xl leading-[0.92] tracking-tighter">
            Yassilandi.
            <br />
            Qovurildi.
            <br />
            <span className="text-[#e63946] italic">Yetkazildi.</span>
          </h1>
          <p className="text-base md:text-lg leading-[1.6] max-w-lg text-white/70 mt-6 mb-9">
            Qo'lda shakllangan kotletlar 600°F da, xamir 48 soat fermentatsiya qilingan. Toshkent bo'ylab 30 daqiqada issiq holda yetkazamiz.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() =>
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-8 py-4 rounded-full font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-[#e63946]/25 transition"
            >
              Buyurtma berish <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how"
              className="border border-white/20 hover:border-white px-8 py-4 rounded-full font-bold text-sm text-white/80 hover:text-white transition"
            >
              Qanday ishlaydi
            </a>
          </div>
        </div>

        {/* Visual asset */}
        <div className="relative aspect-square max-w-md w-full justify-self-center">
          <div className="absolute inset-[6%] rounded-full bg-[#1a1612] shadow-[inset_0_0_80px_rgba(230,57,70,0.2)]" />
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
            className="absolute inset-0 w-full h-full object-cover rounded-full shadow-2xl border-2 border-white/10"
            alt="FoodHub Juicy Burger"
          />
          <div className="absolute -bottom-3 right-6 bg-[#1a1612]/90 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <p className="text-[11px] text-white/50 uppercase font-bold">O'rtacha yetkazish</p>
              <p className="text-sm font-black text-white">27 daqiqa</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
