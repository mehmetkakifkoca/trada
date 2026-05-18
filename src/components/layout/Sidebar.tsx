"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCircle, 
  Clock, 
  Calendar, 
  Share2, 
  Settings,
  Layers,
  HelpCircle,
  LogOut,
  X,
  Briefcase
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { invoiceSettings } = useDataStore();
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  const handleLogout = async () => {
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("auth-storage");
    await auth.signOut();
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["CEO", "Co Founder", "Buchhaltung", "Manager", "Mitarbeiter"] },
    { 
      label: "Buchhaltung", 
      href: "/accounting", 
      icon: Building2, 
      roles: ["CEO", "Co Founder", "Buchhaltung"],
      permission: "acc",
      children: [
        { label: "Rechnungen", href: "/accounting/invoices" },
        { label: "Ausgaben", href: "/accounting/expenses" },
        { label: "Angebote", href: "/accounting/offers" },
      ]
    },
    { label: "Kunden", href: "/crm", icon: Users, roles: ["CEO", "Co Founder", "Manager", "Mitarbeiter"], permission: "crm" },
    { label: "Mitarbeiter", href: "/team", icon: UserCircle, roles: ["CEO", "Co Founder", "Manager"], permission: "team" },
    { label: "Zeiterfassung", href: "/attendance", icon: Clock, roles: ["CEO", "Co Founder", "Manager", "Mitarbeiter"], permission: "att" },
    { label: "Projekte", href: "/projects", icon: Layers, roles: ["CEO", "Co Founder", "Manager", "Mitarbeiter"], permission: "proj" },
    { label: "Kalender", href: "/calendar", icon: Calendar, roles: ["CEO", "Co Founder", "Manager", "Mitarbeiter"], permission: "cal" },
    { label: "Freelancer", href: "/freelancers", icon: Briefcase, roles: ["CEO", "Co Founder", "Manager", "Freelancer"], permission: "free" },
    { label: "Einstellungen", href: "/settings", icon: Settings, roles: ["CEO", "Co Founder"] },
  ];

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "ceo";
  
  const allowedNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    // If the module has a specific permission requirement, it's the ultimate source of truth
    if (item.permission) {
      return user.customPermissions?.includes(item.permission) ?? false;
    }

    // If no specific permission is required (like Dashboard), check base role
    const userRole = user.role?.toLowerCase() || "";
    const itemRoles = item.roles.map(r => r.toLowerCase());
    
    return itemRoles.includes(userRole);
  });

  if (allowedNavItems.length === 0) return null;

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-20 flex-col justify-center px-6">
        {invoiceSettings.systemLogo ? (
          <img src={invoiceSettings.systemLogo} alt="Logo" className="h-10 w-auto object-contain" />
        ) : (
          <h1 className="text-xl font-bold text-gray-900 leading-none">Dashboard</h1>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-4">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-brand-primary-light text-brand-primary font-bold" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-brand-primary" : "text-gray-400"}`} />
                  {item.label}
                </Link>
                
                {item.children && isActive && (
                  <div className="ml-8 space-y-1 mt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          pathname === child.href
                            ? "text-brand-primary font-bold"
                            : "text-gray-400 hover:text-brand-primary"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-6 space-y-1 border-t border-gray-100">
        <button
          onClick={() => setShowSupportPopup(true)}
          className="flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all text-left"
        >
          <HelpCircle className="mr-3 h-5 w-5 text-gray-400" />
          Support
        </button>

        {/* Support Popup */}
        {showSupportPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setShowSupportPopup(false)}
                className="absolute top-4 right-4 h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-brand-primary-light text-brand-primary rounded-2xl flex items-center justify-center mx-auto">
                  <HelpCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Support</h3>
                <p className="text-gray-500 font-bold leading-relaxed">
                  Kein Support, schreib mir einfach :)
                </p>
                <button 
                  onClick={() => setShowSupportPopup(false)}
                  className="w-full py-3 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                >
                  Alles klar
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
