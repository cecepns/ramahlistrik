import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={logoImg} alt="Ramah Listrik Logo" className="h-14 md:h-16 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-[#109648] font-medium text-sm transition">Beranda</Link>
            <Link to="/layanan" className="text-gray-600 hover:text-[#109648] font-medium text-sm transition">Layanan</Link>
            <Link to="/cara-kerja" className="text-gray-600 hover:text-[#109648] font-medium text-sm transition">Cara Kerja</Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={
                    user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'technician'
                        ? '/technician/dashboard'
                        : '/customer/dashboard'
                  }
                  className="flex items-center space-x-2 bg-[#109648] hover:bg-[#0b7838] text-white text-sm font-medium px-5 py-2.5 rounded-full transition shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-[#109648] text-sm font-semibold transition px-3 py-2"
                >
                  Masuk
                </Link>
                <Link
                  to="/customer/create-order"
                  className="bg-[#ff6600] hover:bg-[#e05500] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition shadow-md shadow-orange-500/20"
                >
                  Pesan Teknisi
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-3">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600 font-medium">Beranda</Link>
          <Link to="/layanan" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600 font-medium">Layanan</Link>
          <Link to="/cara-kerja" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600 font-medium">Cara Kerja</Link>
          {user ? (
            <>
              <Link
                to={
                  user.role === 'admin'
                    ? '/admin/dashboard'
                    : user.role === 'technician'
                      ? '/technician/dashboard'
                      : '/customer/dashboard'
                }
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-[#109648] text-white font-semibold py-2.5 rounded-full"
              >
                Ke Dashboard ({user.name})
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="block w-full text-center bg-red-50 text-red-600 font-medium py-2.5 rounded-full"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-gray-700 font-semibold">Masuk</Link>
              <Link to="/customer/create-order" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2.5 bg-[#ff6600] text-white font-semibold rounded-full">Pesan Teknisi</Link>
              <Link to="/register-technician" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-[#109648] text-sm font-medium">Daftar Mitra Teknisi</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
