"use client";

import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore, TeamMember } from "@/store/data-store";
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  X,
  Save,
  Lock,
  Edit2,
  Trash2,
  UserCircle,
  Clock,
  ShieldCheck,
  Camera,
  Mail,
  User,
  Settings2,
  Palette
} from "lucide-react";
import { toast } from "sonner";

export default function TeamPage() {
  const { user } = useAuthStore();
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, attendanceLogs } = useDataStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Authentication Checks
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin" || user?.username === "trada";
  const isCEO = isSuperAdmin || ["ceo", "co founder", "admin"].includes(user?.role?.toLowerCase() || "");

  const [formData, setFormData] = useState<Partial<TeamMember>>({
    fullName: "",
    username: "",
    password: "",
    role: "Mitarbeiter",
    weeklyTargetHours: 40,
    permissions: ["att"],
    avatarUrl: "",
    colorTag: "#3B82F6",
    hourlyCost: 0,
    costMultiplier: 1.0
  });

  // Filter out the Super Admin from the list to keep it clean, but show everyone else
  const displayMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const isSearchMatch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.username.toLowerCase().includes(searchTerm.toLowerCase());
      const isNotSuper = m.role?.toLowerCase() !== "superadmin" && m.username !== "trada";
      return isSearchMatch && isNotSuper;
    });
  }, [teamMembers, searchTerm]);

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({ ...member });
    } else {
      setEditingMember(null);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        role: "Mitarbeiter",
        weeklyTargetHours: 40,
        permissions: ["att"],
        avatarUrl: "",
        colorTag: "#" + Math.floor(Math.random()*16777215).toString(16),
        hourlyCost: 0,
        costMultiplier: 1.0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.fullName || !formData.username) {
      toast.error("Name und Benutzername sind erforderlich.");
      return;
    }

    if (editingMember) {
      updateTeamMember(editingMember.id, formData);
      toast.success("Mitarbeiter aktualisiert");
    } else {
      const newMember: TeamMember = {
        ...formData as TeamMember,
        id: "e" + Date.now(),
        permissions: formData.permissions || ["att"]
      };
      addTeamMember(newMember);
      toast.success("Mitarbeiter hinzugefügt");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diesen Mitarbeiter wirklich löschen?")) {
      deleteTeamMember(id);
      toast.success("Mitarbeiter gelöscht");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(p => ({ ...p, avatarUrl: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (perm: string) => {
    const current = formData.permissions || [];
    const next = current.includes(perm) 
      ? current.filter(p => p !== perm) 
      : [...current, perm];
    setFormData({ ...formData, permissions: next });
  };

  // If not CEO/Admin and not editing own profile, show restricted view
  if (!isCEO) {
    const ownProfile = teamMembers.find(m => m.username === user?.username);
    if (!ownProfile) return <div className="p-20 text-center font-bold text-gray-400">Profil nicht gefunden.</div>;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-black text-gray-900 mb-10">Mein Profil</h1>
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="h-40 w-40 rounded-[32px] overflow-hidden bg-gray-50 border-4 border-white shadow-lg">
            {ownProfile.avatarUrl ? <img src={ownProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-200" />}
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-900">{ownProfile.fullName}</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">@{ownProfile.username} • {ownProfile.role}</p>
            <button onClick={() => handleOpenModal(ownProfile)} className="px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all">Profil bearbeiten</button>
          </div>
        </div>
        {isModalOpen && <EditModal member={editingMember} formData={formData} setFormData={setFormData} onSave={handleSave} onClose={() => setIsModalOpen(false)} isSuper={false} />}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mitarbeiter Management</h1>
          <p className="text-gray-400 font-medium mt-1">Verwalten Sie Ihr Team, Rollen und Berechtigungen.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 bg-brand-secondary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-brand-secondary/20"
        >
          <Plus className="h-5 w-5" /> Mitarbeiter Hinzufügen
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
        <input 
          type="text"
          placeholder="Mitarbeiter suchen (Name, Username...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 shadow-sm transition-all"
        />
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayMembers.map((member) => (
          <div key={member.id} className="relative aspect-[3/4] rounded-[48px] overflow-hidden group shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border border-gray-100">
            {/* Background Image */}
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <UserCircle className="h-20 w-20 text-gray-200" />
              )}
            </div>

            {/* Gradient Overlay using User's color */}
            <div 
              className="absolute inset-0 transition-opacity duration-500"
              style={{ 
                background: `linear-gradient(to top, ${member.colorTag || '#000000'}CC 0%, ${member.colorTag || '#000000'}66 30%, transparent 60%)` 
              }}
            />

            {/* Top Badge (Role) */}
            <div className="absolute top-6 left-6">
               <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/20 shadow-xl">
                 {member.role}
               </span>
            </div>

            {/* Edit/Delete Actions (Hidden by default, show on hover) */}
            <div className="absolute top-6 right-6 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
               <button 
                onClick={() => handleOpenModal(member)}
                className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-gray-900 hover:bg-white hover:scale-110 transition-all shadow-xl"
               >
                 <Edit2 className="h-4 w-4" />
               </button>
               <button 
                onClick={() => handleDelete(member.id)}
                className="h-10 w-10 bg-red-500/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-all shadow-xl"
               >
                 <Trash2 className="h-4 w-4" />
               </button>
            </div>

            {/* Bottom Content */}
            <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{member.fullName}</h3>
                  {(() => {
                    const userLogs = attendanceLogs.filter(log => log.workerId === member.id || log.workerName.toLowerCase() === member.username.toLowerCase());
                    const isWorking = userLogs[0]?.action === "Clock In";
                    if (!isWorking) return null;
                    return (
                      <div className="flex items-center gap-2 bg-emerald-500 px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live</span>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[11px] font-bold text-white/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.colorTag }} />
                  @{member.username}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                 <div className="flex items-center gap-2 text-white/90">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{member.permissions?.length || 0} Module</span>
                 </div>
                 <div className="flex items-center gap-2 text-white/90">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{member.weeklyTargetHours || 40}h</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <EditModal 
          member={editingMember} 
          formData={formData} 
          setFormData={setFormData} 
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)}
          isSuper={isSuperAdmin}
          handleAvatarUpload={handleAvatarUpload}
          togglePermission={togglePermission}
        />
      )}
    </div>
  );
}

function EditModal({ member, formData, setFormData, onSave, onClose, isSuper, handleAvatarUpload, togglePermission }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl p-10 space-y-10 my-10 relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-all">
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-[40px] overflow-hidden border-8 border-gray-50 shadow-inner bg-gray-50">
              {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-200" />}
            </div>
            <label className="absolute bottom-0 right-0 h-10 w-10 bg-brand-secondary text-white rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg border-4 border-white">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
            {formData.avatarUrl && (
              <button onClick={() => setFormData({...formData, avatarUrl: ''})} className="absolute -top-2 -right-2 h-8 w-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">{member ? "Mitarbeiter Bearbeiten" : "Neuer Mitarbeiter"}</h2>
            <p className="text-sm text-gray-400 font-medium">Füllen Sie die untenstehenden Informationen aus.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vollständiger Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                value={formData.fullName || ""}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Benutzername</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                value={formData.username || ""}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rolle</label>
            <select 
              className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 appearance-none"
              value={formData.role || "Mitarbeiter"}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="CEO">CEO</option>
              <option value="Co Founder">Co Founder</option>
              <option value="Manager">Manager</option>
              <option value="Buchhaltung">Buchhaltung</option>
              <option value="Mitarbeiter">Mitarbeiter</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Wochenstunden (Soll)</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                type="number"
                className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                value={formData.weeklyTargetHours || 40}
                onChange={(e) => setFormData({...formData, weeklyTargetHours: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mitarbeiter Farbe</label>
             <div className="relative flex items-center gap-4">
                <Palette className="absolute left-4 h-4 w-4 text-gray-300" />
                <input 
                  type="color"
                  className="w-24 h-12 rounded-xl border-none cursor-pointer bg-transparent ml-10"
                  value={formData.colorTag || "#3B82F6"}
                  onChange={(e) => setFormData({...formData, colorTag: e.target.value})}
                />
                <span className="text-xs font-mono font-bold text-gray-900">{formData.colorTag}</span>
             </div>
          </div>

          {isSuper && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Neues Passwort (Reset)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input 
                    type="text"
                    placeholder="Passwort eingeben..."
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                    value={formData.password || ""}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stundenlohn (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">€</span>
                  <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                    value={formData.hourlyCost || 0}
                    onChange={(e) => setFormData({...formData, hourlyCost: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kosten-Multiplikator</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">x</span>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="1.3"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-black/5"
                    value={formData.costMultiplier || 1}
                    onChange={(e) => setFormData({...formData, costMultiplier: Number(e.target.value)})}
                  />
                </div>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider ml-1">Effektive Kosten: €{((formData.hourlyCost || 0) * (formData.costMultiplier || 1)).toFixed(2)} /h</p>
              </div>
            </>
          )}
        </div>

        {isSuper && (
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Berechtigungen (Module)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'acc', label: 'Accounting' },
                { id: 'crm', label: 'CRM / Kunden' },
                { id: 'team', label: 'Team Admin' },
                { id: 'proj', label: 'Projekte' },
                { id: 'att', label: 'Attendance' }
              ].map(perm => (
                <button
                  key={perm.id}
                  type="button"
                  onClick={() => togglePermission(perm.id)}
                  className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    formData.permissions?.includes(perm.id)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {perm.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={onSave}
          className="w-full py-5 bg-brand-secondary text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-brand-secondary/30"
        >
          {member ? "Änderungen Speichern" : "Mitarbeiter Erstellen"}
        </button>
      </div>
    </div>
  );
}
