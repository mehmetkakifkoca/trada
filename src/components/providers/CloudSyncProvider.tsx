"use client";

import { useEffect, useRef, useState } from "react";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";

type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "error";

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(true);
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connection Indicator States
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerIndicator = (status: SyncStatus, err = "") => {
    setSyncStatus(status);
    setErrorMessage(err);
    setShowStatusIndicator(true);

    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    // Auto-fade synced state after 2 seconds
    if (status === "synced") {
      fadeTimeoutRef.current = setTimeout(() => {
        setShowStatusIndicator(false);
      }, 2000);
    }
  };

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
            triggerIndicator("synced");
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

                const initResponse = await fetch("/api/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(stateToSave),
                });
                
                if (initResponse.ok) {
                  console.log("[Cloud Sync] Initialized Cloud database with current local data!");
                  triggerIndicator("synced");
                } else {
                  const errData = await initResponse.json().catch(() => ({}));
                  triggerIndicator("error", errData.error || initResponse.statusText);
                }
              }
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          triggerIndicator("error", errData.error || response.statusText);
        }
      } catch (err: any) {
        console.error("[Cloud Sync] Error loading cloud data:", err);
        triggerIndicator("error", err.message);
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

      // Set state to syncing immediately when changes are detected
      setSyncStatus("syncing");
      setShowStatusIndicator(true);

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
            triggerIndicator("synced");
          } else {
            const errData = await response.json().catch(() => ({}));
            triggerIndicator("error", errData.error || response.statusText);
          }
        } catch (err: any) {
          console.error("[Cloud Sync] Auto-save failed:", err);
          triggerIndicator("error", err.message);
        }
      }, 2500); // 2.5 seconds debounce
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

  return (
    <>
      {children}
      
      {/* Premium Minimal Bottom-Right Cloud Sync Status Badge */}
      {showStatusIndicator && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative">
            <button 
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className={`h-8 w-8 rounded-full shadow-lg border flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
                syncStatus === "syncing" ? "bg-white border-blue-100 text-blue-500" :
                syncStatus === "synced" ? "bg-white border-emerald-100 text-emerald-500" :
                syncStatus === "error" ? "bg-red-50 border-red-100 text-red-500 animate-pulse" :
                "bg-white border-gray-100 text-gray-400"
              }`}
            >
              {syncStatus === "syncing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : syncStatus === "synced" ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : syncStatus === "error" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Cloud className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Premium Tooltip on Click / Hover */}
            {showTooltip && (
              <>
                <div 
                  className="fixed inset-0 z-[99998] md:hidden" 
                  onClick={() => setShowTooltip(false)} 
                />
                <div className="absolute right-0 bottom-10 w-44 bg-neutral-900 text-white text-[9px] font-bold py-2 px-3 rounded-xl shadow-2xl leading-normal text-center z-[99999] border border-neutral-800 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  {syncStatus === "syncing" && "Änderungen werden synchronisiert..."}
                  {syncStatus === "synced" && "Änderungen mit Cloud synchronisiert!"}
                  {syncStatus === "error" && `Sync-Fehler: ${errorMessage || "Verbindung fehlgeschlagen"}`}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
