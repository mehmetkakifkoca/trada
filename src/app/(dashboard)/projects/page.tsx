"use client";

import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore, Project, ProjectStatus, ProjectCategory } from "@/store/data-store";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ChevronRight,
  Clock,
  Euro,
  Users,
  Target,
  Briefcase,
  X,
  Save,
  Building2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const { 
    projects, addProject, customers, teamMembers,
    projectTasks, timeAllocations, freelancerWorkLogs
  } = useDataStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isCEO = isSuperAdmin || ["ceo", "co founder", "admin", "manager"].includes(user?.role?.toLowerCase() || "");

  const [formData, setFormData] = useState<Partial<Project>>({
    name: "",
    customerId: "",
    category: "Design",
    categories: ["Design"],
    status: "Active",
    revenue: 0,
    startDate: new Date().toISOString().split('T')[0],
    deadline: "",
    description: "",
    internalCode: ""
  });

  const displayProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.internalCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      
      // If employee has explicit 'proj' permission or is CEO, they see all projects.
      // Otherwise, fallback to seeing only projects where they have assigned tasks.
      const hasProjPermission = user?.customPermissions?.includes("proj");
      const isAssigned = isCEO || hasProjPermission || projectTasks.some(t => t.projectId === p.id && t.assignedMemberIds.includes(user?.id || ""));
      
      return matchesSearch && matchesStatus && isAssigned;
    });
  }, [projects, searchTerm, statusFilter, isCEO, projectTasks, user]);

  const handleSaveProject = () => {
    if (!formData.name || !formData.customerId) {
      toast.error("Projektname und Kunde sind erforderlich.");
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    
    const newProject: Project = {
      ...formData as Project,
      id: "PRJ-" + Math.floor(1000 + Math.random() * 9000),
      customerName: customer?.name || "Unbekannter Kunde",
      createdAt: Date.now()
    };

    addProject(newProject);
    toast.success("Projekt erfolgreich erstellt.");
    setIsModalOpen(false);
    setFormData({
      name: "",
      customerId: "",
      category: "Design",
      categories: ["Design"],
      status: "Active",
      revenue: 0,
      startDate: new Date().toISOString().split('T')[0],
      deadline: "",
      description: "",
      internalCode: ""
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Projekte</h1>
          <p className="text-gray-400 font-medium mt-1">Verwalten Sie Ihre Kundenprojekte und Rentabilität.</p>
        </div>
        {isCEO && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
          >
            <Plus className="h-5 w-5" /> Neues Projekt
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
          <input 
            type="text"
            placeholder="Projekte suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 shadow-sm transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-8 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 shadow-sm transition-all appearance-none cursor-pointer"
        >
          <option value="All">Alle Status</option>
          <option value="Draft">Entwurf</option>
          <option value="Active">Aktiv</option>
          <option value="Waiting for client">Warten auf Kunden</option>
          <option value="Finished">Abgeschlossen</option>
          <option value="Cancelled">Abgebrochen</option>
        </select>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayProjects.map((project) => {
          const stats = calculateProjectQuickStats(project, projectTasks, timeAllocations, teamMembers, freelancerWorkLogs);
          return (
            <Link 
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em]">{project.categories?.join(", ") || project.category}</p>
                   <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-brand-secondary transition-colors">{project.name}</h3>
                   <p className="text-xs font-bold text-gray-400">{project.customerName}</p>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Umsatz</p>
                  <p className="text-sm font-black text-gray-900">€{project.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Profit</p>
                  <p className={`text-sm font-black ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    €{stats.profit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zeit / Stunden</p>
                    <span className="text-xs font-black text-gray-900">{stats.totalHours.toFixed(1)}h</span>
                 </div>
                 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-black transition-all duration-1000`}
                      style={{ width: `${Math.min(100, (stats.totalHours / 100) * 100)}%` }}
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex -space-x-2">
                   {stats.involvedMembers.slice(0, 3).map(m => (
                     <div key={m.id} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                       {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">{m.username.charAt(0).toUpperCase()}</div>}
                     </div>
                   ))}
                   {stats.involvedMembers.length > 3 && (
                     <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                       +{stats.involvedMembers.length - 3}
                     </div>
                   )}
                </div>
                <div className="flex items-center gap-2 text-gray-300 group-hover:text-black transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Project Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl p-10 space-y-10 my-10 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-all">
              <X className="h-6 w-6" />
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-gray-900">Neues Projekt</h2>
              <p className="text-sm text-gray-400 font-medium">Erstellen Sie ein neues Kundenprojekt und definieren Sie das Budget.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Projektname</label>
                <input 
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Z.B. Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kunde</label>
                <select 
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 appearance-none"
                  value={formData.customerId}
                  onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                >
                  <option value="">Kunde wählen...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategorien (Mehrfachauswahl)</label>
                <div className="flex flex-wrap gap-2">
                  {["Design", "Print", "Signage / Tabela", "Website", "Social Media", "Video", "Photography", "Other"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = formData.categories || [];
                        const next = current.includes(cat as any) ? current.filter(c => c !== cat) : [...current, cat as any];
                        setFormData({...formData, categories: next, category: (next[0] || "Design") as any});
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.categories?.includes(cat as any) ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Budget / Umsatz (€)</label>
                <input 
                  type="number"
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                  value={formData.revenue}
                  onChange={(e) => setFormData({...formData, revenue: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Startdatum</label>
                <input 
                  type="date"
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deadline</label>
                <input 
                  type="date"
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Projektbeschreibung</label>
              <textarea 
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 min-h-[120px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Details zum Projekt..."
              />
            </div>

            <button 
              onClick={handleSaveProject}
              className="w-full py-5 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
            >
              Projekt Erstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Active: "bg-emerald-100 text-emerald-600",
    "Waiting for client": "bg-orange-100 text-orange-600",
    Finished: "bg-blue-100 text-blue-600",
    Cancelled: "bg-red-100 text-red-600"
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

function calculateProjectQuickStats(project: Project, tasks: any[], allocations: any[], teamMembers: any[], freelancerWorkLogs: any[]) {
  const projectAllocations = allocations.filter(a => a.projectId === project.id);
  const totalHours = projectAllocations.reduce((sum, a) => sum + a.hours, 0);
  
  let laborCost = 0;
  const involvedMemberIds = new Set<string>();

  projectAllocations.forEach(a => {
    const member = teamMembers.find(m => m.id === a.workerId);
    involvedMemberIds.add(a.workerId);
    const hourlyCost = (member?.hourlyCost || 20) * (member?.costMultiplier || 1);
    laborCost += a.hours * hourlyCost;
  });
  
  const projectFreelancerLogs = freelancerWorkLogs.filter(l => l.projectId === project.id);
  const freelancerCost = projectFreelancerLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);

  const involvedMembers = teamMembers.filter(m => involvedMemberIds.has(m.id));

  return {
    totalHours,
    profit: project.revenue - laborCost - freelancerCost,
    involvedMembers
  };
}
