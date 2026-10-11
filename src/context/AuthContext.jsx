import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { checkIsAdmin, promoteByEmail } from "../firebase/services";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync auth state with Firebase Auth
  useEffect(() => {
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
              email: user.email || "",
              displayName: user.displayName || user.email?.split("@")[0] || "Mijoz",
              role: adminStatus ? "admin" : "customer",
              createdAt: new Date().toISOString(),
            });
          } else {
            // Keep role synced if designated admin
            const currentRole = userSnap.data()?.role;
            if (adminStatus && currentRole !== "admin") {
              await setDoc(userDocRef, { role: "admin" }, { merge: true });
            }
          }
        } catch (e) {
          console.warn("User profile sync error:", e);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email and Password Sign In
  const signInWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      setCurrentUser(user);
      const adminStatus = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);
      return { user, isAdmin: adminStatus };
    } catch (err) {
      console.warn("Email sign in error:", err.code);
      let msg = "Kirishda xatolik yuz berdi.";
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        msg = "Email yoki parol noto'g'ri kiritildi.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Email formati noto'g'ri.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Urinishlar soni ko'payib ketdi. Biroz kutib qaytadan urinib ko'ring.";
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Email and Password Sign Up (Registration)
  const signUpWithEmail = async (email, password, displayName) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      if (displayName) {
        try {
          await updateProfile(user, { displayName });
        } catch {}
      }

      const adminStatus = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);

      // Create user profile in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          email: user.email || "",
          displayName: displayName || user.email?.split("@")[0] || "Mijoz",
          role: adminStatus ? "admin" : "customer",
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("User doc create notice:", e.message);
      }

      setCurrentUser(user);
      return { user, isAdmin: adminStatus };
    } catch (err) {
      console.warn("Sign up error:", err.code);
      let msg = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      if (err.code === "auth/email-already-in-use") {
        msg = "Bu email bilan akkaunt allaqachon mavjud. Kirish tugmasini bosing.";
      } else if (err.code === "auth/weak-password") {
        msg = "Parol juda oddiy. Kamida 6 ta belgi kiriting.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Email manzili noto'g'ri kiritilgan.";
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      setCurrentUser(user);
      const adminStatus = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(adminStatus);

      // Profile sync
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "Mijoz",
            role: adminStatus ? "admin" : "customer",
            createdAt: new Date().toISOString(),
          });
        }
      } catch {}

      return { user, isAdmin: adminStatus };
    } catch (err) {
      console.warn("Google sign-in attempt warning:", err.code);
      let msg = "Google orqali kirishda xatolik yuz berdi.";
      if (err.code === "auth/popup-blocked") {
        msg = "Brauzeringiz popup oynani blokladi. Iltimos, Email va Parol orqali kiring yoki popupga ruxsat bering.";
      } else if (err.code === "auth/popup-closed-by-user") {
        msg = "Google orqali kirish oynasi yopildi.";
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthError(null);
    } catch (err) {
      console.warn("Sign out notice:", err);
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  // Claim admin role (for owner or bootstrap)
  const claimAdminRole = async () => {
    if (!currentUser) return false;
    try {
      if (currentUser.email) {
        await promoteByEmail(currentUser.email, "self-bootstrap");
      }
      setIsAdmin(true);
      return true;
    } catch (e) {
      console.warn("Claim admin role error:", e);
      setIsAdmin(true);
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        authError,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
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
