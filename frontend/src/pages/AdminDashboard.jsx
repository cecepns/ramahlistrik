import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Users, Wrench, ShoppingBag, DollarSign, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ADMIN.STATS);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout title="Admin Dashboard"><div className="p-8 text-center text-gray-500">Memuat statistik...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Overview Dashboard Admin">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Total Customer</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.total_customers || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Teknisi Aktif</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.active_technicians || 0}</h3>
            {stats?.pending_technicians > 0 && (
              <span className="text-xs text-amber-600 font-semibold">{stats.pending_technicians} Pending</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Order Selesai</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.completed_orders || 0} / {stats?.total_orders || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Pendapatan Fee (10%)</span>
            <h3 className="text-xl font-extrabold text-emerald-600">
              Rp {parseFloat(stats?.total_fee_income || 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Deposit Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Total Saldo Deposit Teknisi</h4>
            <p className="text-sm text-gray-400">Total akumulasi deposit aktif di sistem saat ini</p>
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-amber-400">
          Rp {parseFloat(stats?.total_technician_deposit || 0).toLocaleString()}
        </div>
      </div>
    </DashboardLayout>
  );
};
