"use client";

import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  RefreshCcw,
  LogOut,
  AlertCircle,
  Check,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday } from "date-fns";
import { de } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

type ViewType = "month" | "week" | "list";

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { 
    teamMembers, 
    todos,
    addTodo
  } = useDataStore();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarSelectorOpen, setIsCalendarSelectorOpen] = useState(false);
  
  const router = useRouter();  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    location: "",
    calendarId: "primary",
    start: format(new Date(), "yyyy-MM-dd'T'10:00"),
    end: format(new Date(), "yyyy-MM-dd'T'11:00"),
  });

  // Update calendarId when selectedCalendarIds changes
  useEffect(() => {
    if (selectedCalendarIds.length > 0 && !selectedCalendarIds.includes(newEvent.calendarId)) {
      setNewEvent(prev => ({ ...prev, calendarId: selectedCalendarIds[0] }));
    }
  }, [selectedCalendarIds]);

  // Load saved calendar selection
  useEffect(() => {
    const saved = localStorage.getItem(`calendar_ids_${user?.username}`);
    if (saved) {
      try {
        setSelectedCalendarIds(JSON.parse(saved));
      } catch (e) {
        setSelectedCalendarIds(["primary"]);
      }
    } else {
      setSelectedCalendarIds(["primary"]);
    }
  }, [user?.username]);

  const syncEventsToTodos = (fetchedEvents: CalendarEvent[]) => {
    const mappings: Record<string, string> = {
      "MAK": "akif", // Mehmet Akif Koca (username)
      "ND": "nisa",  // Nisa
      "AT": "arda"   // Arda Turan
    };

    fetchedEvents.forEach(event => {
      const summary = event.summary || "";
      const match = summary.match(/^([A-Z]{2,3})-/); // Finds initials like MAK-, ND-, AT-
      
      if (match) {
        const initial = match[1];
        const username = mappings[initial];
        
        if (username) {
          const taskTitle = summary.replace(`${initial}-`, "").trim();
          const member = teamMembers.find(m => m.username === username || m.id === username);
          
          if (member) {
            // Check if this task already exists to avoid duplicates
            // We use the event ID as a marker in the task string
            const exists = todos.some(t => t.task.includes(event.id) || (t.task === taskTitle && t.customerId === member.id));
            
            if (!exists) {
              addTodo({
                id: "todo-" + event.id,
                customerId: member.id,
                task: `${taskTitle} (Kalender: ${event.id})`,
                completed: false,
                dueDate: event.start.dateTime || event.start.date || format(new Date(), "yyyy-MM-dd")
              });
              toast.info(`Aufgabe aus Kalender übertragen für ${member.fullName}: ${taskTitle}`);
            }
          }
        }
      }
    });
  };

  const fetchCalendarList = async () => {
    try {
      const res = await fetch(`/api/calendar/list?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setCalendars(data.items || []);
        if (selectedCalendarIds.length === 0 && data.items?.length > 0) {
          const primary = data.items.find((c: any) => c.primary);
          const initialIds = [primary?.id || "primary"];
          setSelectedCalendarIds(initialIds);
          localStorage.setItem(`calendar_ids_${user?.username}`, JSON.stringify(initialIds));
        }
      }
    } catch (error) {
      console.error("Calendar list fetch error", error);
    }
  };

  const fetchEvents = async (signal?: AbortSignal) => {
    if (selectedCalendarIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Don't clear events immediately to avoid flickering, but we'll overwrite it
    try {
      const allEvents: CalendarEvent[] = [];
      const promises = selectedCalendarIds.map(async (id) => {
        const res = await fetch(`/api/calendar/events?calendarId=${encodeURIComponent(id)}&limit=50&userId=${user?.id}`, { signal });
        if (res.ok) {
          const data = await res.json();
          const cal = calendars.find(c => c.id === id);
          return (data.items || []).map((e: any) => ({
            ...e,
            calendarId: id, // Track which calendar this belongs to
            calendarName: cal?.summary,
            calendarColor: cal?.backgroundColor || "#000"
          }));
        }
        return [];
      });

      const results = await Promise.all(promises);
      if (signal?.aborted) return;

      results.forEach(items => allEvents.push(...items));
      
      const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values())
        .filter(e => e.start && selectedCalendarIds.includes(e.calendarId || "")); // Extra safety filter

      setEvents(uniqueEvents);
      syncEventsToTodos(uniqueEvents); // Auto-sync tasks from titles
      setIsAuthenticated(true);
      if (calendars.length === 0) fetchCalendarList();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    if (isAuthenticated || isLoading) {
      fetchEvents(controller.signal);
    }

    return () => controller.abort();
  }, [selectedCalendarIds, isAuthenticated]);

  // Initial authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch(`/api/calendar/list?userId=${user?.id}`);
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const toggleCalendar = (id: string) => {
    let newSelection;
    if (selectedCalendarIds.includes(id)) {
      newSelection = selectedCalendarIds.filter(cid => cid !== id);
    } else {
      newSelection = [...selectedCalendarIds, id];
    }
    setSelectedCalendarIds(newSelection);
    localStorage.setItem(`calendar_ids_${user?.username}`, JSON.stringify(newSelection));
  };

  const handleConnect = () => {
    window.location.href = `/api/auth/google/login?userId=${user?.id}`;
  };

  const handleCalendarLogout = async () => {
    try {
      const res = await fetch(`/api/auth/google/logout?userId=${user?.id}`, { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        setEvents([]);
        setCalendars([]);
        toast.success("Google Kalender Verbindung getrennt.");
      }
    } catch (error) {
      toast.error("Verbindung konnte nicht getrennt werden.");
    }
  };

  const handleAddEvent = async () => {
    try {
      const res = await fetch(`/api/calendar/events?calendarId=${encodeURIComponent(newEvent.calendarId)}&userId=${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newEvent.summary,
          description: newEvent.description,
          location: newEvent.location,
          start: { dateTime: new Date(newEvent.start).toISOString() },
          end: { dateTime: new Date(newEvent.end).toISOString() },
        }),
      });

      if (res.ok) {
        toast.success("Ereignis erfolgreich erstellt!");
        setIsAddModalOpen(false);
        fetchEvents();
      } else {
        toast.error("Hinzufügen fehlgeschlagen");
      }
    } catch (error) {
      toast.error("Ein Fehler ist aufgetreten");
    }
  };

  const handleDeleteEvent = async (id: string, calendarId: string = "primary") => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Ereignis löschen möchten?")) return;
    
    try {
      const res = await fetch(`/api/calendar/events/${id}?eventId=${id}&calendarId=${encodeURIComponent(calendarId)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success("Ereignis gelöscht");
        fetchEvents();
      } else {
        toast.error("Löschen fehlgeschlagen");
      }
    } catch (error) {
      toast.error("Ein Fehler ist aufgetreten");
    }
  };

  // Calendar Grid Logic
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-[48px] p-12 text-center space-y-8 shadow-2xl border border-gray-100">
          <div className="h-24 w-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CalendarIcon className="h-12 w-12 text-brand-primary" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900">Google Kalender Verbindung</h2>
            <p className="text-gray-400 font-bold leading-relaxed text-sm">
              Verbinden Sie Ihr Google-Konto, um Ihre Kalender zu verwalten.
            </p>
          </div>
          <button 
            onClick={handleConnect}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-4"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            Mit Google verbinden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Kalender</h1>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => setView("month")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "month" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Ay
              </button>
              <button 
                onClick={() => setView("week")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "week" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Hafta
              </button>
              <button 
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "list" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Liste
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Trada Media Scheduling System</p>
            <div className="h-1 w-1 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsCalendarSelectorOpen(!isCalendarSelectorOpen)}
              className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 shadow-sm hover:border-black transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              Kalender ({selectedCalendarIds.length})
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isCalendarSelectorOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-gray-100 z-[110] py-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="px-6 py-2 border-b border-gray-50 mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anzuzeigende Kalender</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto px-2">
                  {calendars.map(calendar => (
                    <button 
                      key={calendar.id}
                      onClick={() => toggleCalendar(calendar.id)}
                      className="w-full px-4 py-3 rounded-2xl hover:bg-gray-50 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.backgroundColor }} />
                        <span className={`text-sm font-bold ${selectedCalendarIds.includes(calendar.id) ? 'text-black' : 'text-gray-400'}`}>
                          {calendar.summary}
                        </span>
                      </div>
                      <div className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedCalendarIds.includes(calendar.id) ? 'bg-black border-black' : 'border-gray-100'}`}>
                        {selectedCalendarIds.includes(calendar.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-50 mt-2">
                  <button onClick={() => setIsCalendarSelectorOpen(false)} className="w-full py-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">Schließen</button>
                </div>
              </div>
            )}
          </div>

          <div className="h-10 w-[1px] bg-gray-100 hidden md:block" />

          <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
              className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-6 text-sm font-black uppercase tracking-widest min-w-[180px] text-center">
              {format(currentDate, view === "month" ? "MMMM yyyy" : "d. MMMM", { locale: de })}
            </span>
            <button 
              onClick={() => setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
              className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
          >
            <Plus className="h-5 w-5" /> Ereignis hinzufügen
          </button>

          <button 
            onClick={handleCalendarLogout}
            className="p-4 bg-white border border-gray-100 text-red-500 rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all shadow-sm group"
            title="Google Kalender Verbindung trennen"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Calendar View Area */}
      <div className="bg-white rounded-[56px] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.03)] overflow-hidden min-h-[700px] flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
             <div className="h-12 w-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daten werden synchronisiert...</p>
          </div>
        )}

        {view === "month" && (
          <div className="flex-1 flex flex-col">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-gray-50">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(day => (
                <div key={day} className="py-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                  {day}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5">
              {days.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date || ""), day));
                return (
                  <div 
                    key={day.toString()} 
                    className={`min-h-[140px] p-4 border-r border-b border-gray-50 last:border-r-0 transition-colors hover:bg-gray-50/50 ${!isSameMonth(day, currentDate) ? 'bg-gray-50/20' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`h-8 w-8 flex items-center justify-center text-sm font-black rounded-xl transition-all ${isToday(day) ? 'bg-black text-white shadow-lg' : isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-200'}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id} 
                          onClick={() => window.open(event.htmlLink, '_blank')}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-white truncate cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
                          style={{ backgroundColor: event.calendarColor || '#000' }}
                          title={event.summary}
                        >
                          {event.summary}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2 pl-1">
                          + {dayEvents.length - 3} Weitere
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 flex-1">
               {weekDays.map(day => {
                  const dayEvents = events.filter(e => isSameDay(new Date(e.start.dateTime || e.start.date || ""), day));
                  return (
                    <div key={day.toString()} className="border-r border-gray-50 last:border-r-0 flex flex-col">
                       <div className={`p-8 text-center border-b border-gray-50 space-y-2 ${isToday(day) ? 'bg-black/5' : ''}`}>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{format(day, "EEEE", { locale: de })}</p>
                          <p className={`text-3xl font-black ${isToday(day) ? 'text-black' : 'text-gray-900'}`}>{format(day, "d")}</p>
                       </div>
                       <div className="flex-1 p-4 space-y-3 bg-gray-50/10">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2 hover:border-black transition-all group"
                            >
                               <div className="h-1.5 w-10 rounded-full mb-1" style={{ backgroundColor: event.calendarColor }} />
                               <p className="text-[10px] font-black text-gray-900 line-clamp-2">{event.summary}</p>
                               <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                 <Clock className="h-3 w-3" />
                                 {format(new Date(event.start.dateTime || event.start.date || ""), "HH:mm")}
                               </p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )
               })}
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="p-12 space-y-8 max-w-4xl mx-auto w-full">
             {events.length > 0 ? (
               events.sort((a,b) => new Date(a.start.dateTime || a.start.date || "").getTime() - new Date(b.start.dateTime || b.start.date || "").getTime())
               .map(event => {
                  const start = new Date(event.start.dateTime || event.start.date || "");
                  return (
                    <div key={event.id} className="group bg-white rounded-[40px] border border-gray-100 p-8 flex items-start justify-between hover:border-black transition-all hover:shadow-2xl">
                      <div className="flex gap-8">
                        <div className="flex flex-col items-center justify-center min-w-[100px] h-28 bg-gray-50 rounded-[32px] border border-gray-100 group-hover:bg-black group-hover:text-white transition-all">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {format(start, "MMM", { locale: de })}
                          </span>
                          <span className="text-4xl font-black leading-none mt-1">
                            {format(start, "d")}
                          </span>
                        </div>
                        <div className="space-y-3 py-2">
                          <div className="flex items-center gap-3">
                             <div className="h-2 w-2 rounded-full" style={{ backgroundColor: event.calendarColor }} />
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{event.calendarName}</span>
                          </div>
                          <h3 className="text-2xl font-black text-gray-900">{event.summary || "Unbenanntes Ereignis"}</h3>
                          <div className="flex flex-wrap gap-6 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" /> 
                              {format(start, "HH:mm")}
                            </span>
                            {event.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <a href={event.htmlLink} target="_blank" className="h-12 w-12 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                        <button onClick={() => handleDeleteEvent(event.id)} className="h-12 w-12 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )
               })
             ) : (
               <div className="py-20 text-center space-y-6">
                  <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <CalendarIcon className="h-10 w-10 text-gray-200" />
                  </div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Keine Ereignisse in diesem Zeitraum gefunden</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Neues Ereignis</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titel des Ereignisses</p>
                <input 
                  className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold outline-none border-2 border-transparent focus:border-black transition-all"
                  placeholder="Z.B.: Kundenpräsentation"
                  value={newEvent.summary}
                  onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Beginn</p>
                  <input 
                    type="datetime-local"
                    className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold outline-none"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ende</p>
                  <input 
                    type="datetime-local"
                    className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold outline-none"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zielkalender</p>
                <div className="grid grid-cols-1 gap-2">
                  {calendars.filter(c => selectedCalendarIds.includes(c.id)).map(calendar => (
                    <button 
                      key={calendar.id}
                      onClick={() => setNewEvent({...newEvent, calendarId: calendar.id})}
                      className={`w-full px-6 py-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${newEvent.calendarId === calendar.id ? 'border-black bg-gray-50' : 'border-gray-50 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.backgroundColor }} />
                        <span className="text-xs font-bold text-gray-900">{calendar.summary}</span>
                      </div>
                      {newEvent.calendarId === calendar.id && <Check className="h-4 w-4 text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddEvent}
              className="w-full py-6 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
            >
              Ereignis erstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
