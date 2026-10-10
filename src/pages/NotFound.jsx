import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0e0b08] text-[#f5f1ea] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-8xl md:text-9xl font-black leading-none text-[#e63946] mb-2 font-mono">
        404
      </h1>
      <h2 className="text-2xl font-black mb-2">Sahifa topilmadi</h2>
      <p className="opacity-60 text-sm max-w-sm mb-8">
        Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan.
      </p>
      <Link
        to="/"
        className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transition"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
