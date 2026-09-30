import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Brain,
  FileText,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  MapPin,
  ClipboardList,
  Zap,
  Flame,
  Droplets,
  Lock,
  Eye,
  EyeOff,
  Layers,
  Filter,
  Sparkles,
  Plus,
  RefreshCw,
  Sliders,
  ChevronDown,
  Mail,
  ShieldAlert,
  ArrowRight,
  Download,
  Check,
  Cpu,
  Globe,
  FileCheck
} from 'lucide-react';

// --- TYPES ---
interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  organization: string;
}

interface InspectionItem {
  id: string;
  buildingName: string;
  location: string;
  type: 'structural' | 'mep' | 'fire' | 'architectural';
  status: 'LAIK_FUNGSI' | 'LAIK_FUNGSI_BERSYARAT' | 'TIDAK_LAIK_FUNGSI' | 'DALAM_PENGKAJIAN';
  progress: number;
  inspector: string;
  lastUpdated: string;
  score: number;
}

interface AIProcessingLog {
  id: string;
  stage: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

export default function App() {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>({
    name: 'Ir. Ahmad Subagyo, S.T., M.T.',
    email: 'admin.skpslf@gmail.com',
    role: 'Pengkaji Teknis Utama (Ahli Gedung)',
    avatarInitials: 'AS',
    organization: 'Lembaga Pengkaji Teknis SLF Nasional'
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'ai-status' | 'reports' | 'settings'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [inspectionFilter, setInspectionFilter] = useState<'all' | 'structural' | 'mep' | 'fire' | 'architectural'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState<string>('admin.skpslf@gmail.com');
  const [loginPassword, setLoginPassword] = useState<string>('P@ssword2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Selected Inspection Drawer State
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationsCount, setNotificationsCount] = useState<number>(3);

  // Profile Menu Dropdown
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // AI Pipeline State
  const [isAiRunning, setIsAiRunning] = useState<boolean>(false);
  const [aiLogs, setAiLogs] = useState<AIProcessingLog[]>([
    { id: '1', stage: 'Dokumen OCR', message: 'Mengekstrak gambar denah & Sertifikat PBG No. PBG-317102-2024', timestamp: '10:42:15', type: 'info' },
    { id: '2', stage: 'Evaluasi Seismik', message: 'Kalkulasi kekakuan antar-lantai (ASCE 41-11 Tier 2) nominal nominal nominal', timestamp: '10:42:28', type: 'success' },
    { id: '3', stage: 'Verifikasi MEP', message: 'SNI 03-7015-2004 Proteksi Petir: Terdapat turunan konduktor kendor di Atap B', timestamp: '10:43:01', type: 'warning' }
  ]);

  // Mock Inspections Data
  const [inspections, setInspections] = useState<InspectionItem[]>([
    {
      id: 'SLF-2026-001',
      buildingName: 'Menara Menara Palma Nusantara',
      location: 'Jl. H.R. Rasuna Said, Jakarta Selatan',
      type: 'structural',
      status: 'LAIK_FUNGSI',
      progress: 92,
      inspector: 'Ir. Ahmad Subagyo',
      lastUpdated: '30 Sep 2026',
      score: 94
    },
    {
      id: 'SLF-2026-002',
      buildingName: 'Gedung Wisma Perkasa Lt. 12',
      location: 'Jl. Jend. Sudirman Kav. 52, Jakarta Pusat',
      type: 'fire',
      status: 'LAIK_FUNGSI_BERSYARAT',
      progress: 78,
      inspector: 'Drs. Bambang Haryono',
      lastUpdated: '29 Sep 2026',
      score: 72
    },
    {
      id: 'SLF-2026-003',
      buildingName: 'Apartemen Kebayoran Heritage Atap B',
      location: 'Kebayoran Baru, Jakarta Selatan',
      type: 'mep',
      status: 'TIDAK_LAIK_FUNGSI',
      progress: 45,
      inspector: 'Siti Rahmawati, S.T.',
      lastUpdated: '28 Sep 2026',
      score: 58
    },
    {
      id: 'SLF-2026-004',
      buildingName: 'Pusat Perbelanjaan Plaza Nusantara',
      location: 'Jl. MH Thamrin No. 18, Jakarta Pusat',
      type: 'architectural',
      status: 'DALAM_PENGKAJIAN',
      progress: 60,
      inspector: 'Ir. Ahmad Subagyo',
      lastUpdated: '27 Sep 2026',
      score: 81
    }
  ]);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail || !loginPassword) {
      setLoginError('Harap isi alamat surel dan kata sandi.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsAuthenticated(true);
    }, 800);
  };

  // Demo Login Handler
  const handleDemoLogin = () => {
    setLoginEmail('admin.skpslf@gmail.com');
    setLoginPassword('P@ssword2026!');
    setLoginError('');
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsAuthenticated(true);
    }, 600);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowProfileMenu(false);
  };

  // Trigger New AI Analysis
  const handleRunAiAnalysis = () => {
    if (isAiRunning) return;
    setIsAiRunning(true);
    
    const newLog: AIProcessingLog = {
      id: Date.now().toString(),
      stage: 'Audit Neural Multi-Moda',
      message: 'Mulai pemindaian otomatis jaringan kabel PUIL 2020 & Ketahanan Gempa...',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'info'
    };
    setAiLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      setAiLogs(prev => [
        {
          id: (Date.now() + 1).toString(),
          stage: 'Sintesis Laporan AI',
          message: 'Seluruh 140 modul pemeriksaan dinyatakan memenuhi kriteria NSPK & SIMBG Cloud.',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          type: 'success'
        },
        ...prev
      ]);
      setIsAiRunning(false);
    }, 2000);
  };

  // Filtered Inspections
  const filteredInspections = inspections.filter(item => {
    const matchesFilter = inspectionFilter === 'all' || item.type === inspectionFilter;
    const matchesSearch = item.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Render Status Badge
  const renderStatusBadge = (status: InspectionItem['status']) => {
    switch (status) {
      case 'LAIK_FUNGSI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> LAIK FUNGSI
          </span>
        );
      case 'LAIK_FUNGSI_BERSYARAT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> BERSYARAT
          </span>
        );
      case 'TIDAK_LAIK_FUNGSI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> TIDAK LAIK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> PENGKAJIAN
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // UNAUTHENTICATED: LOGIN PAGE (VISUALLY RESTFUL DEEP NAVY THEME)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white">
        {/* Background Atmosphere Subtle Scrim */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/50 to-[#0B0F19]" />

        <div className="relative w-full max-w-4xl bg-[#111827]/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Hero Brand Panel (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 bg-gradient-to-br from-slate-900 via-[#131C2E] to-blue-950 border-r border-slate-800/80">
            {/* Background Texture */}
            <div 
              className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" 
              style={{ backgroundImage: `url('/src/assets/images/executive_building_audit_1790766197755.jpg')` }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white tracking-tight">Smart AI SLF</h1>
                  <p className="text-xs text-blue-400 font-mono tracking-wider">COMMAND CENTER</p>
                </div>
              </div>

              <div className="space-y-4 my-8">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                    <Sparkles className="w-4 h-4" /> Multi-Moda AI Audit
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sistem otomatisasi verifikasi kelaikan fungsi bangunan berdasarkan NSPK, SNI 9273:2025, dan ASCE 41-11.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                    <ShieldAlert className="w-4 h-4" /> TTE Verifikasi Legal
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Penerbitan surat pernyataan & rekomendasi teknis bersertifikasi digital langsung terhubung SIMBG.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-xs text-slate-500 font-mono flex items-center justify-between pt-4 border-t border-slate-800">
              <span>Versi 2.0.0-forensic</span>
              <span>KemenPUPR Compliant</span>
            </div>
          </div>

          {/* Right Form Interaction Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Mobile Header Brand */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-white">Smart AI Pengkaji SLF</h1>
                <p className="text-xs text-slate-400">Pusat Audit Teknis Bangunan</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                Masuk Sesi Pengkaji
              </h2>
              <p className="text-sm text-slate-400">
                Silakan masukkan kredensial akun Anda untuk mengakses dashboard inspeksi.
              </p>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-shake">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alamat Surel (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@pengkajislf.id"
                    className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Kata Sandi (Password)
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Hubungi administrator SIMBG untuk reset kata sandi.'); }} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Lupa sandi?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span>Ingat perangkat ini</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-3">Ingin mencoba tanpa mengetik?</p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gunakan Akun Demo Pengkaji Utama</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED: MAIN RESPONSIVE SIDEBAR APP CONTAINER
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white">
      
      {/* MOBILE SIDEBAR BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* RESPONSIVE SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#111827] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Sidebar Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="font-bold text-sm text-white tracking-tight truncate">Smart AI SLF</h1>
                  <p className="text-[10px] text-blue-400 font-mono tracking-wider">COMMAND CENTER</p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dasbor Utama</span>}
            </button>

            <button
              onClick={() => { setActiveTab('inspections'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'inspections'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Inspeksi Lapangan</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-blue-400 font-mono">
                  {inspections.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('ai-status'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'ai-status'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Brain className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Status AI & Audit</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                  LIVE
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Laporan Kajian SLF</span>}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Pengaturan Sistem</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {!isSidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-200 truncate">Pengkaji Terverifikasi</p>
                <p className="text-[10px] text-slate-500 font-mono">SKA Utama No. 892/2026</p>
              </div>
            </div>
          )}

          {/* User Account Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {user.avatarInitials}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.name.split(',')[0]}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={handleLogout}
                title="Keluar Akun"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 overflow-hidden text-xs sm:text-sm">
              <span className="text-slate-400">Pengkaji SLF</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-semibold text-white capitalize truncate">
                {activeTab === 'dashboard' && 'Dasbor Utama'}
                {activeTab === 'inspections' && 'Inspeksi Teknis Lapangan'}
                {activeTab === 'ai-status' && 'Status AI & Audit Neural'}
                {activeTab === 'reports' && 'Laporan Kajian & Rekomendasi'}
                {activeTab === 'settings' && 'Pengaturan Sistem'}
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="hidden md:flex items-center relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari gedung, lokasi..."
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-blue-500 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Sync Online</span>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-slate-800 rounded-2xl shadow-xl p-4 z-50 text-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="font-bold text-white">Notifikasi Pengkajian</span>
                    <button onClick={() => setNotificationsCount(0)} className="text-[10px] text-blue-400 hover:underline">
                      Tandai dibaca
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="font-semibold text-slate-200">Hasil Audit Menara Palma Ready</p>
                      <p className="text-[10px] text-slate-400 mt-1">Skor Kelaikan Struktur 94/100 menyatakan Laik Fungsi.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="font-semibold text-amber-400">Peringatan Proteksi Kebakaran</p>
                      <p className="text-[10px] text-slate-400 mt-1">Gedung Wisma Perkasa memerlukan pengisian ulang hydrant lantai 8.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                  {user.avatarInitials}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-slate-800 rounded-2xl shadow-xl p-2 z-50 text-xs">
                  <div className="p-2.5 border-b border-slate-800 mb-1">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Pengaturan Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Keluar Sesi
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Executive Hero Banner */}
              <div 
                className="relative rounded-2xl p-6 sm:p-8 border border-blue-500/30 overflow-hidden shadow-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(11, 15, 25, 0.92) 0%, rgba(17, 24, 39, 0.88) 60%, rgba(30, 58, 138, 0.4) 100%), url('/src/assets/images/executive_building_audit_1790766197755.jpg')`
                }}
              >
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sistem Terverifikasi v2.0
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                    Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">{user.name.split(' ')[0]}</span>
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Pusat Komando Inspeksi & Audit Teknis Kelaikan Fungsi Bangunan Gedung. Seluruh data tersinkronisasi otomatis dengan standar SIMBG KemenPUPR.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('inspections')}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" /> Buka Inspeksi
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-status')}
                      className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4 text-blue-400" /> Status AI Pipeline
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Portofolio</span>
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-white font-mono">18</div>
                  <p className="text-[11px] text-slate-500">Gedung terdaftar di SIMBG</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Kelaikan Struktur</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 font-mono">91.4%</div>
                  <p className="text-[11px] text-slate-500">Sesuai SNI 9273:2025</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Inspeksi Aktif</span>
                    <Activity className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 font-mono">4</div>
                  <p className="text-[11px] text-slate-500">Proses pemeriksaan tim</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Rekomendasi AI</span>
                    <Brain className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-white font-mono">140</div>
                  <p className="text-[11px] text-slate-500">Kriteria teknis terverifikasi</p>
                </div>
              </div>

              {/* Main Map & AI Overview Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Geospatial Map Visual Placeholder */}
                <div className="lg:col-span-8 p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 flex flex-col justify-between min-h-[380px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white">Sebaran Geospatial Pengkajian</h3>
                      <p className="text-xs text-slate-400">Pemetaan lokasi audit kelaikan fungsi secara real-time</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      OpenStreetMap Live
                    </span>
                  </div>

                  <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800/80 relative flex items-center justify-center overflow-hidden p-6">
                    {/* Simulated Map Visual */}
                    <div className="text-center space-y-3 relative z-10 max-w-md">
                      <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-200">OpenStreetMap Integration Active</h4>
                      <p className="text-xs text-slate-400">
                        4 Lokasi pengkajian aktif di area DKI Jakarta & Tangerang Selatan teridentifikasi dengan status kelaikan terupdate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Portfolio Pulse */}
                <div 
                  className="lg:col-span-4 p-5 rounded-2xl border border-blue-500/20 flex flex-col justify-between bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.92) 0%, rgba(11, 15, 25, 0.96) 100%), url('/src/assets/images/smart_ai_neural_hub_1790766209920.jpg')`
                  }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">AI Portfolio Pulse</h3>
                        <p className="text-[10px] text-blue-400 font-mono uppercase">Neural Risk Analysis</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                        <div className="flex justify-between font-semibold text-slate-200 mb-1">
                          <span>Integritas Struktur</span>
                          <span className="text-emerald-400">94%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[94%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                        <div className="flex justify-between font-semibold text-slate-200 mb-1">
                          <span>Proteksi Kebakaran</span>
                          <span className="text-amber-400">72%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-amber-500 w-[72%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                        <div className="flex justify-between font-semibold text-slate-200 mb-1">
                          <span>Kelistrikan & MEP</span>
                          <span className="text-blue-400">88%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-blue-500 w-[88%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={isAiRunning}
                    className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAiRunning ? 'Menganalisis...' : 'Jalankan Audit AI Baru'}</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SITE INSPECTIONS MODULE */}
          {activeTab === 'inspections' && (
            <div className="space-y-6">
              
              {/* Header & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80">
                <div>
                  <h2 className="text-lg font-bold text-white">Inspeksi Teknis Lapangan</h2>
                  <p className="text-xs text-slate-400">Daftar modul pengkajian kelaikan fungsi fisik gedung</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
                  <button
                    onClick={() => setInspectionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      inspectionFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({inspections.length})
                  </button>
                  <button
                    onClick={() => setInspectionFilter('structural')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      inspectionFilter === 'structural' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Struktur
                  </button>
                  <button
                    onClick={() => setInspectionFilter('mep')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      inspectionFilter === 'mep' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    MEP & Listrik
                  </button>
                  <button
                    onClick={() => setInspectionFilter('fire')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      inspectionFilter === 'fire' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kebakaran
                  </button>
                </div>
              </div>

              {/* Inspections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInspections.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInspection(item)}
                    className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer space-y-4 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">{item.id}</span>
                        <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                          {item.buildingName}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      </div>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Kemajuan Inspeksi</span>
                        <span className="font-mono text-white font-semibold">{item.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.progress >= 80 ? 'bg-emerald-500' : item.progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Pengkaji: <strong className="text-slate-200">{item.inspector}</strong></span>
                      <span>Update: {item.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: AI ASSESSMENT STATUS MODULE */}
          {activeTab === 'ai-status' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Pipeline Assessment AI Deep Reasoning</h2>
                      <p className="text-xs text-slate-400">Penilaian otomatis berlandaskan SNI & NSPK KemenPUPR</p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={isAiRunning}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAiRunning ? 'animate-spin' : ''}`} />
                    <span>{isAiRunning ? 'Memproses Pipeline...' : 'Proses Ulang'}</span>
                  </button>
                </div>

                {/* Log Viewer */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-2.5 max-h-80 overflow-y-auto">
                  {aiLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-500 text-[10px] pt-0.5">{log.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                        [{log.stage}]
                      </span>
                      <span className="text-slate-300 flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: REPORTS MODULE */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-6 h-6 text-blue-400" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Laporan Kajian & Sertifikasi SLF</h2>
                      <p className="text-xs text-slate-400">Dokumen verifikasi hukum & rekomendasi teknis</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Laporan Final SLF - Menara Palma Nusantara</h4>
                      <p className="text-xs text-slate-400">TTE Terverifikasi No. REG-PUPR-998231</p>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Unduh PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS MODULE */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827]/80 border border-slate-800/80 space-y-4">
                <h2 className="text-lg font-bold text-white">Pengaturan Akun & Sistem SLF</h2>
                <div className="space-y-4 max-w-xl text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Nama Pengkaji Teknis</label>
                    <input type="text" value={user.name} readOnly className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Lembaga / Organisasi Audit</label>
                    <input type="text" value={user.organization} readOnly className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
