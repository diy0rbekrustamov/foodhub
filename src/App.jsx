import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFound from "./pages/NotFound.jsx";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginRoute = location.pathname === "/login";
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuota);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0e0b08] text-[#f5f1ea]">
      {/* Google Maps Platform Demo Key In-App Banner */}
      {mapsQuotaExceeded && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs text-center sticky top-0 z-[120] shadow-sm backdrop-blur-md">
          <span>
            Google Maps Platform kvotasiga yetildi. Agar siz ilova egasi bo'lsangiz, ko'rsatmalarni{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-amber-300 hover:text-white"
            >
              Google Maps dasturchilar sahifasida
            </a>{" "}
            ko'ring.
          </span>
        </div>
      )}

      {/* Hide standard navbar on Admin and Login screens */}
      {!isAdminRoute && !isLoginRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Hide standard footer on Admin and Login screens */}
      {!isAdminRoute && !isLoginRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
