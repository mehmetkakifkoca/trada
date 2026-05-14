"use client";

import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { Bell, Menu, X, Check, Info, Settings, LogOut, Home, UserCircle } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export function Topbar() {
  const { user } = useAuthStore();
  const { notifications, markNotificationAsRead } = useDataStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  const unreadCount = notifications.filter(n => !n.read).length;
  const isCEO = ["ceo", "co founder", "admin", "administrator"].includes(user?.role?.toLowerCase() || "");
  const isDashboard = pathname === "/dashboard";

  const handleLogout = async () => {
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("auth-storage");
    await auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-100 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-10 relative z-50">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-x-4">
           {/* Mobile Menu Icon - Only for CEO */}
           {isCEO && (
             <button className="lg:hidden p-2 text-gray-400">
                <Menu className="h-6 w-6" />
             </button>
           )}

           {/* Home Button for Workers (When not on Dashboard) */}
           {!isDashboard && (
             <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
             >
               <Home className="h-5 w-5 text-gray-400 group-hover:text-black" />
               <span className="text-xs font-bold text-gray-400 group-hover:text-black hidden sm:block uppercase tracking-widest">Dashboard</span>
             </Link>
           )}
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-8">
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-black transition-colors"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Benachrichtigungen</h3>
                    <button onClick={() => setShowNotifications(false)}><X className="h-4 w-4 text-gray-400" /></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => { markNotificationAsRead(n.id); }}
                        className={`p-5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                            n.type === 'warning' ? 'bg-orange-50 text-orange-500' : 
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {n.type === 'success' ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">{n.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-10 text-center text-gray-400 text-xs">Keine Benachrichtigungen</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-x-4 border-l border-gray-100 pl-8">
            <Link 
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group"
            >
              <div 
                className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: user?.colorTag || '#1f2937' }}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <UserCircle className="h-5 w-5 text-white/50" />
                )}
              </div>
              <span className="text-[10px] font-black text-gray-400 group-hover:text-black uppercase tracking-widest hidden md:block">Profil & Ayarlar</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
