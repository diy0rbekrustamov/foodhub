import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Phone, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, ArrowLeft, Shield, UserCheck } from "lucide-react";

export default function LoginPage() {
  const {
    currentUser,
    isAdmin,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    quickLogin,
    authError,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("+998 ");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoNotice, setInfoNotice] = useState(null);
  const [timer, setTimer] = useState(60);

  const canResend = timer === 0;

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from || "/";
        navigate(from, { replace: true });
      }
    }
  }, [currentUser, isAdmin, navigate, location.state]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Format phone number
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!val.startsWith("+")) {
      setPhone("+" + val);
    } else {
      setPhone(val);
    }
  };

  // Step 1: Send SMS OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoNotice(null);

    const cleanPhone = phone.replace(/\s+/g, "");
    if (cleanPhone.length < 10) {
      setError("Iltimos, to'liq telefon raqamini kiriting (+998 90 123 45 67).");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone, "recaptcha-container");
      setStep("otp");
      setTimer(60);
      if (res?.isSimulation) {
        setInfoNotice("Sinov rejimi: Firebase Phone sozlanmaganligi sababli test kodi faollashdi. Kod: 123456");
        setOtpCode("123456");
      }
    } catch (err) {
      console.warn(err);
      setError(err.message || "SMS kod yuborishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);

    if (otpCode.trim().length !== 6) {
      setError("6 xonali tasdiqlash kodini to'liq kiriting.");
      return;
    }

    setLoading(true);
    try {
      const { isAdmin: userIsAdmin } = await verifyOtp(otpCode.trim());
      if (userIsAdmin) {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.warn(err);
      setError(err.message || "Kod tasdiqlanmadi.");
    } finally {
      setLoading(false);
    }
  };

  // Resend SMS Code
  const handleResend = async () => {
    if (!canResend) return;
    setError(null);
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      const res = await sendOtp(cleanPhone, "recaptcha-container");
      setTimer(60);
      if (res?.isSimulation) {
        setInfoNotice("Sinov rejimi: Test kodi: 123456");
        setOtpCode("123456");
      }
    } catch (err) {
      console.warn(err);
      setError(err.message || "Qayta yuborishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Fallback
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { isAdmin: userIsAdmin } = await signInWithGoogle();
      if (userIsAdmin) {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.warn(err);
      // handled by authError
    } finally {
      setLoading(false);
    }
  };

  // One-click quick login
  const handleQuickLogin = async (role) => {
    setError(null);
    setLoading(true);
    try {
      const { isAdmin: userIsAdmin } = await quickLogin(role);
      if (userIsAdmin) {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.warn(err);
      setError("Tezkor kirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0b08] text-[#f5f1ea] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e63946]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-[#1a1612] border border-white/10 rounded-3xl p-7 md:p-8 shadow-2xl relative z-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Asosiy sahifaga qaytish
        </Link>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#e63946] rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg mb-3">
            <span className="w-6 h-6 bg-[#0e0b08] rounded-full"></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">FoodHub Tizimiga Kirish</h1>
          <p className="text-xs text-white/60 mt-1">
            {step === "phone"
              ? "Telefon raqamingiz orqali SMS kod bilan kiring"
              : `Kod ${phone} raqamiga yuborildi`}
          </p>
        </div>

        {/* Info notice (e.g., simulation mode) */}
        {infoNotice && (
          <div className="mb-5 p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-blue-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoNotice}</span>
          </div>
        )}

        {/* Error message */}
        {(error || authError) && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error || authError}</span>
          </div>
        )}

        {/* STEP 1: Phone input */}
        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                Telefon raqamingiz
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white font-medium outline-none focus:border-[#e63946] transition text-sm"
                  required
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">
                Mamlakat kodi bilan kiriting (masalan: +998...)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 text-xs md:text-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                </>
              ) : (
                <>
                  SMS Kodni Olish <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: OTP Code input */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                  6 Xonali SMS Kod
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setInfoNotice(null);
                  }}
                  className="text-xs text-[#e63946] hover:underline"
                >
                  Raqamni o'zgartirish
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-center text-xl tracking-[0.3em] font-mono outline-none focus:border-[#e63946] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 text-xs md:text-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Tekshirilmoqda...
                </>
              ) : (
                <>
                  Kodni Tasdiqlash <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend timer */}
            <div className="text-center pt-1">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-xs text-[#e63946] hover:underline font-semibold"
                >
                  Kodni qayta yuborish
                </button>
              ) : (
                <p className="text-xs text-white/40">
                  Kodni qayta yuborish: <span className="font-mono text-white/70">{timer}s</span>
                </p>
              )}
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative bg-[#1a1612] px-3 text-xs text-white/40 uppercase">
            Tezkor Kirish
          </span>
        </div>

        {/* Quick Testing & Google Sign In */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("admin")}
            disabled={loading}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Shield className="w-3.5 h-3.5" /> Tezkor Admin Kirish (Diyerbek Rustamov)
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("customer")}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <UserCheck className="w-3.5 h-3.5" /> Tezkor Mijoz Kirish (+998 90 123 45 67)
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-2.5 rounded-2xl text-[11px] font-semibold flex items-center justify-center gap-2 transition"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google orqali kirish (Popup talab qilinadi)
          </button>
        </div>

        <p className="text-center text-[10px] text-white/30 mt-5">
          Kirish orqali siz FoodHub xizmat ko'rsatish shartlariga rozilik bildirasiz.
        </p>
      </div>
    </div>
  );
}
