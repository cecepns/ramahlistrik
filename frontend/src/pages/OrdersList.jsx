import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Search, Calendar, User, Wrench, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrdersList = ({ role }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.LIST, {
        page, limit, search, status: statusFilter
      });
      if (res.success) {
        setOrders(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Gagal memuat order');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await request.put(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), { status: newStatus });
      if (res.success) {
        toast.success(res.message);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Menunggu Teknisi</span>;
      case 'accepted': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Diterima Teknisi</span>;
      case 'heading_to_location': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Menuju Lokasi</span>;
      case 'in_progress': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Sedang Dikerjakan</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Selesai</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Ditolak Teknisi</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Dibatalkan</span>;
      default: return null;
    }
  };

  return (
    <DashboardLayout title={role === 'admin' ? "Semua Order Sistem" : role === 'technician' ? "Order Masuk & Pengerjaan" : "Riwayat Order Saya"}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kode order, nama customer/teknisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Diterima</option>
            <option value="heading_to_location">Menuju Lokasi</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="completed">Selesai</option>
            <option value="rejected">Ditolak</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-700 text-sm font-semibold">
                <th className="py-3 px-4">Kode Order</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Customer / Teknisi</th>
                <th className="py-3 px-4">Harga Jasa</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Memuat daftar order...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Tidak ada order ditemukan</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>#{o.order_code}</div>
                      <div className="text-xs text-gray-400 font-normal">{new Date(o.scheduled_at).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{o.service_name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{o.address}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div><strong className="text-gray-700">Cust:</strong> {o.customer_name} ({o.customer_phone})</div>
                      <div><strong className="text-gray-700">Teknisi:</strong> {o.technician_name}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">
                      Rp {parseFloat(o.service_price).toLocaleString()}
                      <div className="text-[10px] text-gray-400 font-normal">Fee 10%: Rp {parseFloat(o.admin_fee_amount).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Technician Actions */}
                      {role === 'technician' && (
                        <>
                          {o.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'accepted')}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700"
                              >
                                Terima
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'rejected')}
                                className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {o.status === 'accepted' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'heading_to_location')}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                            >
                              Menuju Lokasi
                            </button>
                          )}
                          {o.status === 'heading_to_location' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'in_progress')}
                              className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700"
                            >
                              Mulai Kerja
                            </button>
                          )}
                          {o.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                              className="px-3 py-1 bg-emerald-500 text-slate-900 font-extrabold text-xs rounded-lg hover:bg-emerald-600 shadow-md"
                            >
                              Selesaikan Order (-10%)
                            </button>
                          )}
                        </>
                      )}

                      {/* Customer Actions */}
                      {role === 'customer' && o.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                        >
                          Batalkan Pesanan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </DashboardLayout>
  );
};
