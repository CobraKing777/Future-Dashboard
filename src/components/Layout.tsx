import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Wallet, BrainCircuit, Target, LogOut, Menu, X, Upload, Check, AlertCircle, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {coverImg} from "./V2.jpeg";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { user, logout, updateProfile, isUsernameUnique } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!profileData.displayName.trim()) {
      setProfileError('Username is required');
      return;
    }

    const isUnique = await isUsernameUnique(profileData.displayName);
    if (!isUnique) {
      setProfileError('Username is already taken');
      return;
    }

    await updateProfile(profileData);
    setIsProfileModalOpen(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData({ ...profileData, photoURL: reader.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'ai', label: 'AI Insights', icon: BrainCircuit },
    { id: 'reference', label: 'Reference', icon: Library },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 space-y-8">
      <div className="flex flex-col items-center px-2 mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/10 border border-slate-800/50 hover:scale-105 transition-transform duration-500 bg-slate-900">
          <img 
            src={coverImg}
            alt="RTFT" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="mt-2 text-center">
          <div className="text-[12px] font-black tracking-tighter text-white leading-none">RTFT</div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col items-center space-y-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative",
              currentView === item.id 
                ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            )}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} className="transition-transform duration-300 group-hover:scale-110" />
            
            <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0 shadow-2xl">
              {item.label}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-800 rotate-45" />
            </div>

            {currentView === item.id && (
              <div className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800/50 flex flex-col items-center space-y-6">
        <div 
          className="flex flex-col items-center gap-2 group cursor-pointer"
          onClick={() => {
            setProfileData({
              displayName: user?.displayName || '',
              photoURL: user?.photoURL || ''
            });
            setIsProfileModalOpen(true);
          }}
        >
          <div className="relative">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=3b82f6&color=fff`} 
              alt={user?.displayName || ''} 
              className="w-10 h-10 rounded-xl border border-slate-800 object-cover shadow-inner group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors truncate max-w-[64px] text-center">
            {user?.displayName || 'User'}
          </span>
        </div>

        <button
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group relative"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          
          <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0 shadow-2xl">
            Logout
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-800 rotate-45" />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="font-black tracking-tighter text-xl font-display text-white">FUTURES</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside 
        className="hidden md:flex border-r border-slate-800/50 flex-col sticky top-0 h-screen bg-slate-950 w-24 z-20 overflow-visible"
      >
        <SidebarContent />
      </aside>

      {/* Sidebar (Mobile Overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Profile Editing Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Edit Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <p>{profileError}</p>
              </div>
            )}
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Profile Picture</label>
                <div 
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onPaste={(e) => {
                    const item = e.clipboardData.items[0];
                    if (item?.type.indexOf('image') !== -1) {
                      const file = item.getAsFile();
                      if (file) handleFileUpload(file);
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.focus()}
                  tabIndex={0}
                  className="relative group cursor-pointer outline-none"
                >
                  <div className="w-full h-40 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-3 hover:border-blue-500/50 transition-all overflow-hidden focus:border-blue-500/50">
                    {profileData.photoURL ? (
                      <img src={profileData.photoURL} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    ) : (
                      <Upload size={32} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                        {isUploading ? 'Uploading...' : 'Drag & Drop or Click to Upload'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 h-14 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center shadow-lg"
                  title="Cancel"
                >
                  <X size={24} />
                </button>
                <button
                  type="submit"
                  className="flex-1 h-14 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
                  title="Save Profile"
                >
                  <Check size={24} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative z-10">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
