import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  uid?: string; // Tax ID
  notes?: string;
  status: "Aktiv" | "Inaktiv" | "Archiviert";
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_NAME = "customers";

export const customerService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("companyName", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
  },

  async create(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) {
    const now = Timestamp.now();
    return addDoc(collection(db, COLLECTION_NAME), {
      ...customer,
      createdAt: now,
      updatedAt: now,
    });
  },

  async update(id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return updateDoc(docRef, {
      ...customer,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return deleteDoc(docRef);
  }
};
