import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Wallet, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';

export const TechnicianDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.AUTH.PROFILE);
      if (res.success) {
        setUserProfile(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const balance = parseFloat(userProfile?.profile?.balance || 0);

  return (
    <DashboardLayout title="Dashboard Teknisi">
      <div className="space-y-6">
        {/* Deposit Warning Banner if Balance is 0 */}
        {balance <= 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-red-800">Saldo Deposit Habis (Rp 0)</h4>
              <p className="text-sm text-red-600">Anda tidak dapat menerima order baru sampai Anda melakukan top up saldo ke Admin.</p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Ramah%20Listrik,%20saya%20ingin%20topup%20deposit"
              target="_blank"
              rel="noreferrer"
              className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-red-700 transition"
            >
              Hubungi Admin Topup
            </a>
          </div>
        )}

        {/* Balance & Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 p-6 rounded-2xl shadow-lg space-y-2">
            <span className="text-sm font-semibold text-slate-800">Saldo Deposit Aktif</span>
            <h2 className="text-3xl font-extrabold">Rp {balance.toLocaleString()}</h2>
            <p className="text-xs text-slate-800 font-medium">*Dipotong 10% setiap kali pekerjaan selesai</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <span className="text-sm font-medium text-gray-500">Rating Teknisi</span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              ⭐ {parseFloat(userProfile?.profile?.rating_avg || 5.0).toFixed(1)}
            </h2>
            <p className="text-xs text-gray-400">Dari {userProfile?.profile?.rating_count || 0} ulasan pelanggan</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <span className="text-sm font-medium text-gray-500">Status Akun</span>
            <h2 className="text-2xl font-extrabold text-emerald-600 capitalize">
              {userProfile?.status || 'Active'}
            </h2>
            <p className="text-xs text-gray-400">Area: {userProfile?.profile?.working_area || '-'}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
