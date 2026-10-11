import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { db, storage } from "./config";
import firebaseConfig from "../../firebase-applet-config.json";
import { handleFirestoreError, OperationType } from "./errors";
import { menu as initialMenuData } from "../data/menuData";

// CATEGORIES
export async function getCategories() {
  try {
    const snap = await getDocs(collection(db, "categories"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "categories");
  }
}

export async function createCategory(catData) {
  try {
    const refDoc = await addDoc(collection(db, "categories"), {
      ...catData,
      createdAt: new Date().toISOString(),
    });
    return { id: refDoc.id, ...catData };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "categories");
  }
}

export async function updateCategory(id, catData) {
  try {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, {
      ...catData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
  }
}

export async function deleteCategory(id) {
  try {
    await deleteDoc(doc(db, "categories", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
  }
}

// PRODUCTS / MENU
export async function getProducts() {
  try {
    const snap = await getDocs(collection(db, "products"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "products");
  }
}

export async function createProduct(prodData) {
  try {
    const refDoc = await addDoc(collection(db, "products"), {
      ...prodData,
      isAvailable: prodData.isAvailable ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: refDoc.id, ...prodData };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "products");
  }
}

export async function updateProduct(id, prodData) {
  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, {
      ...prodData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
  }
}

export async function deleteProduct(id) {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  }
}

// ==========================================
// 1. GLOBAL BRANCH MANAGEMENT
// ==========================================

const DEFAULT_BUKHARA_BRANCHES = [
  {
    name: "FoodHub Labi Hovuz",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "Bahauddin Naqshband ko'chasi, 24 (Labi Hovuz maydoni)",
    latitude: 39.7731,
    longitude: 64.4206,
    phone: "+998 65 224 11 01",
    openingHours: "10:00 — 02:00",
    isActive: true,
  },
  {
    name: "FoodHub Ark Qal'asi",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "Registon maydoni, 4 (Ark qal'asi ro'parasi)",
    latitude: 39.7778,
    longitude: 64.4109,
    phone: "+998 65 224 11 02",
    openingHours: "10:00 — 00:00",
    isActive: true,
  },
  {
    name: "FoodHub Somoniylar Bog'i",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "M. Ibrohimov ko'chasi, 12 (Somoniylar bog'i yonida)",
    latitude: 39.7752,
    longitude: 64.4035,
    phone: "+998 65 224 11 03",
    openingHours: "11:00 — 01:00",
    isActive: true,
  },
  {
    name: "FoodHub Sharq Ekspress",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "Ibn Sino shoh ko'chasi, 55 (Sharq bozori hududi)",
    latitude: 39.7644,
    longitude: 64.4392,
    phone: "+998 65 224 11 04",
    openingHours: "10:00 — 03:00",
    isActive: true,
  },
  {
    name: "FoodHub Karvon Savdo",
    country: "O'zbekiston",
    city: "Buxoro",
    address: "G'ijduvoniy ko'chasi, 89 (Karvon bozori yaqinida)",
    latitude: 39.7891,
    longitude: 64.4320,
    phone: "+998 65 224 11 05",
    openingHours: "09:00 — 23:00",
    isActive: true,
  },
  {
    name: "FoodHub Toshkent Markaz (Bosh filial)",
    country: "O'zbekiston",
    city: "Toshkent",
    address: "Amir Temur shoh ko'chasi, 12",
    latitude: 41.311082,
    longitude: 69.279654,
    phone: "+998 71 234 56 67",
    openingHours: "10:00 — 03:00",
    isActive: true,
  },
];

// Local branch caching for offline/instant render
function getLocalBranches() {
  try {
    const data = localStorage.getItem("foodhub_branches");
    return data ? JSON.parse(data) : DEFAULT_BUKHARA_BRANCHES.map((b, i) => ({ id: `br_${i + 1}`, ...b }));
  } catch {
    return DEFAULT_BUKHARA_BRANCHES.map((b, i) => ({ id: `br_${i + 1}`, ...b }));
  }
}

function saveLocalBranches(branches) {
  try {
    localStorage.setItem("foodhub_branches", JSON.stringify(branches));
  } catch {}
}

export async function getBranches(includeInactive = false) {
  try {
    const snap = await getDocs(collection(db, "branches"));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      saveLocalBranches(list);
      return includeInactive ? list : list.filter((b) => b.isActive);
    }
  } catch (err) {
    console.warn("Could not query branches from Firestore, using local cache:", err.message);
  }

  const cached = getLocalBranches();
  return includeInactive ? cached : cached.filter((b) => b.isActive);
}

export async function createBranch(branchData) {
  const newBranch = {
    ...branchData,
    country: branchData.country || "O'zbekiston",
    isActive: branchData.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const refDoc = await addDoc(collection(db, "branches"), newBranch);
    const saved = { id: refDoc.id, ...newBranch };
    const current = getLocalBranches();
    saveLocalBranches([saved, ...current]);
    return saved;
  } catch (err) {
    console.warn("Firestore branch creation note, saving locally:", err.message);
    const localSaved = { id: `br_${Date.now()}`, ...newBranch };
    const current = getLocalBranches();
    saveLocalBranches([localSaved, ...current]);
    return localSaved;
  }
}

export async function updateBranch(branchId, branchData) {
  const current = getLocalBranches();
  const updated = current.map((b) =>
    b.id === branchId ? { ...b, ...branchData, updatedAt: new Date().toISOString() } : b
  );
  saveLocalBranches(updated);

  try {
    const docRef = doc(db, "branches", branchId);
    await updateDoc(docRef, {
      ...branchData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Firestore update branch note:", err.message);
  }
}

export async function deleteBranch(branchId) {
  const current = getLocalBranches();
  saveLocalBranches(current.filter((b) => b.id !== branchId));

  try {
    await deleteDoc(doc(db, "branches", branchId));
  } catch (err) {
    console.warn("Firestore delete branch note:", err.message);
  }
}

export async function seedInitialBranches() {
  try {
    const snap = await getDocs(collection(db, "branches"));
    if (snap.empty) {
      for (const branch of DEFAULT_BUKHARA_BRANCHES) {
        await addDoc(collection(db, "branches"), {
          ...branch,
          createdAt: new Date().toISOString(),
        });
      }
    }
    saveLocalBranches(DEFAULT_BUKHARA_BRANCHES.map((b, i) => ({ id: `br_${i + 1}`, ...b })));
    return true;
  } catch (err) {
    console.warn("Branch seeding note:", err.message);
    saveLocalBranches(DEFAULT_BUKHARA_BRANCHES.map((b, i) => ({ id: `br_${i + 1}`, ...b })));
    return true;
  }
}

// ==========================================
// 2. ORDERS & ORDER CANCELLATION
// ==========================================

function getLocalOrders() {
  try {
    const data = localStorage.getItem("foodhub_orders");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalOrder(order) {
  try {
    const current = getLocalOrders();
    const updated = [order, ...current.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber)];
    localStorage.setItem("foodhub_orders", JSON.stringify(updated));
  } catch {}
}

export async function createOrder(orderData) {
  const localId = "order_" + Date.now();
  const fullOrder = {
    id: localId,
    status: "pending",
    paymentStatus: orderData.payMethod === "cash" ? "unpaid" : "pending_payment",
    createdAt: new Date().toISOString(),
    ...orderData,
  };
  saveLocalOrder(fullOrder);

  try {
    const refDoc = await addDoc(collection(db, "orders"), {
      ...fullOrder,
      timestamp: serverTimestamp(),
    });
    const finalOrder = { ...fullOrder, id: refDoc.id };
    saveLocalOrder(finalOrder);
    return finalOrder;
  } catch (err) {
    console.warn("Firestore order creation note, saved in local cache:", err.message);
    return fullOrder;
  }
}

export async function getOrders() {
  const cachedOrders = getLocalOrders();
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const firestoreOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const all = [...firestoreOrders];
    for (const co of cachedOrders) {
      if (!all.some((o) => o.id === co.id || (co.orderNumber && o.orderNumber === co.orderNumber))) {
        all.push(co);
      }
    }
    return all;
  } catch (err) {
    console.warn("Remote orders query notice (permission/offline), using local orders:", err.message);
    return cachedOrders;
  }
}

export async function getCustomerOrders(customerId) {
  if (!customerId) return [];
  const local = getLocalOrders().filter((o) => o.customerId === customerId);

  try {
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = [...remote];
    for (const lo of local) {
      if (!merged.some((o) => o.id === lo.id || o.orderNumber === lo.orderNumber)) {
        merged.push(lo);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Customer orders query note:", err.message);
    return local;
  }
}

export async function cancelCustomerOrder(orderId, customerId, reason = "Mijoz tomonidan bekor qilindi") {
  // Update in local cache
  const cached = getLocalOrders();
  const updated = cached.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        status: "cancelled",
        paymentStatus: o.paymentStatus === "paid" ? "refunded" : o.paymentStatus,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      };
    }
    return o;
  });
  localStorage.setItem("foodhub_orders", JSON.stringify(updated));

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn("Remote cancel order note:", err.message);
    return true;
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  const cached = getLocalOrders();
  const updated = cached.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
  localStorage.setItem("foodhub_orders", JSON.stringify(updated));

  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Remote status update note:", err.message);
  }
}

// ==========================================
// 3. SECURE PAYMENTS (CLICK / PAYME / CARD)
// ==========================================

export async function processPaymentSession(order, provider) {
  const paymentId = `pay_${Date.now()}`;
  const amount = order.total;

  const paymentRecord = {
    id: paymentId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    amount,
    provider,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, "payments"), paymentRecord);
  } catch (e) {
    console.warn("Firestore payment record note:", e.message);
  }

  // Construct official provider redirect URLs or checkout params
  let checkoutUrl = "";
  if (provider === "click") {
    // Official Click Merchant checkout endpoint
    const serviceId = "32145"; // Click merchant test service id
    const merchantId = "18721";
    checkoutUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${order.orderNumber}&return_url=${encodeURIComponent(window.location.origin + "/orders?payment=success&orderId=" + order.id)}`;
  } else if (provider === "payme") {
    // Official Payme Checkout base64 format
    const paymeMerchant = "64f1234567890abcdef12345";
    const paymeParams = btoa(`m=${paymeMerchant};ac.order_id=${order.orderNumber};a=${amount * 100};c=${encodeURIComponent(window.location.origin + "/orders")}`);
    checkoutUrl = `https://checkout.paycom.uz/${paymeParams}`;
  }

  return {
    paymentId,
    checkoutUrl,
    amount,
    provider,
  };
}

export async function confirmOrderPayment(orderId, paymentId, transactionId) {
  // Update order status to paid and confirmed
  const cached = getLocalOrders();
  const updated = cached.map((o) =>
    o.id === orderId ? { ...o, paymentStatus: "paid", status: "confirmed" } : o
  );
  localStorage.setItem("foodhub_orders", JSON.stringify(updated));

  try {
    await updateDoc(doc(db, "orders", orderId), {
      paymentStatus: "paid",
      status: "confirmed",
      updatedAt: new Date().toISOString(),
    });
    if (paymentId) {
      await updateDoc(doc(db, "payments", paymentId), {
        status: "completed",
        transactionId: transactionId || `txn_${Date.now()}`,
        completedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Payment confirmation write note:", err.message);
  }
}

// ==========================================
// 4. SAVED CUSTOMER ADDRESSES
// ==========================================

export async function getSavedAddresses(userId) {
  if (!userId) return [];
  try {
    const snap = await getDocs(collection(db, "users", userId, "addresses"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const local = localStorage.getItem(`foodhub_addr_${userId}`);
    return local ? JSON.parse(local) : [];
  }
}

export async function saveUserAddress(userId, addressData) {
  if (!userId) return null;
  const newAddr = {
    ...addressData,
    createdAt: new Date().toISOString(),
  };

  try {
    const refDoc = await addDoc(collection(db, "users", userId, "addresses"), newAddr);
    return { id: refDoc.id, ...newAddr };
  } catch {
    const local = await getSavedAddresses(userId);
    const saved = { id: `addr_${Date.now()}`, ...newAddr };
    localStorage.setItem(`foodhub_addr_${userId}`, JSON.stringify([saved, ...local]));
    return saved;
  }
}

export async function deleteUserAddress(userId, addressId) {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, "users", userId, "addresses", addressId));
  } catch {}
  const local = await getSavedAddresses(userId);
  localStorage.setItem(`foodhub_addr_${userId}`, JSON.stringify(local.filter((a) => a.id !== addressId)));
}

// ==========================================
// 5. ADMIN PHONE ASSIGNMENT & AUDIT LOGS
// ==========================================

export async function getAdminInvitations() {
  try {
    const snap = await getDocs(collection(db, "adminInvitations"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const local = localStorage.getItem("foodhub_admin_invitations");
    return local ? JSON.parse(local) : [];
  }
}

export async function inviteAdminByPhone(phoneNumber, assignedBy) {
  const cleanPhone = phoneNumber.replace(/\s+/g, "");
  const invite = {
    phoneNumber: cleanPhone,
    role: "admin",
    status: "pending",
    assignedBy: assignedBy || "Superadmin",
    createdAt: new Date().toISOString(),
  };

  try {
    const refDoc = await addDoc(collection(db, "adminInvitations"), invite);
    await logAuditEvent("INVITE_ADMIN", assignedBy, "user", cleanPhone, `Invited phone ${cleanPhone} as admin`);
    return { id: refDoc.id, ...invite };
  } catch (err) {
    console.warn("Invite admin note:", err.message);
    const local = await getAdminInvitations();
    const saved = { id: `inv_${Date.now()}`, ...invite };
    localStorage.setItem("foodhub_admin_invitations", JSON.stringify([saved, ...local]));
    return saved;
  }
}

export async function revokeAdmin(uid, phoneNumber, performedBy) {
  try {
    if (uid) {
      await deleteDoc(doc(db, "admins", uid));
    }
    // Also remove from invitations
    const snap = await getDocs(query(collection(db, "adminInvitations"), where("phoneNumber", "==", phoneNumber)));
    snap.forEach((d) => deleteDoc(d.ref));
    await logAuditEvent("REVOKE_ADMIN", performedBy, "user", uid || phoneNumber, `Revoked admin privileges for ${phoneNumber || uid}`);
  } catch (err) {
    console.warn("Revoke admin note:", err.message);
  }
}

export async function getAuditLogs() {
  try {
    const snap = await getDocs(query(collection(db, "auditLogs"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const local = localStorage.getItem("foodhub_audit_logs");
    return local ? JSON.parse(local) : [];
  }
}

export async function logAuditEvent(action, performedBy, targetType, targetId, details) {
  const entry = {
    action,
    performedBy: performedBy || "admin",
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };
  try {
    await addDoc(collection(db, "auditLogs"), entry);
  } catch {}
  try {
    const local = JSON.parse(localStorage.getItem("foodhub_audit_logs") || "[]");
    localStorage.setItem("foodhub_audit_logs", JSON.stringify([entry, ...local.slice(0, 50)]));
  } catch {}
}

// ADMIN CHECK & MANAGEMENT
export async function checkIsAdmin(uid, email) {
  const normalizedEmail = (email || "").toLowerCase().trim();
  if (normalizedEmail === "dierbekrustamov040@gmail.com") return true;
  if (!uid && !normalizedEmail) return false;

  try {
    if (uid) {
      const adminDoc = await getDoc(doc(db, "admins", uid));
      if (adminDoc.exists()) return true;
    }
    if (normalizedEmail) {
      const emailDoc = await getDoc(doc(db, "adminEmails", normalizedEmail));
      if (emailDoc.exists()) {
        // Self-sync to admins/{uid} so standard UID security rules work immediately
        if (uid) {
          try {
            await setDoc(doc(db, "admins", uid), {
              uid,
              email: normalizedEmail,
              role: "admin",
              syncedAt: new Date().toISOString(),
            });
          } catch {}
        }
        return true;
      }
    }
  } catch (err) {
    console.warn("Could not check admin status:", err);
  }
  return normalizedEmail === "dierbekrustamov040@gmail.com";
}

export async function designateAdmin(uid, data = {}) {
  try {
    await setDoc(doc(db, "admins", uid), {
      ...data,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${uid}`);
  }
}

// Fetch all registered admins
export async function getAdmins() {
  const adminsMap = new Map();

  // Always include permanent Superadmin
  adminsMap.set("dierbekrustamov040@gmail.com", {
    id: "superadmin_owner",
    uid: "superadmin_owner",
    email: "dierbekrustamov040@gmail.com",
    displayName: "Diyerbek Rustamov",
    role: "superadmin",
    isSuperAdmin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  });

  try {
    const adminDocs = await getDocs(collection(db, "admins"));
    adminDocs.forEach((d) => {
      const data = d.data();
      const em = (data.email || "").toLowerCase();
      const key = em || d.id;
      adminsMap.set(key, {
        id: d.id,
        uid: d.id,
        ...data,
        isSuperAdmin: em === "dierbekrustamov040@gmail.com",
      });
    });
  } catch (e) {
    console.warn("Fetching admins error:", e.message);
  }

  try {
    const emailDocs = await getDocs(collection(db, "adminEmails"));
    emailDocs.forEach((d) => {
      const data = d.data();
      const em = (data.email || d.id).toLowerCase();
      if (!adminsMap.has(em)) {
        adminsMap.set(em, {
          id: d.id,
          email: em,
          displayName: data.displayName || em.split("@")[0],
          role: "admin",
          isSuperAdmin: em === "dierbekrustamov040@gmail.com",
          createdAt: data.addedAt || new Date().toISOString(),
          addedBy: data.addedBy || "admin",
        });
      }
    });
  } catch (e) {
    console.warn("Fetching adminEmails error:", e.message);
  }

  return Array.from(adminsMap.values());
}

// Fetch all registered users for promotion
export async function getRegisteredUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Error fetching registered users:", e.message);
    return [];
  }
}

// Create brand new admin with Email and Password without signing out active user
export async function createAdminWithEmailPassword({ email, password, displayName, currentAdminEmail }) {
  if (!email || !password) {
    throw new Error("Email va parol kiritilishi shart");
  }
  if (password.length < 6) {
    throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Initialize secondary Firebase App instance for separate auth context
  const secondaryAppName = "SecondaryAdminApp_" + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
    const newUid = cred.user.uid;

    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch {}
    }

    // Save to Firestore collections
    const nowIso = new Date().toISOString();
    await setDoc(doc(db, "admins", newUid), {
      uid: newUid,
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: "admin",
      createdAt: nowIso,
      createdBy: currentAdminEmail || "superadmin",
    });

    await setDoc(doc(db, "adminEmails", normalizedEmail), {
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: "admin",
      addedAt: nowIso,
      addedBy: currentAdminEmail || "superadmin",
    });

    await setDoc(doc(db, "users", newUid), {
      id: newUid,
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: "admin",
      createdAt: nowIso,
    });

    await logAuditEvent("CREATE_ADMIN", currentAdminEmail, "admins", newUid, `${normalizedEmail} yangi admin sifatida ro'yxatdan o'tkazildi`);

    // Clean up secondary auth
    await signOut(secondaryAuth);

    return {
      uid: newUid,
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: "admin",
    };
  } catch (err) {
    console.error("Create admin error:", err);
    if (err.code === "auth/email-already-in-use") {
      throw new Error("Bu email manziliga ega hisob allaqachon mavjud. Foydalanuvchini ro'yxatdan admin darajasiga ko'tarish funksiyasidan foydalaning.");
    } else if (err.code === "auth/invalid-email") {
      throw new Error("Email formati noto'g'ri kiritildi.");
    }
    throw new Error(err.message || "Admin hisobini yaratishda xatolik yuz berdi.");
  }
}

// Promote an existing registered user to Admin
export async function promoteUserToAdmin(userId, userEmail, userName, currentAdminEmail) {
  const normalizedEmail = (userEmail || "").toLowerCase().trim();
  const nowIso = new Date().toISOString();

  try {
    // 1. Update user document
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      role: "admin",
      promotedAt: nowIso,
    });

    // 2. Set admins collection document
    await setDoc(doc(db, "admins", userId), {
      uid: userId,
      email: normalizedEmail,
      displayName: userName || normalizedEmail.split("@")[0] || "Admin",
      role: "admin",
      promotedAt: nowIso,
      promotedBy: currentAdminEmail || "admin",
    });

    // 3. Set adminEmails allowlist
    if (normalizedEmail) {
      await setDoc(doc(db, "adminEmails", normalizedEmail), {
        email: normalizedEmail,
        displayName: userName || normalizedEmail.split("@")[0] || "Admin",
        role: "admin",
        addedAt: nowIso,
        addedBy: currentAdminEmail || "admin",
      });
    }

    await logAuditEvent("PROMOTE_ADMIN", currentAdminEmail, "users", userId, `${normalizedEmail} admin darajasiga ko'tarildi`);
    return true;
  } catch (err) {
    console.error("Promote admin error:", err);
    throw new Error(err.message || "Adminlikka ko'tarishda xatolik");
  }
}

// Promote user by email (Gmail / Email)
export async function promoteByEmail(email, currentAdminEmail) {
  if (!email || !email.includes("@")) {
    throw new Error("Yaroqli email manzilini kiriting");
  }
  const normalizedEmail = email.toLowerCase().trim();
  const nowIso = new Date().toISOString();

  try {
    // 1. Store in adminEmails
    await setDoc(doc(db, "adminEmails", normalizedEmail), {
      email: normalizedEmail,
      displayName: normalizedEmail.split("@")[0],
      role: "admin",
      addedAt: nowIso,
      addedBy: currentAdminEmail || "admin",
    });

    // 2. Check if a user with this email is already registered
    const usersSnap = await getDocs(
      query(collection(db, "users"), where("email", "==", normalizedEmail))
    );

    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0];
      const uid = userDoc.id;
      await updateDoc(doc(db, "users", uid), { role: "admin", promotedAt: nowIso });
      await setDoc(doc(db, "admins", uid), {
        uid,
        email: normalizedEmail,
        displayName: userDoc.data().displayName || normalizedEmail.split("@")[0],
        role: "admin",
        promotedAt: nowIso,
        promotedBy: currentAdminEmail || "admin",
      });
    }

    await logAuditEvent("PROMOTE_EMAIL_ADMIN", currentAdminEmail, "adminEmails", normalizedEmail, `${normalizedEmail} adminlar ro'yxatiga qo'shildi`);
    return true;
  } catch (err) {
    console.error("Promote by email error:", err);
    throw new Error(err.message || "Adminlikka biriktirishda xatolik");
  }
}

// Remove an admin (Demote back to regular customer)
export async function removeAdmin(adminUid, adminEmail, currentAdminEmail) {
  const normalizedEmail = (adminEmail || "").toLowerCase().trim();

  // Safety protection: Cannot demote superadmin
  if (normalizedEmail === "dierbekrustamov040@gmail.com") {
    throw new Error("Asosiy tizim egasini (Superadmin) o'chirib bo'lmaydi!");
  }

  try {
    if (adminUid && adminUid !== "superadmin_owner") {
      await deleteDoc(doc(db, "admins", adminUid));
      try {
        await updateDoc(doc(db, "users", adminUid), { role: "customer" });
      } catch {}
    }

    if (normalizedEmail) {
      await deleteDoc(doc(db, "adminEmails", normalizedEmail));

      // Also check any admin doc with this email
      try {
        const snap = await getDocs(
          query(collection(db, "admins"), where("email", "==", normalizedEmail))
        );
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch {}
    }

    await logAuditEvent("REMOVE_ADMIN", currentAdminEmail, "admins", adminUid || normalizedEmail, `${normalizedEmail} adminlikdan olib tashlandi`);
    return true;
  } catch (err) {
    console.error("Remove admin error:", err);
    throw new Error(err.message || "Adminlikdan olishda xatolik yuz berdi");
  }
}

// STORAGE / IMAGE UPLOADS
export async function uploadImageFile(file, folder = "products") {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Rasm hajmi 5MB dan oshmasligi kerak");
  }

  try {
    const ext = file.name ? file.name.split(".").pop() : "jpg";
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn("Storage upload failed, falling back to data URL preview:", err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// SEEDER: Populate initial database items if empty
export async function seedInitialMenuIfEmpty() {
  try {
    const catSnap = await getDocs(collection(db, "categories"));
    if (catSnap.empty) {
      const defaultCats = [
        { name: "Burgerlar", slug: "burgers", displayOrder: 1, description: "Qo'lda tayyorlangan smash burgerlar" },
        { name: "Pitsa", slug: "pizza", displayOrder: 2, description: "Qarsillagan xamirli italyan pitsasi" },
        { name: "Tovuq", slug: "chicken", displayOrder: 3, description: "Qarsillagan va suvli tovuq qanotlari" },
        { name: "Snegki", slug: "sides", displayOrder: 4, description: "Kartoshka fri va boshqa snegklar" },
        { name: "Ichimliklar", slug: "drinks", displayOrder: 5, description: "Muzdek ichimliklar va kokteyllar" },
        { name: "Kombo", slug: "combos", displayOrder: 6, description: "Eng foydali kombo to'plamlar" },
      ];

      for (const cat of defaultCats) {
        await addDoc(collection(db, "categories"), {
          ...cat,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const prodSnap = await getDocs(collection(db, "products"));
    if (prodSnap.empty) {
      for (const item of initialMenuData) {
        await addDoc(collection(db, "products"), {
          name: item.name,
          categoryId: item.cat,
          price: item.price,
          description: item.desc,
          imageUrl: item.img,
          calories: item.cal || 0,
          isAvailable: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Seed branches as well
    await seedInitialBranches();

    return true;
  } catch (err) {
    console.warn("Seeding failed or not permitted:", err.message);
    return false;
  }
}
