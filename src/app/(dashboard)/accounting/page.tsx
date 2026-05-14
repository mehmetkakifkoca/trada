"use client";

import Link from "next/link";
import { useDataStore } from "@/store/data-store";
import { 
  Plus, 
  FileText, 
  Euro, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Building2,
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

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Buchhaltung</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Finanzielle Übersicht und Verwaltung Ihres Unternehmens.</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-8 rounded-[32px] shadow-xl shadow-black/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Euro className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">+18.5%</span>
            </div>
            <p className="text-xs font-medium text-white/50 mb-1">Netto Gewinn</p>
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(netProfit)}</h3>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white transition-all cursor-pointer">
              Finanzbericht <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Aktiv</span>
          </div>
          <p className="text-xs font-medium text-gray-400 mb-1">Gesamt Einnahmen</p>
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalInvoiced)}</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">{invoices.length} Rechnungen</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Geplant</span>
          </div>
          <p className="text-xs font-medium text-gray-400 mb-1">Gesamt Ausgaben</p>
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalExpenses)}</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">{expenses.length} Belege</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${item.color}`}>
              <item.icon className="h-7 w-7" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.stats}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              {item.desc}
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:gap-4 transition-all">
              Öffnen <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
