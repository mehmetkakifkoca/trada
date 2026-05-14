"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isCEO = isSuperAdmin || ["ceo", "co founder", "admin", "administrator"].includes(user?.role?.toLowerCase() || "");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-[200] w-72 bg-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden shadow-2xl`}>
        <div className="absolute top-6 right-6 lg:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center">
               <span className="text-white text-xs font-black">T</span>
             </div>
             <span className="text-sm font-black text-gray-900 tracking-tight">Trada Media</span>
          </div>
          <div className="w-12" /> {/* Spacer for centering */}
        </header>

        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

