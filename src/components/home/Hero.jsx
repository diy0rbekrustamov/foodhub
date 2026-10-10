import { useContext } from "react";
import { CartContext } from "../../context/CartContext";

export default function Hero() {
  const { cart, setIsCartOpen } = useContext(CartContext);
  const count = cart.reduce((a, c) => a + c.qty, 0);

  return (
    <section className="relative overflow-hidden bg-[#0e0b08] text-[#f5f1ea] pt- pb- px-5 md:px-">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_20%,rgba(230,57,70,0.28),transparent_65%)]" />

      <div className="max-w- mx-auto grid lg:grid-cols-[1.05fr_1fr] gap- relative z-10">
        <div>
          <p className="flex items-center gap-2 text-xs tracking-[0.12em] uppercase text-[#ff8c66] mb-6 font-semibold">
            <span className="w-7 h-px bg-[#ff8c66]"></span> 2019 yildan — kechki
            oshxona
          </p>
          <h1 className="font-black text- md:text- lg:text- leading-[0.92] tracking-tighter">
            Yassilandi.
            <br />
            Qovurildi.
            <br />
            <span className="text-[#e63946] italic">Yetkazildi.</span>
          </h1>
          <p className="text- leading-[1.55] max-w- text-white/70 mt-6 mb-9">
            Qo'lla shakllangan kotletlar 600°F da, xamir 48 soat fermentatsiya
            qilingan.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() =>
                document
                  .getElementById("menu")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-[#e63946] hover:bg-[#ff4d5c] text-white px- py- rounded-full font-extrabold"
            >
              Buyurtma berish
            </button>
            <button className="border border-white/25 px-7 py-[16.5px] rounded-full font-bold hover:border-white">
              Qanday ishlaydi
            </button>
          </div>
        </div>
        {/* visual */}
        <div className="relative aspect-square max-w- w-full justify-self-center">
          <div className="absolute inset-[8%] rounded-full bg-[#1a1612] shadow-[inset_0_0_60px_rgba(230,57,70,0.15)]" />
          <img
            src="https://static.tildacdn.com/tild3033-6237-4235-a434-656531306534/photo-1551782450-a21.jpg"
            className="absolute inset-0 w-full h-full object-cover rounded-full"
            alt=""
          />
        </div>
      </div>
    </section>
  );
}
