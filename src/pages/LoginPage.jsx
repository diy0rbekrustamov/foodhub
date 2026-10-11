import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, RefreshCw, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const {
    currentUser,
    isAdmin,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    authError,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Handle Email + Password Submit (Login or Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    if (mode === "signup" && !displayName.trim()) {
      setError("Iltimos, ismingizni kiriting.");
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { isAdmin: userIsAdmin } = await signInWithEmail(email, password);
        if (userIsAdmin) {
          navigate("/admin", { replace: true });
        } else {
          const from = location.state?.from || "/";
          navigate(from, { replace: true });
        }
      } else {
        const { isAdmin: userIsAdmin } = await signUpWithEmail(email, password, displayName);
        if (userIsAdmin) {
          navigate("/admin", { replace: true });
        } else {
          const from = location.state?.from || "/";
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      console.warn("Auth error:", err);
      setError(err.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { isAdmin: userIsAdmin } = await signInWithGoogle();
      if (userIsAdmin) {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.warn("Google login error:", err);
      setError(err.message || "Google orqali kirishda xatolik yuz berdi.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0b08] text-[#f5f1ea] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e63946]/20 rounded-full blur-3xl pointer-events-none" />

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
            {mode === "signin"
              ? "Profilingizga kirish uchun email va parolingizni kiriting"
              : "Yangi profil yaratish uchun ma'lumotlaringizni to'ldiring"}
          </p>
        </div>

        {/* Tab switcher: Kirish vs Ro'yxatdan o'tish */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === "signin"
                ? "bg-[#e63946] text-white shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === "signup"
                ? "bg-[#e63946] text-white shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Error message */}
        {(error || authError) && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error || authError}</span>
          </div>
        )}

        {/* Form: Email & Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                Ismingiz
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ism va familiyangiz"
                  required={mode === "signup"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white font-medium outline-none focus:border-[#e63946] transition text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
              Email Manzil
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misol@gmail.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white font-medium outline-none focus:border-[#e63946] transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
              Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-white font-medium outline-none focus:border-[#e63946] transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[#e63946] hover:bg-[#ff4d5c] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 text-sm mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {mode === "signin" ? "Kirilmoqda..." : "Yaratilmoqda..."}
              </>
            ) : (
              <>
                {mode === "signin" ? "Tizimga Kirish" : "Ro'yxatdan O'tish"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative bg-[#1a1612] px-3 text-xs text-white/40 uppercase font-semibold">
            yoki
          </span>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-3 transition disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Google bilan ulanmoqda...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Google orqali kirish</span>
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-white/30 mt-6">
          Kirish orqali siz FoodHub xizmat ko'rsatish shartlariga rozilik bildirasiz.
        </p>
      </div>
    </div>
  );
}
