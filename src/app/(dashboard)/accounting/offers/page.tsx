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
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Angebote</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Erstellen und verfolgen Sie Angebote für Ihre Kunden.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
        >
          <Plus className="h-5 w-5" />
          Neues Angebot
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black/5 transition-all">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{item.count}</h3>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-gray-50 group-hover:scale-110 transition-transform`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-4">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between mb-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Suchen..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="space-y-3">
          {offers
            .filter(o => o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((offer) => (
            <div key={offer.id} className="p-6 rounded-[28px] border border-gray-50 hover:border-gray-200 hover:bg-gray-50/50 transition-all group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-gray-900">{offer.id}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${offer.color}`}>
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-1">{offer.customer}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Erstellt am {offer.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-12">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gesamtbetrag</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{offer.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => toast.info("Angebot wird verschickt...")} className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Send className="h-4 w-4" />
                   </button>
                   <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <ChevronRight className="h-5 w-5" />
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
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Neues Angebot</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black"><X className="h-6 w-6" /></button>
             </div>
             <form onSubmit={handleCreateOffer} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kunde *</label>
                   <select required className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm appearance-none outline-none">
                     <option value="">Wählen...</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Betrag (€) *</label>
                   <input type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" placeholder="0.00" />
                </div>
                <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold hover:bg-gray-800 shadow-xl transition-all flex items-center justify-center gap-2">
                   <Save className="h-4 w-4" /> Entwurf speichern
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
