import React, { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Search, PlusCircle, CheckCircle, XCircle, Clock, Wallet, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Manual Topup / Deduct Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTechOption, setSelectedTechOption] = useState(null);
  const [formData, setFormData] = useState({
    technician_id: '',
    amount: '',
    type: 'topup',
    notes: ''
  });

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DEPOSITS.HISTORY, {
        page, limit, search, status: statusFilter
      });
      if (res.success) {
        setDeposits(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Gagal memuat riwayat deposit');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeposits();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDeposits]);

  // 1 Second (1000ms) Debounce search for react-select
  let searchTimer = null;
  const loadTechnicianOptions = (inputValue, callback) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      try {
        const res = await request.get(API_ENDPOINTS.TECHNICIANS.LIST, {
          search: inputValue,
          limit: 30
        });
        if (res.success) {
          const options = res.data.map(t => ({
            value: t.id,
            label: `${t.name} (${t.email}) - Saldo: Rp ${parseFloat(t.balance || 0).toLocaleString()}`
          }));
          callback(options);
        } else {
          callback([]);
        }
      } catch (err) {
        callback([]);
      }
    }, 1000); // 1 Detik Debounce
  };

  const handleUpdateDepositStatus = async (depositId, status) => {
    try {
      const res = await request.put(API_ENDPOINTS.DEPOSITS.UPDATE_STATUS(depositId), { status });
      if (res.success) {
        toast.success(res.message);
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses deposit');
    }
  };

  const handleManualDepositSubmit = async (e) => {
    e.preventDefault();
    if (!formData.technician_id || !formData.amount) {
      toast.error('Pilih teknisi dan isi nominal saldo');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.DEPOSITS.CREATE, formData);
      if (res.success) {
        toast.success('Saldo deposit teknisi berhasil diperbarui!');
        setIsModalOpen(false);
        setFormData({ technician_id: '', amount: '', type: 'topup', notes: '' });
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses deposit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Manajemen & Verifikasi Deposit Teknisi">
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff6600] text-white flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kelola Transaksi Deposit Teknisi</h3>
              <p className="text-xs text-gray-400">Verifikasi bukti transfer pengajuan top up teknisi atau tambah saldo secara manual.</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#109648] hover:bg-[#0b7838] text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-lg flex items-center space-x-2 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah / Potong Saldo Manual</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama teknisi atau catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#109648] focus:outline-none"
              >
                <option value="">Semua Status Transaksi</option>
                <option value="pending">Menunggu Verifikasi (Pending)</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="rejected">Ditolak (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Deposit History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-slate-700 text-xs font-bold uppercase">
                  <th className="py-3.5 px-4">Teknisi</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Bukti / Catatan</th>
                  <th className="py-3.5 px-4 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 text-xs">Memuat data deposit...</td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 text-xs">Belum ada riwayat transaksi deposit</td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                        {d.technician_name || `Teknisi #${d.technician_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(d.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3.5 px-4 font-extrabold text-xs ${d.type === 'topup' ? 'text-[#109648]' : 'text-red-600'}`}>
                        {d.type === 'topup' ? '+' : '-'} Rp {parseFloat(d.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold capitalize">
                        {d.type === 'topup' ? 'Top Up' : d.type === 'deduct_fee' ? 'Fee Order 10%' : 'Koreksi Manual'}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>
                        )}
                        {d.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Approved</span>
                        )}
                        {d.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Rejected</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <div>{d.notes || '-'}</div>
                        {d.proof_image && (
                          <a
                            href={`https://api.kingcreativestudio.my.id/ramahlistrik${d.proof_image}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#109648] font-bold hover:underline inline-flex items-center space-x-1 mt-1 text-[11px]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Bukti Transfer</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {d.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleUpdateDepositStatus(d.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleUpdateDepositStatus(d.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Selesai</span>
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
      </div>

      {/* Manual Deposit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah / Potong Saldo Deposit Teknisi"
      >
        <form onSubmit={handleManualDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Teknisi (Cari Nama / Email)</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadTechnicianOptions}
              value={selectedTechOption}
              onChange={(option) => {
                setSelectedTechOption(option);
                setFormData({ ...formData, technician_id: option ? option.value : '' });
              }}
              placeholder="Ketik untuk mencari nama/email teknisi (Debounce 1s)..."
              loadingMessage={() => 'Mencari data teknisi dari server...'}
              noOptionsMessage={() => 'Teknisi tidak ditemukan'}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  borderColor: '#e5e7eb',
                  padding: '2px',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#109648' }
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  zIndex: 9999
                })
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Transaksi</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] text-xs"
              >
                <option value="topup">Tambah Saldo (+)</option>
                <option value="deduct_fee">Potong Saldo (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="1000"
                placeholder="50000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Alasan</label>
            <textarea
              rows="2"
              placeholder="Contoh: Topup via Transfer Bank BCA"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-[#ff6600] text-white rounded-full hover:bg-[#e05500] shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
