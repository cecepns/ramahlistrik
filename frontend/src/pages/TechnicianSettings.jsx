import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { User, Phone, MapPin, Navigation, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const TechnicianSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    working_area: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.AUTH.PROFILE);
      if (res.success && res.data) {
        setFormData({
          name: res.data.name || '',
          phone: res.data.phone || '',
          address: res.data.profile?.address || '',
          working_area: res.data.profile?.working_area || '',
          latitude: res.data.profile?.latitude || '',
          longitude: res.data.profile?.longitude || ''
        });
      }
    } catch (err) {
      toast.error('Gagal memuat profil teknisi');
    } finally {
      setLoading(false);
    }
  };

  const handleGetGPS = () => {
    if (navigator.geolocation) {
      toast.loading('Mengambil koordinat GPS lokasi Anda...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success('Lokasi GPS berhasil ditemukan!');
        },
        (error) => {
          toast.dismiss();
          toast.error('Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif.');
        }
      );
    } else {
      toast.error('Browser Anda tidak mendukung Geolocation GPS');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await request.put(API_ENDPOINTS.TECHNICIANS.UPDATE_PROFILE, formData);
      toast.success('Profil & lokasi GPS berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan perubahan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Pengaturan Profil Teknisi"><div className="p-8 text-center text-gray-500">Memuat profil...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Pengaturan Profil & Lokasi GPS Teknisi">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Edit Identitas & Lokasi Presisi</h2>
          <p className="text-xs text-gray-500">Perbarui informasi nama, alamat, serta titik GPS lokasi Anda agar mudah ditemukan pelanggan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor HP / WhatsApp</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Tinggal Lengkap</label>
            <textarea
              rows="3"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Area Kerja (Kecamatan / Kota)</label>
            <input
              type="text"
              required
              placeholder="Contoh: Jakarta Selatan & Depok"
              value={formData.working_area}
              onChange={(e) => setFormData({ ...formData, working_area: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          {/* GPS Location Section */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#109648]" />
                <span>Titik Koordinat Lokasi GPS</span>
              </span>
              <button
                type="button"
                onClick={handleGetGPS}
                className="bg-[#109648] hover:bg-[#0b7838] text-white text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm"
              >
                Ambil Lokasi GPS
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Latitude</label>
                <input
                  type="text"
                  readOnly
                  placeholder="-6.200000"
                  value={formData.latitude}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Longitude</label>
                <input
                  type="text"
                  readOnly
                  placeholder="106.816666"
                  value={formData.longitude}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff6600] hover:bg-[#e05500] text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange-500/20 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Simpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
