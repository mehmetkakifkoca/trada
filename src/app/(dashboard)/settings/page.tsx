"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Palette, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  UploadCloud,
  Save,
  Globe,
  Trash2,
  User,
  LogOut,
  Camera
} from "lucide-react";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { Download, Upload } from "lucide-react";

export default function SettingsPage() {
  const { invoiceSettings, updateInvoiceSettings, teamMembers, updateTeamMember } = useDataStore();
  const { user, setUser } = useAuthStore();
  
  const [formData, setFormData] = useState(invoiceSettings);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    avatarUrl: user?.avatarUrl || ""
  });

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const isCEO = isSuperAdmin || ["ceo", "co founder", "admin", "administrator"].includes(user?.role?.toLowerCase() || "");

  useEffect(() => {
    setFormData(invoiceSettings);
  }, [invoiceSettings]);

  useEffect(() => {
    if (user) {
      const cleanId = user.id.replace("demo-", "");
      const member = teamMembers.find(m => m.id === cleanId || m.username === user.username);
      
      setProfileData({
        fullName: user.fullName || member?.fullName || "",
        username: user.username || member?.username || "",
        avatarUrl: user.avatarUrl || member?.avatarUrl || ""
      });
    }
  }, [user, teamMembers]);

  const handleSaveSystem = () => {
    updateInvoiceSettings(formData);
    toast.success("Systemeinstellungen gespeichert");
  };

  const handleSaveProfile = () => {
    if (!user) return;
    
    // Update local user state
    setUser({ 
      ...user, 
      fullName: profileData.fullName,
      username: profileData.username,
      avatarUrl: profileData.avatarUrl
    });

    // Sync with team members list in data store - STRIP demo- prefix
    const cleanId = user.id.replace("demo-", "");
    
    // Failsafe: find by ID first, then by username
    const member = teamMembers.find(m => m.id === cleanId || m.username === user.username);
    if (member) {
      updateTeamMember(member.id, {
        fullName: profileData.fullName,
        username: profileData.username,
        avatarUrl: profileData.avatarUrl
      });
    }

    toast.success("Profil erfolgreich aktualisiert");
  };

  const handleLogout = async () => {
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("auth-storage");
    await auth.signOut();
    window.location.href = "/login";
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'systemLogo' | 'favicon' | 'profile') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Datei zu groß! Maximal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'profile') {
          setProfileData({ ...profileData, avatarUrl: result });
        } else {
          setFormData({ ...formData, [type]: result });
        }
        toast.info("Vorschau geladen. Speichern nicht vergessen.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBackup = () => {
    try {
      const data = localStorage.getItem("trada-data-storage");
      if (!data) {
        toast.error("Keine Daten zum Exportieren gefunden.");
        return;
      }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradaspace-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup erfolgreich exportiert!");
    } catch (err) {
      toast.error("Fehler beim Exportieren des Backups.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Verify it's valid JSON
        JSON.parse(content);
        
        if (confirm("WARNUNG: Dies überschreibt die gesamte aktuelle Datenbank! Möchten Sie wirklich fortfahren?")) {
          localStorage.setItem("trada-data-storage", content);
          toast.success("Backup erfolgreich wiederhergestellt! Lade neu...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err) {
        toast.error("Ungültige Backup-Datei.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [isGdriveBackingUp, setIsGdriveBackingUp] = useState(false);

  const handleGDriveBackup = async () => {
    setIsGdriveBackingUp(true);
    try {
      const data = localStorage.getItem("trada-data-storage");
      if (!data) {
        toast.error("Keine Daten zum Sichern gefunden.");
        return;
      }
      const response = await fetch(`/api/backup?userId=${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: JSON.parse(data) }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Backup erfolgreich auf Google Drive gespeichert! (${result.fileName})`);
        localStorage.setItem("last-gdrive-backup", new Date().toISOString().split("T")[0]);
      } else {
        toast.error(`Fehler: ${result.error || "Backup fehlgeschlagen"}`);
      }
    } catch (err) {
      toast.error("Verbindung zum Backup-Server fehlgeschlagen.");
    } finally {
      setIsGdriveBackingUp(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Profile Section - Always Visible */}
      <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="relative group">
              <div className="h-40 w-40 rounded-full border-8 border-gray-50 overflow-hidden bg-gray-50 shadow-inner">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                    <User className="h-16 w-16" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 h-10 w-10 bg-brand-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg">
                <Camera className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'profile')} />
              </label>
            </div>

            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Persönliches Profil</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Verwalten Sie Ihre persönlichen Informationen.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vollständiger Name</label>
                  <input 
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Benutzername</label>
                  <input 
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                >
                  <Save className="h-4 w-4" /> Profil Speichern
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-8 py-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CEO System Settings - Only for CEO */}
      {isCEO && (
        <>
          <div className="flex items-center gap-4 px-4">
            <div className="h-px flex-1 bg-gray-100" />
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Agentur Einstellungen</h3>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Branding Column */}
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                   <Palette className="h-5 w-5 text-gray-400" />
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Branding</h3>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">System Logo</label>
                  <div className="relative group">
                    <div className="h-48 w-full rounded-[32px] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-6 hover:border-black hover:bg-white transition-all cursor-pointer overflow-hidden">
                      {formData.systemLogo ? (
                        <img src={formData.systemLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-gray-200 mb-2" />
                          <p className="text-[10px] font-bold text-gray-400">LOGO UPLOAD</p>
                        </>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleLogoUpload(e, 'systemLogo')} />
                    </div>
                    {formData.systemLogo && (
                      <button onClick={() => setFormData({...formData, systemLogo: ''})} className="absolute top-2 right-2 h-8 w-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-50">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.primaryColor} onChange={(e) => setFormData({...formData, primaryColor: e.target.value})} className="h-10 w-20 rounded-xl border-none cursor-pointer bg-transparent" />
                      <span className="text-xs font-mono font-bold text-gray-900">{formData.primaryColor}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.secondaryColor} onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})} className="h-10 w-20 rounded-xl border-none cursor-pointer bg-transparent" />
                      <span className="text-xs font-mono font-bold text-gray-900">{formData.secondaryColor}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveSystem}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all"
                >
                  System Speichern
                </button>
              </section>
            </div>

            {/* Financial & Address */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 space-y-10">
                <div className="flex items-center gap-3 mb-2">
                   <Building2 className="h-5 w-5 text-gray-400" />
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unternehmensdetails</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offizieller Firmenname</label>
                    <input 
                      type="text" 
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IBAN</label>
                    <input 
                      type="text" 
                      value={formData.bankIban}
                      onChange={(e) => setFormData({...formData, bankIban: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Firmenadresse</label>
                    <textarea 
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
                    />
                  </div>
                </div>
              </section>

              {/* Backup & Restore */}
              <section className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                   <Save className="h-5 w-5 text-gray-400" />
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datenbank Backup</h3>
                </div>
                <p className="text-sm text-gray-500">Da die Daten aktuell lokal gespeichert werden, sollten Sie regelmäßig ein Backup herunterladen, um Datenverlust zu vermeiden.</p>
                
                {/* Auto-Backup Configurations */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-900">Tägliches Google Drive Auto-Backup</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Sichert Ihre Datenbank automatisch in Ihr Google Drive.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={invoiceSettings.enableAutoBackup ?? true} 
                        onChange={(e) => {
                          updateInvoiceSettings({ enableAutoBackup: e.target.checked });
                          toast.success(e.target.checked ? "Auto-Backup aktiviert" : "Auto-Backup deaktiviert");
                        }} 
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  {(invoiceSettings.enableAutoBackup ?? true) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-200/50 animate-in fade-in duration-300">
                      <div>
                        <h4 className="text-sm font-black text-gray-900">Backup-Uhrzeit</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Legen Sie fest, zu welcher Uhrzeit das tägliche Backup durchgeführt werden soll.</p>
                      </div>
                      <input 
                        type="time" 
                        value={invoiceSettings.backupTime || "00:00"} 
                        onChange={(e) => {
                          updateInvoiceSettings({ backupTime: e.target.value });
                          toast.success(`Backup-Uhrzeit auf ${e.target.value} festgelegt`);
                        }} 
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black min-w-[150px] text-center" 
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button 
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-2 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                  >
                    <Download className="h-4 w-4" /> PC Exportieren
                  </button>
                  
                  <label className="flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 cursor-pointer transition-all">
                    <Upload className="h-4 w-4" /> PC Importieren
                    <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                  </label>

                  <button 
                    onClick={handleGDriveBackup}
                    disabled={isGdriveBackingUp}
                    className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    <UploadCloud className="h-4 w-4" /> {isGdriveBackingUp ? "Sichern..." : "Google Drive"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
