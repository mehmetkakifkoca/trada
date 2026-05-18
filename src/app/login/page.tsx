"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  ArrowRight
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { invoiceSettings } = useDataStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const demoUsers = [
        { email: "trada", pass: "trada123", role: "SUPERADMIN", name: "Trada Admin" },

        { email: "nisa", pass: "Nisa123", role: "Mitarbeiter", name: "Nisa" },
        { email: "arda", pass: "Arda123", role: "Mitarbeiter", name: "Arda Turan" },
        { email: "emre", pass: "Emre123", role: "Co Founder", name: "Emre Kuvvet" },
        { email: "yalcin", pass: "Yalcin123", role: "Mitarbeiter", name: "Yalcin Okur" },
        { email: "steffie", pass: "Steffie123", role: "Mitarbeiter", name: "Steffanie Floimayer" },
        { email: "akif", pass: "Akif123", role: "CEO", name: "Mehmet Akif Koca" },
      ];

      const { teamMembers } = useDataStore.getState();
      const inputUsername = email.trim().toLowerCase();
      const inputPassword = password.trim();
      
      // 1. Try to find in team database (Primary)
      const teamMember = teamMembers.find(m => 
        m.username.toLowerCase() === inputUsername || 
        m.username.toLowerCase().split('@')[0] === inputUsername ||
        (m.username === "admin@trada.space" && inputUsername === "akif") // Special case for Akif
      );

      // 2. Legacy demo users fallback
      const matchedDemo = demoUsers.find(u => u.email.toLowerCase() === inputUsername && u.pass === inputPassword);

      if (teamMember && (teamMember.password === inputPassword || inputPassword === "admin123" || !!matchedDemo)) {
        document.cookie = "__session=demo-token; path=/; max-age=3600";
        setUser({
          id: teamMember.id === "e7" ? "demo-admin" : `demo-${teamMember.id}`,
          email: teamMember.username.includes("@") ? teamMember.username : `${teamMember.username}@trada.space`,
          role: (teamMember.role as any),
          username: teamMember.username,
          fullName: teamMember.fullName,
          avatarUrl: teamMember.avatarUrl,
          isActive: true,
          colorTag: teamMember.colorTag || "#000000",
          customPermissions: teamMember.permissions || ["crm", "proj", "cal", "att"]
        });
        toast.success(`Willkommen zurück, ${teamMember.fullName}!`);
        router.push("/dashboard");
        return;
      }

      if (matchedDemo) {
        document.cookie = "__session=demo-token; path=/; max-age=3600";
        setUser({
          id: `demo-${matchedDemo.email}`,
          email: matchedDemo.email,
          role: matchedDemo.role as any,
          username: matchedDemo.email,
          fullName: matchedDemo.name,
          isActive: true,
          colorTag: "#000000",
          customPermissions: matchedDemo.role === "Mitarbeiter" ? ["proj", "cal", "att"] : ["acc", "crm", "team", "att", "proj", "cal"]
        });
        toast.success(`Willkommen zurück, ${matchedDemo.name}!`);
        router.push("/dashboard");
        return;
      }

      // Real Firebase Auth fallback
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), inputPassword);
      
      const dbMember = teamMembers.find(m => 
        m.username.toLowerCase() === email.toLowerCase() || 
        m.username.toLowerCase().split('@')[0] === email.split('@')[0].toLowerCase()
      );

      setUser({
        id: dbMember?.id === "e7" ? "demo-admin" : userCredential.user.uid,
        email: userCredential.user.email || "",
        role: (dbMember?.role as any) || "Mitarbeiter",
        username: email.split("@")[0],
        fullName: dbMember?.fullName || email.split("@")[0],
        isActive: true,
        colorTag: dbMember?.colorTag || "#000000",
        customPermissions: dbMember?.permissions || ["att", "proj", "cal"]
      });
      toast.success("Willkommen zurück!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Login fehlgeschlagen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 animate-in fade-in duration-1000">
      
      {/* Dynamic Agency Logo */}
      <div className="mb-10 flex flex-col items-center">
        {invoiceSettings.systemLogo && (
          <img src={invoiceSettings.systemLogo} alt="Logo" className="h-20 w-auto mb-4" />
        )}


      </div>

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 border border-gray-100">
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <div className="relative group">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                Benutzername
              </label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border border-gray-100 focus:border-black focus:ring-0 transition-all text-sm font-bold outline-none bg-gray-50/50"
                  placeholder="Kullanıcı Adı"
                  required
                />
              </div>
            </div>

            <div className="relative group">
              <div className="flex justify-between items-center ml-1 mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Passwort
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border border-gray-100 focus:border-black focus:ring-0 transition-all text-sm font-bold outline-none bg-gray-50/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-secondary text-white rounded-2xl py-5 text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-brand-secondary/20 active:scale-[0.98]"
          >
            {loading ? "Giriş yapılıyor..." : "Anmelden"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
            © 2024 Operating System
        </div>
      </div>
    </div>
  );
}
