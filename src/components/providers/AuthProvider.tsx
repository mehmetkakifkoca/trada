"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { User } from "@/types";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we have a persisted user to skip initial loading state
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // Get current state from store
        const currentUser = useAuthStore.getState().user;
        
        // If we are in a demo session, don't let Firebase Auth overwrite it
        if (currentUser?.id?.startsWith("demo-")) {
          setLoading(false);
          return;
        }

        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, "id">;
            setUser({ id: firebaseUser.uid, ...userData });
          } else {
            console.error("User profile not found in Firestore.");
            setUser(null);
          }
        } else {
          setUser(null);
          /*
          if (pathname !== "/login") {
            router.push("/login");
          }
          */
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, pathname, router]);

  return <>{children}</>;
}
