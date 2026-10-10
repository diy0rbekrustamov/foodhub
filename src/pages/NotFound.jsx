export default function NotFound() {
  return (
    <div className="min-h- bg-[#0e0b08] text-[#f5f1ea] flex flex-col items-center justify-center">
      <h1 className="text- font-black leading-none">404</h1>
      <p className="opacity-60">Sahifa topilmadi</p>
      <a
        href="/"
        className="mt-6 bg-[#e63946] px-8 py-3 rounded-full font-bold"
      >
        Bosh sahifa
      </a>
    </div>
  );
}
