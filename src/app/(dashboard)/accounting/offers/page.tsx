"use client";

import { useState } from "react";
import { useDataStore } from "@/store/data-store";
import { 
  Plus, 
  Search, 
  Send, 
  FileCheck, 
  Clock, 
  XCircle,
  MoreHorizontal,
  ChevronRight,
  X,
  Save,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function OffersPage() {
  const { customers } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [offers, setOffers] = useState([
    { id: "ANG-2024-012", customer: "Blue Horizon Media", date: "10. Okt 2023", amount: "12.500,00 €", status: "ANGENOMMEN", color: "text-emerald-500 bg-emerald-50" },
    { id: "ANG-2024-013", customer: "Future Retail GmbH", date: "12. Okt 2023", amount: "4.800,00 €", status: "OFFEN", color: "text-orange-500 bg-orange-50" },
    { id: "ANG-2024-014", customer: "Green Leaf Co.", date: "14. Okt 2023", amount: "8.200,00 €", status: "ENTWURF", color: "text-gray-500 bg-gray-50" },
  ]);

  const stats = [
    { label: "Entwürfe", count: offers.filter(o => o.status === "ENTWURF").length, icon: Clock, color: "text-gray-400" },
    { label: "Verschickt", count: offers.filter(o => o.status === "OFFEN").length, icon: Send, color: "text-blue-500" },
    { label: "Angenommen", count: offers.filter(o => o.status === "ANGENOMMEN").length, icon: FileCheck, color: "text-emerald-500" },
    { label: "Abgelehnt", count: 0, icon: XCircle, color: "text-red-400" },
  ];

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Angebot erfolgreich erstellt und als Entwurf gespeichert.");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Angebote</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Erstellen und verfolgen Sie Angebote für Ihre Kunden.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" />
          Neues Angebot
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black/5 transition-all">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{item.label}</p>
              <h3 className="text-base font-bold mt-1 tracking-tight text-gray-900">{item.count}</h3>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-gray-50 group-hover:scale-105 transition-transform`}>
              <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="p-3 border-b border-gray-50 flex items-center justify-between mb-3">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Suchen..." 
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-black/5 outline-none font-medium text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="space-y-2">
          {offers
            .filter(o => o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((offer) => (
            <div key={offer.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-9 w-9 bg-gray-900 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <FileCheck className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900">{offer.id}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${offer.color}`}>
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-0.5 leading-snug truncate">{offer.customer}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 font-medium">Erstellt am {offer.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 self-end sm:self-auto">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gesamtbetrag</p>
                  <p className="text-xs font-bold text-gray-900 mt-1">{offer.amount}</p>
                </div>
                <div className="flex items-center gap-1.5">
                   <button onClick={() => toast.info("Angebot wird verschickt...")} className="h-7 w-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Send className="h-3.5 w-3.5" />
                   </button>
                   <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all text-gray-500">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
             <div className="p-4 sm:p-5 border-b border-gray-50 flex items-center justify-between bg-white">
                <h2 className="text-sm font-bold text-gray-900">Neues Angebot</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors"><X className="h-5 w-5" /></button>
             </div>
             <form onSubmit={handleCreateOffer} className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Kunde *</label>
                   <select required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs appearance-none outline-none font-bold text-gray-800">
                     <option value="">Wählen...</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Betrag (€) *</label>
                   <input type="number" required className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none font-bold text-gray-800" placeholder="0.00" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider">
                   <Save className="h-3.5 w-3.5" /> Entwurf speichern
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
