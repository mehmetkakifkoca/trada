"use client";

import { useState } from "react";
import { useDataStore, Expense } from "@/store/data-store";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ShoppingBag,
  Zap,
  Coffee,
  Car,
  MoreHorizontal,
  X,
  Trash2,
  Save,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    title: "",
    category: "Software",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    status: "Bezahlt"
  });

  const categories = [
    { name: "Software", icon: Zap, color: "text-blue-500 bg-blue-50" },
    { name: "Marketing", icon: ShoppingBag, color: "text-indigo-500 bg-indigo-50" },
    { name: "Bewirtung", icon: Coffee, color: "text-orange-500 bg-orange-50" },
    { name: "Reisekosten", icon: Car, color: "text-emerald-500 bg-emerald-50" },
    { name: "Hardware", icon: ShoppingBag, color: "text-purple-500 bg-purple-50" },
    { name: "Sonstiges", icon: ShoppingBag, color: "text-gray-500 bg-gray-50" },
  ];

  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      toast.error("Titel und Betrag sind erforderlich.");
      return;
    }

    const newExpense: Expense = {
      ...formData as Expense,
      id: "ex" + Date.now(),
    };
    addExpense(newExpense);
    toast.success("Ausgabe erfasst");
    setIsModalOpen(false);
  };

  const getCategoryTotal = (cat: string) => {
    return expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Ausgaben</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Erfassen und kategorisieren Sie Ihre betrieblichen Ausgaben.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
        >
          <Plus className="h-5 w-5" />
          Ausgabe erfassen
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.slice(0, 4).map((cat, i) => {
          const total = getCategoryTotal(cat.name);
          return (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.name}</p>
              <h3 className="text-xl font-bold mt-1 tracking-tight">{formatCurrency(total)}</h3>
              <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color.split(' ')[0]} w-[60%] rounded-full`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Suche..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredExpenses.map((exp) => {
            const cat = categories.find(c => c.name === exp.category) || categories[5];
            return (
              <div key={exp.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{exp.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{exp.category} • {exp.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-red-500">-{formatCurrency(exp.amount)}</span>
                  <button 
                    onClick={() => { if(confirm("Ausgabe löschen?")) deleteExpense(exp.id); }}
                    className="text-red-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredExpenses.length === 0 && (
            <div className="py-20 text-center text-gray-400 text-sm">Keine Ausgaben gefunden.</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Ausgabe erfassen</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-all"><X className="h-6 w-6" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zweck / Titel *</label>
                   <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategorie</label>
                   <select 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                   >
                     {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Betrag (€) *</label>
                      <input 
                        type="number" step="0.01" required
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Datum</label>
                      <input 
                        type="date" required
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                   </div>
                </div>
                <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold hover:bg-gray-800 shadow-xl transition-all flex items-center justify-center gap-2">
                   <Save className="h-4 w-4" /> Ausgabe speichern
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
