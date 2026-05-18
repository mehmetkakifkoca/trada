"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(true);
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load data from Firebase on App Mount
  useEffect(() => {
    if (!user) {
      setIsSyncing(false);
      return;
    }

    async function loadCloudData() {
      try {
        console.log("[Cloud Sync] Loading data from Firebase Firestore...");
        const docRef = doc(db, "trada_app_data", "global_state");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          console.log("[Cloud Sync] Cloud data found! Hydrating local store...");
          
          // Hydrate the Zustand store with the data from Firestore
          useDataStore.setState(cloudData);
        } else {
          console.log("[Cloud Sync] No cloud data found. Using local/default data.");
          // If Firestore is empty, let's initialize it with our current local storage data
          const currentLocalData = localStorage.getItem("trada-data-storage");
          if (currentLocalData) {
            const parsed = JSON.parse(currentLocalData);
            if (parsed && parsed.state) {
              // Extract only non-function properties from local state
              const stateToSave = Object.keys(parsed.state).reduce((acc: any, key) => {
                if (typeof parsed.state[key] !== "function") {
                  acc[key] = parsed.state[key];
                }
                return acc;
              }, {});

              await setDoc(docRef, stateToSave);
              console.log("[Cloud Sync] Initialized Firestore with current local data!");
            }
          }
        }
      } catch (err: any) {
        console.error("[Cloud Sync] Error loading cloud data:", err);
      } finally {
        setIsSyncing(false);
        // Delay setting initial load to false slightly to allow Zustand state updates to settle
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 1000);
      }
    }

    loadCloudData();
  }, [user]);

  // 2. Listen for Zustand store changes and auto-save to Firebase (Debounced)
  useEffect(() => {
    if (!user || isSyncing) return;

    console.log("[Cloud Sync] Setting up auto-save listener...");
    
    // Subscribe to store updates
    const unsubscribe = useDataStore.subscribe((state: any) => {
      // Prevent saving on the very first load/hydration
      if (isInitialLoad.current) return;

      // Debounce the save operation to avoid hitting Firestore write limits on every keystroke
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("[Cloud Sync] Auto-saving changes to Firebase Firestore...");
          const docRef = doc(db, "trada_app_data", "global_state");
          
          // Extract only the state values, excluding functions/actions
          const stateToSave = Object.keys(state).reduce((acc: any, key) => {
            if (typeof state[key] !== "function") {
              acc[key] = state[key];
            }
            return acc;
          }, {});

          await setDoc(docRef, stateToSave);
          console.log("[Cloud Sync] Successfully synced changes to the Cloud!");
        } catch (err) {
          console.error("[Cloud Sync] Auto-save failed:", err);
        }
      }, 3000); // 3 seconds debounce
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user, isSyncing]);

  if (isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Daten werden synchronisiert...</p>
      </div>
    );
  }

  return <>{children}</>;
}
