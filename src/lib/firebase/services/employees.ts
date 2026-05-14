import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types";

const COLLECTION_NAME = "users";

export const employeeService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("fullName", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  async create(employee: Omit<User, "id">) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...employee,
      createdAt: Timestamp.now(),
    });
  },

  async update(id: string, employee: Partial<Omit<User, "id">>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return updateDoc(docRef, {
      ...employee,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return deleteDoc(docRef);
  }
};
