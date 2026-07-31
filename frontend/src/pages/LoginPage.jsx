import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'technician') navigate('/technician/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      // toast handled in context
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Navbar />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <img src={logoImg} alt="Ramah Listrik Logo" className="h-16 w-auto mx-auto object-contain" />
            <h2 className="text-2xl font-extrabold text-slate-900">Lacak Pengajuan & Masuk</h2>
            <p className="text-xs text-gray-500">Silakan login untuk memantau status pesanan & akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6600] hover:bg-[#e05500] text-white font-bold py-3 rounded-full transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100 space-y-1">
            <p>Belum punya akun?</p>
            <div className="space-x-2">
              <Link to="/register" className="font-bold text-[#109648] hover:underline">Daftar Customer</Link>
              <span>•</span>
              <Link to="/register-technician" className="font-bold text-[#ff6600] hover:underline">Daftar Mitra Teknisi</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
