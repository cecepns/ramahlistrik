import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wrench, ShoppingBag, 
  Wallet, Settings, LogOut, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export const DashboardLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const adminNavs = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manajemen Customer', path: '/admin/customers', icon: Users },
    { label: 'Manajemen Teknisi', path: '/admin/technicians', icon: Wrench },
    { label: 'Manajemen Layanan', path: '/admin/services', icon: ShoppingBag },
    { label: 'Manajemen Order', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Deposit Teknisi', path: '/admin/deposits', icon: Wallet },
    { label: 'Pengaturan Web', path: '/admin/settings', icon: Settings },
  ];

  const technicianNavs = [
    { label: 'Dashboard', path: '/technician/dashboard', icon: LayoutDashboard },
    { label: 'Order Masuk', path: '/technician/orders', icon: ShoppingBag },
    { label: 'Riwayat Saldo', path: '/technician/deposits', icon: Wallet },
    { label: 'Pengaturan Profil', path: '/technician/settings', icon: Settings },
  ];

  const customerNavs = [
    { label: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'Pesan Jasa', path: '/customer/create-order', icon: Wrench },
    { label: 'Riwayat Order', path: '/customer/orders', icon: ShoppingBag },
  ];

  const navs = user?.role === 'admin' ? adminNavs : user?.role === 'technician' ? technicianNavs : customerNavs;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Top Navbar with Menu Toggle */}
      <div className="md:hidden bg-slate-900 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30 shadow">
        <img src={logoImg} alt="Ramah Listrik Logo" className="h-8 w-auto object-contain bg-white/10 p-1 rounded-lg" />
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 text-gray-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Overlay */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shadow-md
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header with logo.png */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <Link to="/" className="flex items-center">
              <img src={logoImg} alt="Ramah Listrik Logo" className="h-10 w-auto object-contain bg-white/95 px-2 py-1 rounded-xl shadow-sm" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info Badge */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#ff6600] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <h4 className="text-xs font-bold text-white truncate">{user?.name}</h4>
                <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-[#109648]/20 text-[#109648] font-bold">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navs.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition
                  ${isActive ? 'bg-[#ff6600] text-white shadow-md shadow-orange-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}
                `}
                title={collapsed ? item.label : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <Link to="/" className="text-xs font-bold text-[#ff6600] hover:underline">← Beranda Utama</Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
