"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  useDataStore, 
  Invoice, 
  InvoicePosition, 
  InvoiceType, 
  Customer, 
  Product 
} from "@/store/data-store";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Layout, 
  Type, 
  Euro, 
  Globe, 
  Calendar as CalendarIcon,
  UserPlus,
  Package,
  Settings,
  FileText,
  Percent,
  CheckCircle2,
  X,
  Copy,
  Printer,
  Eye,
  Clock
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

const UNITS = ["hour", "piece", "day", "month", "project", "package"] as const;
const LANGUAGES = ["German", "English", "Turkish"] as const;
const TAX_MODES = ["Austria", "Germany", "EU", "non-EU"] as const;
const INVOICE_TYPES: InvoiceType[] = [
  "Standardrechnung", "Wiederkehrende Rechnung", "Teilrechnung", 
  "Schlussrechnung", "Abschlagsrechnung", "Proforma-Rechnung", 
  "Gutschrift", "Stornorechnung"
];

export default function InvoiceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    invoices, 
    customers, 
    products, 
    invoiceSettings, 
    addInvoice, 
    updateInvoice,
    addCustomer,
    addProduct
  } = useDataStore();
  const searchParams = useSearchParams();
  const printFlag = searchParams.get("print") === "true";

  const isNew = params.id === "new";
  const existingInvoice = useMemo(() => 
    invoices.find(inv => inv.id === params.id), 
  [invoices, params.id]);

  // Editor State
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    id: "",
    type: "Standardrechnung",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    currency: "EUR",
    language: "German",
    taxMode: "Germany",
    paymentTerms: "Zahlbar innerhalb von 14 Tagen.",
    paymentMethod: "Bank transfer",
    positions: [],
    amountNet: 0,
    amountVat: 0,
    amountGross: 0,
    amountPaid: 0,
    status: "ENTWURF"
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isNew && existingInvoice) {
      setInvoice(existingInvoice);
      if (printFlag) {
        setIsPreviewOpen(true);
        setTimeout(() => window.print(), 1000);
      }
    } else if (isNew) {
      // Auto-generate invoice number based on settings
      const year = new Date().getFullYear();
      const num = String(invoiceSettings.nextNumber).padStart(3, '0');
      setInvoice(prev => ({
        ...prev,
        id: `RE-${year}-${num}`,
        paymentTerms: invoiceSettings.defaultPaymentTerms,
        currency: invoiceSettings.defaultCurrency,
        language: invoiceSettings.defaultLanguage,
        footerText: invoiceSettings.defaultFooter
      }));
    }
  }, [isNew, existingInvoice, invoiceSettings]);

  // Calculations
  const totals = useMemo(() => {
    const net = invoice.positions?.reduce((acc, pos) => {
      if (pos.type !== 'item') return acc;
      const itemTotal = pos.quantity * pos.priceNet;
      const discount = itemTotal * (pos.discountPercent / 100);
      return acc + (itemTotal - discount);
    }, 0) || 0;

    // Simplified VAT calculation (grouped by rate)
    const vat = invoice.positions?.reduce((acc, pos) => {
      if (pos.type !== 'item') return acc;
      const itemTotal = pos.quantity * pos.priceNet;
      const discount = itemTotal * (pos.discountPercent / 100);
      return acc + ((itemTotal - discount) * (pos.vatRate / 100));
    }, 0) || 0;

    return { net, vat, gross: net + vat };
  }, [invoice.positions]);

  useEffect(() => {
    setInvoice(prev => ({
      ...prev,
      amountNet: totals.net,
      amountVat: totals.vat,
      amountGross: totals.gross
    }));
  }, [totals]);

  // Actions
  const handleAddPosition = (type: InvoicePosition['type'] = 'item') => {
    const newPos: InvoicePosition = {
      id: Math.random().toString(36).substr(2, 9),
      name: type === 'item' ? "" : type.toUpperCase(),
      description: "",
      quantity: 1,
      unit: "piece",
      priceNet: 0,
      vatRate: invoiceSettings.defaultVatRate,
      discountPercent: 0,
      type
    };
    setInvoice(prev => ({
      ...prev,
      positions: [...(prev.positions || []), newPos]
    }));
  };

  const updatePosition = (id: string, updates: Partial<InvoicePosition>) => {
    setInvoice(prev => ({
      ...prev,
      positions: prev.positions?.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const removePosition = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      positions: prev.positions?.filter(p => p.id !== id)
    }));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(invoice.positions || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setInvoice(prev => ({ ...prev, positions: items }));
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<"data" | "payments" | "history">("data");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Validation
  const validate = () => {
    if (!invoice.customerId) return "Bitte wählen Sie einen Kunden aus.";
    if (!invoice.id) return "Rechnungsnummer fehlt.";
    if (!invoice.date) return "Rechnungsdatum fehlt.";
    if (!invoice.positions?.length) return "Mindestens eine Position erforderlich.";
    const emptyPos = invoice.positions.find(p => p.type === 'item' && !p.name);
    if (emptyPos) return "Name der Position fehlt.";
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) return toast.error(error);
    
    if (isNew) {
      addInvoice({ ...invoice, status: "OFFEN" } as Invoice);
    } else {
      updateInvoice(invoice.id!, invoice);
    }
    
    toast.success(isNew ? "Rechnung erstellt" : "Rechnung aktualisiert");
    router.push("/accounting/invoices");
  };

  const handleAddProduct = (p: Product) => {
    const newPos: InvoicePosition = {
      id: Math.random().toString(36).substr(2, 9),
      productId: p.id,
      name: p.name,
      description: p.description,
      quantity: 1,
      unit: p.unit,
      priceNet: p.defaultPrice,
      vatRate: p.vatRate,
      discountPercent: 0,
      type: "item"
    };
    setInvoice(prev => ({
      ...prev,
      positions: [...(prev.positions || []), newPos]
    }));
    setIsProductModalOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat((e.currentTarget.elements.namedItem('amount') as HTMLInputElement).value);
    const newPaid = (invoice.amountPaid || 0) + amount;
    setInvoice({ ...invoice, amountPaid: newPaid, status: newPaid >= (invoice.amountGross || 0) ? "BEZAHLT" : "OFFEN" });
    toast.success("Zahlung erfasst");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(val);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? "Neue Rechnung" : `Bearbeite ${invoice.id}`}</h1>
            <div className="flex items-center gap-2">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{invoice.type}</p>
               <span className="h-1 w-1 bg-gray-200 rounded-full" />
               <span className={`text-[9px] font-bold uppercase tracking-widest ${invoice.status === 'BEZAHLT' ? 'text-emerald-500' : 'text-orange-500'}`}>{invoice.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-all"
          >
            <Eye className="h-4 w-4" /> Vorschau
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
          >
            <Save className="h-5 w-5" /> {isNew ? "Speichern" : "Aktualisieren"}
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-100 px-4">
        <button onClick={() => setActiveTab("data")} className={`pb-4 text-xs font-bold transition-all border-b-2 ${activeTab === "data" ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-600"}`}>Rechnungsdaten</button>
        {!isNew && (
          <>
            <button onClick={() => setActiveTab("payments")} className={`pb-4 text-xs font-bold transition-all border-b-2 ${activeTab === "payments" ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-600"}`}>Zahlungen</button>
            <button onClick={() => setActiveTab("history")} className={`pb-4 text-xs font-bold transition-all border-b-2 ${activeTab === "history" ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-600"}`}>Historie</button>
          </>
        )}
      </div>

      {activeTab === "data" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Left Side: Main Editor */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section: Items Table */}
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-400" /> Positionen
                </h2>
                <div className="flex items-center gap-2">
                   <button onClick={() => setIsProductModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg hover:bg-gray-800 transition-all uppercase tracking-wider">
                      <Search className="h-3 w-3" /> Produkt-Datenbank
                   </button>
                   <button onClick={() => handleAddPosition('separator')} className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-all uppercase tracking-wider">Trenner</button>
                   <button onClick={() => handleAddPosition('note')} className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-all uppercase tracking-wider">Textzeile</button>
                </div>
              </div>

              <div className="p-2">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="positions">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                        {invoice.positions?.map((pos, index) => (
                          <Draggable key={pos.id} draggableId={pos.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all group flex items-start gap-4 ${pos.type !== 'item' ? 'bg-gray-50/30' : ''}`}
                              >
                                <div {...provided.dragHandleProps} className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-4 w-4 text-gray-300" />
                                </div>

                                <div className="flex-1 grid grid-cols-12 gap-4">
                                  {pos.type === 'item' ? (
                                    <>
                                      <div className="col-span-12 md:col-span-6 space-y-1">
                                        <input 
                                          type="text" 
                                          placeholder="Produkt/Dienstleistung" 
                                          className="w-full bg-transparent font-bold text-sm outline-none border-b border-transparent focus:border-black/10 pb-1"
                                          value={pos.name}
                                          onChange={(e) => updatePosition(pos.id, { name: e.target.value })}
                                        />
                                        <textarea 
                                          placeholder="Beschreibung (optional)" 
                                          className="w-full bg-transparent text-xs text-gray-500 outline-none resize-none"
                                          rows={1}
                                          value={pos.description}
                                          onChange={(e) => updatePosition(pos.id, { description: e.target.value })}
                                        />
                                      </div>
                                      <div className="col-span-3 md:col-span-1">
                                        <input 
                                          type="number" 
                                          className="w-full bg-transparent text-sm text-center outline-none border-b border-transparent focus:border-black/10 pb-1"
                                          value={pos.quantity}
                                          onChange={(e) => updatePosition(pos.id, { quantity: parseFloat(e.target.value) || 0 })}
                                        />
                                        <select 
                                          className="w-full bg-transparent text-[10px] text-gray-400 outline-none appearance-none text-center cursor-pointer"
                                          value={pos.unit}
                                          onChange={(e) => updatePosition(pos.id, { unit: e.target.value as any })}
                                        >
                                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                      </div>
                                      <div className="col-span-3 md:col-span-2">
                                        <input 
                                          type="number" 
                                          className="w-full bg-transparent text-sm text-right outline-none border-b border-transparent focus:border-black/10 pb-1 font-medium"
                                          value={pos.priceNet}
                                          onChange={(e) => updatePosition(pos.id, { priceNet: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="flex items-center justify-end gap-1">
                                          <span className="text-[10px] text-gray-400 uppercase">VAT</span>
                                          <select 
                                            className="bg-transparent text-[10px] font-bold outline-none"
                                            value={pos.vatRate}
                                            onChange={(e) => updatePosition(pos.id, { vatRate: parseInt(e.target.value) })}
                                          >
                                            <option value={19}>19%</option>
                                            <option value={7}>7%</option>
                                            <option value={0}>0%</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="col-span-3 md:col-span-1">
                                        <div className="flex items-center gap-1 border-b border-transparent focus-within:border-black/10">
                                          <input 
                                            type="number" 
                                            className="w-full bg-transparent text-sm text-right outline-none pb-1"
                                            value={pos.discountPercent}
                                            onChange={(e) => updatePosition(pos.id, { discountPercent: parseFloat(e.target.value) || 0 })}
                                          />
                                          <Percent className="h-3 w-3 text-gray-300" />
                                        </div>
                                        <p className="text-[10px] text-gray-300 text-right mt-1">DISC.</p>
                                      </div>
                                      <div className="col-span-3 md:col-span-2 text-right pt-1">
                                        <p className="text-sm font-bold text-gray-900">
                                          {formatCurrency((pos.quantity * pos.priceNet) * (1 - pos.discountPercent / 100))}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="col-span-12">
                                      <input 
                                        type="text" 
                                        className={`w-full bg-transparent outline-none font-bold ${pos.type === 'separator' ? 'text-gray-900' : 'text-gray-400 italic'}`}
                                        placeholder={pos.type === 'separator' ? "Überschrift..." : "Hinweistext hinzufügen..."}
                                        value={pos.name}
                                        onChange={(e) => updatePosition(pos.id, { name: e.target.value })}
                                      />
                                    </div>
                                  )}
                                </div>

                                <button onClick={() => removePosition(pos.id)} className="mt-1 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              <div className="p-8 border-t border-gray-50 flex items-center justify-between">
                 <button 
                  onClick={() => handleAddPosition('item')}
                  className="flex items-center gap-2 text-sm font-bold text-black hover:opacity-70 transition-all"
                 >
                   <Plus className="h-5 w-5" /> Position hinzufügen
                 </button>
                 
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zwischensumme (Netto)</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amountNet || 0)}</p>
                    </div>
                 </div>
              </div>
            </section>

            {/* Section: Texts */}
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-6">
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Type className="h-4 w-4" /> Einleitungstext
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-black/5 min-h-[80px]"
                    placeholder="z.B. Anbei erhalten Sie die Rechnung für die im Mai 2024 erbrachten Leistungen."
                    value={invoice.introText}
                    onChange={(e) => setInvoice({...invoice, introText: e.target.value})}
                  />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Fußzeilentext / Rechtliches
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-black/5 min-h-[80px]"
                    placeholder="z.B. Kleinunternehmerregelung gemäß § 19 UStG..."
                    value={invoice.footerText}
                    onChange={(e) => setInvoice({...invoice, footerText: e.target.value})}
                  />
               </div>
            </section>
          </div>

          {/* Right Side: Settings & Totals */}
          <div className="space-y-8">
            
            {/* Totals Summary Card */}
            <section className="bg-black text-white rounded-[40px] p-8 shadow-2xl shadow-black/20">
               <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">Berechnung</h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-white/50">Netto Gesamt</span>
                     <span className="font-bold">{formatCurrency(invoice.amountNet || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-white/50">VAT ({invoiceSettings.defaultVatRate}%)</span>
                     <span className="font-bold">{formatCurrency(invoice.amountVat || 0)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                     <span className="text-lg font-bold">Brutto Gesamt</span>
                     <span className="text-3xl font-bold tracking-tight">{formatCurrency(invoice.amountGross || 0)}</span>
                  </div>
               </div>
            </section>

            {/* Customer Selection */}
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</h3>
               <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm appearance-none outline-none focus:ring-2 focus:ring-black/5"
                      value={invoice.customerId}
                      onChange={(e) => {
                        const c = customers.find(cust => cust.id === e.target.value);
                        if (c) setInvoice({ ...invoice, customerId: c.id, customerName: c.name, email: c.email });
                      }}
                    >
                      <option value="">Kunde auswählen...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 hover:border-black hover:text-black transition-all uppercase tracking-widest"
                  >
                    <UserPlus className="h-4 w-4" /> Neuen Kunden hinzufügen
                  </button>
               </div>
            </section>

            {/* Invoice Basics */}
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grundlagen</h3>
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rechnungsnummer</label>
                     <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none"
                      value={invoice.id}
                      onChange={(e) => setInvoice({...invoice, id: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rechnungstyp</label>
                     <select 
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none appearance-none"
                      value={invoice.type}
                      onChange={(e) => setInvoice({...invoice, type: e.target.value as any})}
                     >
                       {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Datum</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-[10px] font-bold outline-none"
                        value={invoice.date}
                        onChange={(e) => setInvoice({...invoice, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Datum</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-[10px] font-bold outline-none"
                        value={invoice.dueDate}
                        onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})}
                      />
                    </div>
                  </div>
               </div>
            </section>

            {/* Internationalization */}
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                       <Globe className="h-3 w-3" /> Language
                     </label>
                     <select 
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs outline-none"
                      value={invoice.language}
                      onChange={(e) => setInvoice({...invoice, language: e.target.value as any})}
                     >
                       {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                       <Euro className="h-3 w-3" /> Currency
                     </label>
                     <select 
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs outline-none"
                      value={invoice.currency}
                      onChange={(e) => setInvoice({...invoice, currency: e.target.value})}
                     >
                       <option value="EUR">EUR (€)</option>
                       <option value="USD">USD ($)</option>
                       <option value="GBP">GBP (£)</option>
                       <option value="TRY">TRY (₺)</option>
                     </select>
                  </div>
               </div>
            </section>
          </div>
        </div>
      ) : activeTab === "payments" ? (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Euro className="h-10 w-10 text-emerald-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900">Zahlungserfassung</h3>
           <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">Erfassen Sie hier Teil- oder Vollzahlungen für diese Rechnung.</p>
           <form onSubmit={handleAddPayment} className="mt-8 max-w-xs mx-auto flex gap-4">
              <input name="amount" type="number" step="0.01" required className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none" placeholder="Betrag in €" />
              <button type="submit" className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">OK</button>
           </form>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-blue-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900">Rechnungshistorie</h3>
           <p className="text-sm text-gray-400 mt-2">Alle Änderungen und Ereignisse werden hier protokolliert.</p>
           <div className="mt-8 space-y-4 max-w-md mx-auto text-left">
              {(invoice.history || []).map((h, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                   <div className="text-[10px] font-bold text-gray-300 w-20">{h.date.split('T')[0]}</div>
                   <div className="text-sm font-medium text-gray-700">{h.action} von {h.user}</div>
                </div>
              ))}
              {(!invoice.history || invoice.history.length === 0) && <p className="text-center text-[10px] text-gray-300 italic">Noch keine Einträge vorhanden.</p>}
           </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Kunden hinzufügen</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-black"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
              const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
              const newC: Customer = {
                id: "c" + Date.now(),
                name,
                email,
                status: "Active",
                color: "#000000"
              };
              addCustomer(newC);
              setInvoice({ ...invoice, customerId: newC.id, customerName: newC.name, email: newC.email });
              setIsCustomerModalOpen(false);
              toast.success("Customer added and selected");
            }} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Firmenname *</label>
                <input name="name" required className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none" placeholder="e.g. Future Tech Ltd." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-Mail-Adresse *</label>
                <input name="email" type="email" required className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none" placeholder="billing@company.com" />
              </div>
              <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold hover:bg-gray-800 shadow-xl transition-all">Erstellen & Auswählen</button>
            </form>
          </div>
        </div>
      )}

      {/* Full Screen Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col">
          <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-gray-900">Live PDF-Vorschau</h2>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase">Draft</span>
             </div>
             <div className="flex items-center gap-4">
                <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-all">
                  <Printer className="h-4 w-4" /> Drucken
                </button>
                <button onClick={() => setIsPreviewOpen(false)} className="h-10 w-10 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-500">
                  <X className="h-6 w-6" />
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-100 p-12">
             <div id="invoice-pdf" className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-16 print:shadow-none print:p-0">
                {/* PDF Content Placeholder */}
                <div className="flex justify-between items-start mb-20">
                   <div>
                      <div className="h-16 w-16 bg-black rounded-2xl mb-8 flex items-center justify-center text-white font-bold text-xl">TM</div>
                      <p className="text-xs font-bold text-gray-900">{invoiceSettings.companyName}</p>
                      <p className="text-[10px] text-gray-500 mt-1 whitespace-pre-line">{invoiceSettings.companyAddress}</p>
                   </div>
                   <div className="text-right">
                      <h1 className="text-4xl font-bold tracking-tight mb-2">RECHNUNG</h1>
                      <p className="text-xs font-bold text-gray-400"># {invoice.id}</p>
                   </div>
                </div>

                <div className="flex justify-between mb-20">
                   <div className="max-w-[300px]">
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Rechnungsempfänger</p>
                      <p className="text-sm font-bold text-gray-900">{invoice.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{invoice.email}</p>
                   </div>
                   <div className="flex gap-12">
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Date</p>
                         <p className="text-xs font-bold text-gray-900">{invoice.date}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Due Date</p>
                         <p className="text-xs font-bold text-gray-900">{invoice.dueDate}</p>
                      </div>
                   </div>
                </div>

                <table className="w-full text-left mb-12">
                   <thead>
                      <tr className="border-b border-gray-100">
                         <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Position</th>
                         <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Menge</th>
                         <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Einzelpreis</th>
                         <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Gesamt</th>
                      </tr>
                   </thead>
                   <tbody>
                      {invoice.positions?.map((pos) => (
                         <tr key={pos.id} className="border-b border-gray-50">
                            <td className="py-6">
                               <p className="text-sm font-bold text-gray-900">{pos.name}</p>
                               <p className="text-[10px] text-gray-400 mt-1">{pos.description}</p>
                            </td>
                            <td className="py-6 text-center text-xs font-medium text-gray-600">{pos.quantity}</td>
                            <td className="py-6 text-right text-xs font-medium text-gray-600">{formatCurrency(pos.priceNet)}</td>
                            <td className="py-6 text-right text-sm font-bold text-gray-900">{formatCurrency(pos.quantity * pos.priceNet)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                <div className="flex justify-end">
                   <div className="w-64 space-y-3">
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                         <span>Zwischensumme (Netto)</span>
                         <span>{formatCurrency(invoice.amountNet || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                         <span>VAT ({invoiceSettings.defaultVatRate}%)</span>
                         <span>{formatCurrency(invoice.amountVat || 0)}</span>
                      </div>
                      <div className="h-px bg-gray-100 my-4" />
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                         <span>Total</span>
                         <span>{formatCurrency(invoice.amountGross || 0)}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-40 border-t border-gray-100 pt-12 text-[10px] text-gray-400 grid grid-cols-3 gap-12">
                   <div>
                      <p className="font-bold text-gray-900 uppercase tracking-widest mb-2">Zahlungsdetails</p>
                      <p>Bank: {invoiceSettings.bankName}</p>
                      <p>IBAN: {invoiceSettings.bankIban}</p>
                      <p>BIC: {invoiceSettings.bankBic}</p>
                   </div>
                   <div>
                      <p className="font-bold text-gray-900 uppercase tracking-widest mb-2">Unternehmensinfo</p>
                      <p>Tax ID: {invoiceSettings.companyTaxId}</p>
                      <p>VAT ID: {invoiceSettings.companyVatId}</p>
                   </div>
                   <div>
                      <p className="font-bold text-gray-900 uppercase tracking-widest mb-2">Bedingungen</p>
                      <p>{invoice.paymentTerms}</p>
                   </div>
                </div>
                <div className="mt-20 text-center text-[9px] text-gray-300">
                   {invoiceSettings.defaultFooter}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
