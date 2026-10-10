import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./config";
import { menu as fallbackMenu } from "../data/menuData";

const localOrders = [];

export const getMenu = async () => {
  if (!db) {
    return fallbackMenu;
  }
  try {
    const snap = await getDocs(collection(db, "menu"));
    if (snap.empty) {
      return fallbackMenu;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("[Firestore] getMenu failed, falling back to local static menu:", err);
    return fallbackMenu;
  }
};

export const createOrder = async (orderData) => {
  if (!db) {
    const localOrder = { id: "order-" + Date.now(), ...orderData };
    localOrders.push(localOrder);
    return localOrder;
  }
  try {
    return await addDoc(collection(db, "orders"), orderData);
  } catch (err) {
    console.warn("[Firestore] createOrder failed, saving in memory:", err);
    const localOrder = { id: "order-" + Date.now(), ...orderData };
    localOrders.push(localOrder);
    return localOrder;
  }
};
