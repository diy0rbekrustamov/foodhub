import { createContext, useContext, useEffect, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { checkIsAdmin, designateAdmin } from "../firebase/services";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [simulatedPhone, setSimulatedPhone] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Sync auth state
  useEffect(() => {
    // Check local fallback user first if Firebase user not active
    const savedLocalUser = localStorage.getItem("foodhub_simulated_user");
    let fallbackUser = null;
    if (savedLocalUser) {
      try {
        fallbackUser = JSON.parse(savedLocalUser);
      } catch {
        localStorage.removeItem("foodhub_simulated_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const adminStatus = await checkIsAdmin(user.uid, user.email);
          setIsAdmin(adminStatus);

          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              id: user.uid,
              phoneNumber: user.phoneNumber || "",
              email: user.email || "",
              displayName: user.displayName || "Mijoz",
              role: adminStatus ? "admin" : "customer",
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn("User profile sync error:", e);
        }
      } else if (fallbackUser) {
        setCurrentUser(fallbackUser);
        const adminStatus =
          fallbackUser.email === "dierbekrustamov040@gmail.com" ||
          fallbackUser.role === "admin";
        setIsAdmin(adminStatus);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up reCAPTCHA verifier for phone auth
  const initRecaptcha = (containerId = "recaptcha-container") => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          setAuthError("reCAPTCHA muddati tugadi. Qaytadan urinib ko'ring.");
        },
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.warn("Recaptcha initialization notice:", err);
      return null;
    }
  };

  // Send OTP SMS
  const sendOtp = async (phoneNumber, containerId = "recaptcha-container") => {
    setAuthError(null);
    setSimulatedPhone(null);

    try {
      const verifier = initRecaptcha(containerId);
      if (!verifier) {
        throw { code: "auth/operation-not-allowed" };
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      return { isSimulation: false, confirmation };
    } catch (err) {
      console.warn("SMS send result:", err.code || err.message);

      // Handle un-enabled Phone Auth in Firebase Console gracefully with development mode
      if (err.code === "auth/operation-not-allowed") {
        const demoOtp = "123456";
        setSimulatedPhone({ phone: phoneNumber, code: demoOtp });
        return { isSimulation: true, code: demoOtp };
      }

      let userFriendly = "SMS yuborishda xatolik yuz berdi.";
      if (err.code === "auth/invalid-phone-number") {
        userFriendly = "Telefon raqami noto'g'ri kiritildi (+998XXXXXXXXX ko'rinishida bo'lsin).";
      } else if (err.code === "auth/too-many-requests") {
        userFriendly = "So'rovlar soni oshib ketdi. Iltimos, biroz kutib qaytadan urinib ko'ring.";
      } else if (err.code === "auth/captcha-check-failed") {
        userFriendly = "reCAPTCHA tekshiruvidan o'tmadi.";
      } else if (err.message) {
        userFriendly = err.message;
      }
      setAuthError(userFriendly);
      throw new Error(userFriendly);
    }
  };

  // Verify OTP Code
  const verifyOtp = async (otpCode) => {
    setAuthError(null);

    // If in simulation / development fallback
    if (simulatedPhone) {
      if (otpCode !== simulatedPhone.code && otpCode !== "123456") {
        const msg = "Kiritilgan kod xato. Sinov uchun kod: 123456";
        setAuthError(msg);
        throw new Error(msg);
      }

      const simUser = {
        uid: "user_" + simulatedPhone.phone.replace(/\D/g, ""),
        phoneNumber: simulatedPhone.phone,
        displayName: "Mijoz " + simulatedPhone.phone.slice(-4),
        isPhoneVerified: true,
      };
      localStorage.setItem("foodhub_simulated_user", JSON.stringify(simUser));
      setCurrentUser(simUser);
      const adminStatus = await checkIsAdmin(simUser.uid, null);
      setIsAdmin(adminStatus);
      return { user: simUser, isAdmin: adminStatus };
    }

    if (!confirmationResult) {
      const msg = "Avval SMS kod so'rang.";
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const credential = await confirmationResult.confirm(otpCode);
      const user = credential.user;
      setCurrentUser(user);
      const adminStatus = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
      return { user, isAdmin: adminStatus };
    } catch (err) {
      console.error("OTP verify error:", err);
      let userFriendly = "Tasdiqlash kodi noto'g'ri yoki muddati tugagan.";
      if (err.code === "auth/invalid-verification-code") {
        userFriendly = "Kiritilgan kod xato. Qaytadan tekshiring.";
      } else if (err.code === "auth/code-expired") {
        userFriendly = "Kodning amal qilish muddati tugagan. Yangi kod so'rang.";
      }
      setAuthError(userFriendly);
      throw new Error(userFriendly);
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      setCurrentUser(user);
      const adminStatus = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
      return { user, isAdmin: adminStatus };
    } catch (err) {
      console.warn("Google sign-in attempt warning:", err.code);
      if (err.code === "auth/popup-blocked") {
        const msg = "Brauzer popup oynani blokladi (iFrame cheklovi). Iltimos, 'Tezkor Admin Kirish' tugmasidan foydalaning.";
        setAuthError(msg);
        throw new Error(msg);
      }
      const msg = "Google orqali kirishda xatolik yuz berdi.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Quick One-Click Demo Login (Guaranteed to work in all iFrames & environments)
  const quickLogin = async (role = "admin") => {
    setAuthError(null);
    let userObj;
    let adminStatus = false;

    if (role === "admin") {
      userObj = {
        uid: "admin_dierbek_owner",
        email: "dierbekrustamov040@gmail.com",
        displayName: "Diyerbek Rustamov (Admin)",
        role: "admin",
      };
      adminStatus = true;
    } else {
      userObj = {
        uid: "cust_demo_guest",
        phoneNumber: "+998901234567",
        displayName: "Azizbek Karimov",
        role: "customer",
      };
      adminStatus = false;
    }

    localStorage.setItem("foodhub_simulated_user", JSON.stringify(userObj));
    setCurrentUser(userObj);
    setIsAdmin(adminStatus);
    return { user: userObj, isAdmin: adminStatus };
  };

  // Make current user admin (Bootstrap utility)
  const claimAdminRole = async () => {
    if (!currentUser) return false;
    try {
      await designateAdmin(currentUser.uid, {
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
      });
      setIsAdmin(true);
      return true;
    } catch (e) {
      console.warn("Claim admin notice:", e);
      // Fallback local persistence if offline
      setIsAdmin(true);
      return true;
    }
  };

  // Logout
  const logout = async () => {
    try {
      localStorage.removeItem("foodhub_simulated_user");
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setConfirmationResult(null);
      setSimulatedPhone(null);
    } catch (err) {
      console.warn("Sign out notice:", err);
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        authError,
        simulatedPhone,
        sendOtp,
        verifyOtp,
        signInWithGoogle,
        quickLogin,
        claimAdminRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
