"use client";

import Link from "next/link";
import { useDataStore } from "@/store/data-store";
import { 
  Euro, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  FileText,
  Wallet,
  FileSearch
} from "lucide-react";

export default function AccountingPage() {
  const { invoices, expenses } = useDataStore();

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amountGross || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalInvoiced - totalExpenses;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Sort and slice recent activities
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buchhaltung</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Finanzielle Übersicht und Verwaltung Ihres Unternehmens.</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Euro className="h-4 w-4 text-white" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">+18.5%</span>
              </div>
              <p className="text-[10px] font-medium text-white/50 mb-0.5">Netto Gewinn</p>
              <h3 className="text-xl font-bold tracking-tight">{formatCurrency(netProfit)}</h3>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white transition-all cursor-pointer">
              Finanzbericht <ArrowUpRight className="h-2.5 w-2.5" />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Aktiv</span>
          </div>
          <p className="text-[10px] font-medium text-gray-400 mb-0.5">Gesamt Einnahmen</p>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalInvoiced)}</h3>
          <p className="text-[9px] font-bold text-gray-400 mt-2.5 uppercase tracking-widest">{invoices.length} Rechnungen</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Geplant</span>
          </div>
          <p className="text-[10px] font-medium text-gray-400 mb-0.5">Gesamt Ausgaben</p>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalExpenses)}</h3>
          <p className="text-[9px] font-bold text-gray-400 mt-2.5 uppercase tracking-widest">{expenses.length} Belege</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            title: "Rechnungen", 
            desc: "Erstellen und verwalten Sie Ihre Ausgangsrechnungen.", 
            href: "/accounting/invoices", 
            icon: FileText,
            color: "bg-blue-50 text-blue-600",
            stats: `${invoices.filter(i => i.status === "OFFEN").length} Offen`
          },
          { 
            title: "Ausgaben", 
            desc: "Erfassen Sie Belege und betriebliche Fixkosten.", 
            href: "/accounting/expenses", 
            icon: Wallet,
            color: "bg-pink-50 text-pink-600",
            stats: `${expenses.length} Belege`
          },
          { 
            title: "Angebote", 
            desc: "Erstellen Sie Angebote und verfolgen Sie die Pipeline.", 
            href: "/accounting/offers", 
            icon: FileSearch,
            color: "bg-indigo-50 text-indigo-600",
            stats: "Pipeline aktiv"
          },
        ].map((item, i) => (
          <Link 
            key={i} 
            href={item.href}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.stats}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                {item.desc}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-900 group-hover:gap-2 transition-all">
              Öffnen <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Letzte Rechnungen</h3>
            <Link href="/accounting/invoices" className="text-[10px] font-bold text-neutral-500 hover:text-black uppercase tracking-wider">
              Alle ansehen
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="py-2 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors px-1 rounded-lg">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-xs">{inv.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      inv.status === "BEZAHLT" ? "bg-emerald-50 text-emerald-600" :
                      inv.status === "OFFEN" ? "bg-orange-50 text-orange-600" :
                      inv.status === "OVERDUE" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{inv.customerName}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 text-xs">{formatCurrency(inv.amountGross || 0)}</span>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">{inv.date}</p>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && (
              <p className="text-center text-gray-400 py-6 text-xs font-medium">Keine Rechnungen vorhanden.</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Letzte Ausgaben</h3>
            <Link href="/accounting/expenses" className="text-[10px] font-bold text-neutral-500 hover:text-black uppercase tracking-wider">
              Alle ansehen
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="py-2 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors px-1 rounded-lg">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-xs truncate">{exp.title}</p>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">{exp.category}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-500 text-xs">-{formatCurrency(exp.amount)}</span>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">{exp.date}</p>
                </div>
              </div>
            ))}
            {recentExpenses.length === 0 && (
              <p className="text-center text-gray-400 py-6 text-xs font-medium">Keine Ausgaben vorhanden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
