"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  useDataStore, 
  Invoice, 
  InvoiceStatus, 
  RecurringInvoice 
} from "@/store/data-store";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  FileText,
  Clock,
  AlertCircle,
  X,
  Mail,
  Printer,
  Edit3,
  ChevronDown,
  ExternalLink,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
  FilterX,
  Copy,
  Archive,
  Ban,
  RefreshCw,
  Play,
  Pause,
  History,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  ENTWURF: { label: "Entwurf", color: "text-blue-600", bg: "bg-blue-50" },
  OFFEN: { label: "Offen", color: "text-orange-600", bg: "bg-orange-50" },
  BEZAHLT: { label: "Bezahlt", color: "text-emerald-600", bg: "bg-emerald-50" },
  OVERDUE: { label: "Überfällig", color: "text-red-600", bg: "bg-red-50" },
  STORNIERT: { label: "Storniert", color: "text-gray-600", bg: "bg-gray-50" },
  CREDITED: { label: "Gutschrift", color: "text-purple-600", bg: "bg-purple-50" },
};

export default function InvoicesDashboard() {
  const router = useRouter();
  const { 
    invoices, 
    deleteInvoice, 
    updateInvoice, 
    addInvoice,
    recurringConfigs,
    updateRecurringConfig,
    deleteRecurringConfig
  } = useDataStore();
  
  // Tabs & Views
  const [viewMode, setViewMode] = useState<"ALL" | "RECURRING">("ALL");

  // Filter & State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [partialInvoiceData, setPartialInvoiceData] = useState<{
    originalInvoice: Invoice | null;
    mode: 'PERCENTAGE' | 'AMOUNT';
    value: number;
  }>({ originalInvoice: null, mode: 'PERCENTAGE', value: 50 });

  // Stats
  const stats = useMemo(() => {
    const total = invoices.reduce((acc, inv) => acc + (inv.amountGross || 0), 0);
    const open = invoices.filter(i => i.status === "OFFEN").reduce((acc, inv) => acc + (inv.amountGross || 0), 0);
    const overdue = invoices.filter(i => i.status === "OVERDUE").reduce((acc, inv) => acc + (inv.amountGross || 0), 0);
    return { total, open, overdue };
  }, [invoices]);

  // Filtering & Sorting (Alle Rechnungen)
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const matchesSearch = 
          inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
          inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [invoices, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key: keyof Invoice) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDuplizieren = (invoice: Invoice) => {
    const newInvoice = {
      ...invoice,
      id: `RE-COPY-${Date.now().toString().slice(-4)}`,
      status: "ENTWURF" as const,
      date: new Date().toISOString().split('T')[0],
      amountPaid: 0,
      history: [{ date: new Date().toISOString(), action: "Dupliziert", user: "Admin" }]
    };
    addInvoice(newInvoice);
    toast.success("Rechnung dupliziert");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handleCreatePartialInvoice = () => {
    if (!partialInvoiceData.originalInvoice) return;
    
    const { originalInvoice, mode, value } = partialInvoiceData;
    let partialAmountNet = 0;
    
    if (mode === 'PERCENTAGE') {
      partialAmountNet = originalInvoice.amountNet * (value / 100);
    } else {
      partialAmountNet = value;
    }

    const partialAmountVat = partialAmountNet * 0.19; // Simplified 19%
    const partialAmountGross = partialAmountNet + partialAmountVat;

    const newInvoice: Invoice = {
      ...originalInvoice,
      id: `TEIL-${originalInvoice.id}-${Date.now().toString().slice(-4)}`,
      status: "OFFEN",
      date: new Date().toISOString().split('T')[0],
      amountNet: partialAmountNet,
      amountVat: partialAmountVat,
      amountGross: partialAmountGross,
      amountPaid: 0,
      positions: [
        {
          id: "p1",
          name: `Teilrechnung zu ${originalInvoice.id}`,
          description: mode === 'PERCENTAGE' ? `${value}% der Gesamtsumme` : `Teilbetrag`,
          quantity: 1,
          unit: "piece",
          priceNet: partialAmountNet,
          vatRate: 19,
          discountPercent: 0,
          type: "item"
        }
      ],
      history: [{ date: new Date().toISOString(), action: "Teilrechnung erstellt", user: "Admin" }]
    };

    addInvoice(newInvoice);
    setIsPartialModalOpen(false);
    toast.success("Teilrechnung erfolgreich erstellt");
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Rechnungsübersicht</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Professionelle Verwaltung Ihrer Ausgangsrechnungen.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/accounting/invoices/new")}
            className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-2xl text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-brand-secondary/20"
          >
            <Plus className="h-5 w-5" />
            Neue Rechnung
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-900" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gesamtvolumen</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(stats.total)}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offener Betrag</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight text-orange-600">{formatCurrency(stats.open)}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight text-red-600">{formatCurrency(stats.overdue)}</h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 px-2">
        <button 
          onClick={() => setViewMode("ALL")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${viewMode === "ALL" ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-600"}`}
        >
          Alle Rechnungen
        </button>
        <button 
          onClick={() => setViewMode("RECURRING")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${viewMode === "RECURRING" ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-600"}`}
        >
          Wiederkehrende Rechnungen
        </button>
      </div>

      {viewMode === "ALL" ? (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-gray-100 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "ENTWURF", "OFFEN", "BEZAHLT", "OVERDUE", "STORNIERT"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    statusFilter === status 
                      ? "bg-brand-secondary text-white shadow-md shadow-brand-secondary/10" 
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {status === "ALL" ? "Alle Rechnungen" : statusConfig[status as InvoiceStatus]?.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Suche nach Rechnungs-ID oder Kunde..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">
                  <Filter className="h-4 w-4" /> Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">
                  <Download className="h-4 w-4" /> Exportieren
                </button>
              </div>
            </div>
          </div>

          <div className="">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-2">ID <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('customerName')}>
                    <div className="flex items-center gap-2">Kunde <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-2">Datum <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-black transition-colors" onClick={() => handleSort('amountGross')}>
                    <div className="flex items-center gap-2 justify-end">Betrag <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-gray-900">{inv.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{inv.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-500 font-medium">{inv.date}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(inv.amountGross || 0)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusConfig[inv.status]?.bg} ${statusConfig[inv.status]?.color}`}>
                        {statusConfig[inv.status]?.label}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button 
                          onClick={() => router.push(`/accounting/invoices/${inv.id}`)}
                          className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                            className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {activeMenu === inv.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => { handleDuplizieren(inv); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                  <Copy className="h-4 w-4" /> Duplizieren
                                </button>
                                <button onClick={() => { router.push(`/accounting/invoices/${inv.id}?print=true`); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                  <Printer className="h-4 w-4" /> Drucken / PDF
                                </button>
                                <button onClick={() => { toast.info("Email Modal..."); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                  <Mail className="h-4 w-4" /> E-Mail senden
                                </button>
                                <div className="h-px bg-gray-50 my-1" />
                                <p className="px-4 py-1 text-[9px] font-black text-gray-300 uppercase tracking-widest">Status ändern</p>
                                {Object.entries(statusConfig).map(([status, cfg]) => (
                                  <button 
                                    key={status}
                                    onClick={() => { updateInvoice(inv.id, { status: status as InvoiceStatus }); setActiveMenu(null); toast.success(`Status auf ${cfg.label} geändert`); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors ${inv.status === status ? cfg.color : 'text-gray-600'}`}
                                  >
                                    <div className={`h-2 w-2 rounded-full ${cfg.bg.replace('bg-', 'bg-')}`} style={{ backgroundColor: 'currentColor' }} />
                                    {cfg.label}
                                  </button>
                                ))}

                                <div className="h-px bg-gray-50 my-1" />
                                <button onClick={() => { setPartialInvoiceData({ originalInvoice: inv, mode: 'PERCENTAGE', value: 50 }); setIsPartialModalOpen(true); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                                  <ExternalLink className="h-4 w-4" /> Teilrechnung
                                </button>
                                
                                <button onClick={() => { if(confirm("Archivieren this invoice?")) { /* Logic here */ } setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                                  <Archive className="h-4 w-4" /> Archivieren
                                </button>
                                <button onClick={() => { if(confirm("Löschen this invoice?")) deleteInvoice(inv.id); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="h-4 w-4" /> Löschen
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
           {recurringConfigs.length === 0 ? (
             <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-20 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                   <RefreshCw className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Wiederkehrende Rechnungen</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Automatisieren Sie Ihre regelmäßigen Abrechnungszyklen. Create a template and set the interval.</p>
                <button 
                  onClick={() => router.push("/accounting/invoices/new?mode=recurring")}
                  className="mt-8 px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all"
                >
                  Wiederkehrende Abrechnung einrichten
                </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recurringConfigs.map(config => (
                  <div key={config.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group">
                     <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${config.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                              <RefreshCw className={`h-6 w-6 ${config.isActive ? 'animate-spin-slow' : ''}`} />
                           </div>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateRecurringConfig(config.id, { isActive: !config.isActive })}
                                className={`p-2 rounded-xl transition-all ${config.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {config.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                              </button>
                              <button onClick={() => deleteRecurringConfig(config.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 className="h-5 w-5" />
                              </button>
                           </div>
                        </div>

                        <div>
                           <h3 className="text-xl font-bold text-gray-900">Abonnement für {config.templateInvoice.customerName}</h3>
                           <div className="flex items-center gap-4 mt-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                 <Calendar className="h-3 w-3" /> {config.interval}
                              </span>
                              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Next: {config.nextGenerationDate}</span>
                           </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rechnungsbetrag</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(config.templateInvoice.amountGross || 0)}</p>
                           </div>
                           <button className="text-xs font-bold text-black flex items-center gap-1 hover:underline">
                              Vorlage anzeigen <ChevronDown className="h-4 w-4" />
                           </button>
                        </div>

                        <div className="pt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                           <div className="flex items-center gap-2">
                              <History className="h-3 w-3" /> {config.history.length} Invoices generated
                           </div>
                           <button className="hover:text-black transition-colors">Verlauf anzeigen</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {isPartialModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Teilrechnung erstellen</h2>
              <button onClick={() => setIsPartialModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                <button 
                  onClick={() => setPartialInvoiceData(p => ({ ...p, mode: 'PERCENTAGE' }))}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${partialInvoiceData.mode === 'PERCENTAGE' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                >
                  Prozentual (%)
                </button>
                <button 
                  onClick={() => setPartialInvoiceData(p => ({ ...p, mode: 'AMOUNT' }))}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${partialInvoiceData.mode === 'AMOUNT' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                >
                  Betrag (€)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {partialInvoiceData.mode === 'PERCENTAGE' ? 'Anteil in Prozent' : 'Betrag in Euro'}
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xl font-bold outline-none focus:ring-2 focus:ring-brand-secondary/20"
                    value={partialInvoiceData.value}
                    onChange={(e) => setPartialInvoiceData(p => ({ ...p, value: Number(e.target.value) }))}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black text-gray-300">
                    {partialInvoiceData.mode === 'PERCENTAGE' ? '%' : '€'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <span>Vorschau Netto</span>
                  <span>
                    {formatCurrency(partialInvoiceData.mode === 'PERCENTAGE' 
                      ? (partialInvoiceData.originalInvoice?.amountNet || 0) * (partialInvoiceData.value / 100) 
                      : partialInvoiceData.value)}
                  </span>
                </div>
                <div className="h-px bg-blue-100" />
                <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                  Es wird eine neue Rechnung mit dem gewählten Anteil erstellt. Die Originalrechnung bleibt unverändert.
                </p>
              </div>

              <button 
                onClick={handleCreatePartialInvoice}
                className="w-full py-5 bg-brand-secondary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-secondary/20 flex items-center justify-center gap-3"
              >
                <Plus className="h-5 w-5" /> Teilrechnung erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
