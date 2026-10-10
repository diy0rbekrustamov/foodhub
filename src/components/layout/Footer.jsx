export default function Footer() {
  return (
    <footer className="bg-[#0e0b08] border-t border-white/10 px-5 md:px- pt-20 pb-8">
      <div className="max-w- mx-auto grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <h2 className="flex items-center gap-3 font-black text- text-white">
            Burner Co.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mt-3 max-w-">
            Kechki oshxona — smash burgerlar, qo'l cho'zilgan pitsa. Amir Temur
            12 dan 8km radiusda.
          </p>
        </div>
        <div>
          <p className="text- uppercase tracking-widest font-extrabold text-white mb-4">
            Menyu
          </p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>Burgerlar</li>
            <li>Pitsa</li>
            <li>Tovuq</li>
          </ul>
        </div>
        <div>
          <p className="text- uppercase tracking-widest font-extrabold text-white mb-4">
            Xizmat
          </p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>Yetkazish</li>
            <li>Kuzatish</li>
          </ul>
        </div>
        <div>
          <p className="text- uppercase tracking-widest font-extrabold text-white mb-4">
            Aloqa
          </p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>+998 71 234 56 67</li>
            <li>03:00 gacha ochiq</li>
          </ul>
        </div>
      </div>
      <div className="max-w- mx-auto mt-16 pt-6 border-t border-white/10 flex justify-between text-xs text-white/30">
        <span>© 2026 Burner Co.</span>
        <span>Kechki ochlik uchun</span>
      </div>
    </footer>
  );
}
