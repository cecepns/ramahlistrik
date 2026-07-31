import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Save, Phone, Mail, CreditCard, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    app_name: 'Ramah Listrik',
    whatsapp_number: '081234567890',
    email: 'support@ramahlistrik.com',
    bank_account: 'BCA: 1234567890 a.n Ramah Listrik',
    fee_percentage: 10,
    operational_hours: '24 Jam'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setFormData({
          app_name: res.data.app_name || 'Ramah Listrik',
          whatsapp_number: res.data.whatsapp_number || '',
          email: res.data.email || '',
          bank_account: res.data.bank_account || '',
          fee_percentage: res.data.fee_percentage || 10,
          operational_hours: res.data.operational_hours || '24 Jam'
        });
      }
    } catch (err) {
      toast.error('Gagal memuat pengaturan web');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await request.put(API_ENDPOINTS.SETTINGS.UPDATE, formData);
      toast.success('Pengaturan kontak & rekening berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Pengaturan Web & Kontak"><div className="p-8 text-center text-gray-500">Memuat pengaturan...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Pengaturan Web, Rekening & Kontak Admin">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Kelola Informasi Kontak & Rekening Bank</h2>
          <p className="text-xs text-gray-500">Informasi ini akan ditampilkan kepada customer dan teknisi untuk keperluan deposit serta bantuan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Aplikasi</label>
              <input
                type="text"
                required
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Persentase Fee Admin (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.fee_percentage}
                onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WhatsApp Admin (Kontak Bantuan)</label>
              <input
                type="text"
                required
                placeholder="081234567890"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Resmi Admin</label>
              <input
                type="email"
                required
                placeholder="admin@ramahlistrik.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rekening Bank Admin (Tujuan Transfer Deposit)</label>
            <textarea
              rows="3"
              required
              placeholder="BCA: 1234567890 a.n Ramah Listrik&#10;MANDIRI: 0987654321 a.n Ramah Listrik"
              value={formData.bank_account}
              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jam Operasional Layanan</label>
            <input
              type="text"
              value={formData.operational_hours}
              onChange={(e) => setFormData({ ...formData, operational_hours: e.target.value })}
              placeholder="08.00 - 20.00 WIB / 24 Jam"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff6600] hover:bg-[#e05500] text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange-500/20 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Simpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
