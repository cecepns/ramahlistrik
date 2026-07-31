import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import logoImg from '../assets/logo.png';

export const RegisterPage = ({ isTechnician = false }) => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    working_area: '',
    experience_years: 1,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        role: isTechnician ? 'technician' : 'customer'
      };
      const ok = await register(payload);
      if (ok) navigate('/login');
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <img src={logoImg} alt="Ramah Listrik Logo" className="h-14 w-auto mx-auto object-contain" />
            <h2 className="text-2xl font-extrabold text-slate-900">
              {isTechnician ? 'Pendaftaran Mitra Teknisi' : 'Daftar Akun Customer'}
            </h2>
            <p className="text-xs text-gray-500">
              {isTechnician 
                ? 'Bergabung menjadi mitra teknisi listrik profesional terverifikasi' 
                : 'Pesan jasa perbaikan & instalasi listrik dengan aman dan transparan'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Budi Santoso"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="budi@domain.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor HP / WA</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08123456789"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>

            {isTechnician && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Domisili</label>
                  <textarea
                    name="address"
                    required
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Alamat lengkap tempat tinggal"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Area Kerja</label>
                    <input
                      type="text"
                      name="working_area"
                      required
                      value={formData.working_area}
                      onChange={handleChange}
                      placeholder="Jakarta Selatan"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pengalaman (Tahun)</label>
                    <input
                      type="number"
                      name="experience_years"
                      min="0"
                      required
                      value={formData.experience_years}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6600] hover:bg-[#e05500] text-white font-bold py-3.5 rounded-full transition shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Memproses...' : isTechnician ? 'Daftar Sebagai Mitra Teknisi' : 'Daftar Akun Customer'}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-[#109648] hover:underline">Masuk sekarang</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
