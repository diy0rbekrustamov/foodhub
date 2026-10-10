import Hero from "../components/home/Hero";
import Menu from "../components/home/Menu";
import HowItWorks from "../components/home/HowItWorks";
import Delivery from "../components/home/Delivery";
import BranchesSection from "../components/home/BranchesSection";
import PaymentSection from "../components/payment/PaymentSection";
import CartDrawer from "../components/cart/CartDrawer";
import ItemModal from "../components/cart/ItemModal";

export default function HomePage() {
  return (
    <main className="bg-[#0e0b08]">
      <Hero />
      <Menu />
      <HowItWorks />
      <BranchesSection />
      <Delivery />
      <PaymentSection />
      <CartDrawer />
      <ItemModal />
    </main>
  );
}
