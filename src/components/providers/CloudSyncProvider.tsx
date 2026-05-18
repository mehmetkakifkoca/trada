"use client";

import { useEffect, useRef, useState } from "react";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(true);
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load data from Server API on App Mount
  useEffect(() => {
    if (!user) {
      setIsSyncing(false);
      return;
    }

    async function loadCloudData() {
      try {
        console.log("[Cloud Sync] Fetching database state from server `/api/sync`...");
        const response = await fetch("/api/sync");
        
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData) {
            console.log("[Cloud Sync] Cloud database found! Hydrating local store...");
            useDataStore.setState(cloudData);
          } else {
            console.log("[Cloud Sync] No cloud database found. Initializing with local data...");
            // Initialize server with local storage data if empty
            const currentLocalData = localStorage.getItem("trada-data-storage");
            if (currentLocalData) {
              const parsed = JSON.parse(currentLocalData);
              if (parsed && parsed.state) {
                const stateToSave = Object.keys(parsed.state).reduce((acc: any, key) => {
                  if (typeof parsed.state[key] !== "function") {
                    acc[key] = parsed.state[key];
                  }
                  return acc;
                }, {});

                await fetch("/api/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(stateToSave),
                });
                console.log("[Cloud Sync] Initialized Cloud database with current local data!");
              }
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

  // 2. Listen for Zustand store changes and auto-save to Server API (Debounced)
  useEffect(() => {
    if (!user || isSyncing) return;

    console.log("[Cloud Sync] Setting up server auto-save listener...");
    
    // Subscribe to store updates
    const unsubscribe = useDataStore.subscribe((state: any) => {
      // Prevent saving on the very first load/hydration
      if (isInitialLoad.current) return;

      // Debounce the save operation to avoid hitting Firebase write limits on every keystroke
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("[Cloud Sync] Auto-saving changes to Server API `/api/sync`...");
          
          // Extract only the state values, excluding functions/actions
          const stateToSave = Object.keys(state).reduce((acc: any, key) => {
            if (typeof state[key] !== "function") {
              acc[key] = state[key];
            }
            return acc;
          }, {});

          const response = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stateToSave),
          });

          if (response.ok) {
            console.log("[Cloud Sync] Successfully synced changes to the Server Cloud Database!");
          } else {
            console.error("[Cloud Sync] Server responded with error during sync.");
          }
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
