import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./config";

export const getMenu = async () => {
  const snap = await getDocs(collection(db, "menu"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const createOrder = async (orderData) => {
  return await addDoc(collection(db, "orders"), orderData);
};
