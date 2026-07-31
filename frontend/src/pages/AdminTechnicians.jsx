import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { confirmToast } from '../components/ConfirmToast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Search, Wallet, Edit2, Trash2, CheckCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminTechnicians = () => {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Deposit Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    type: 'topup',
    notes: 'Topup deposit via transfer bank'
  });

  // Edit User & Reset Password Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'technician',
    password: ''
  });

  const fetchTechs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TECHNICIANS.LIST, {
        page, limit, search, status: statusFilter
      });
      if (res.success) {
        setTechs(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Gagal memuat data teknisi');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTechs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTechs]);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await request.put(API_ENDPOINTS.USERS.UPDATE_STATUS(userId), { status: newStatus });
      toast.success(`Status teknisi berhasil diperbarui ke ${newStatus.toUpperCase()}`);
      fetchTechs();
    } catch (err) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleOpenEditModal = (tech) => {
    setSelectedTech(tech);
    setEditForm({
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      role: 'technician',
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await request.put(API_ENDPOINTS.USERS.UPDATE(selectedTech.id), editForm);
      toast.success('Data teknisi berhasil diperbarui');
      setIsEditModalOpen(false);
      fetchTechs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupdate teknisi');
    }
  };

  const handleDeleteUser = (userId) => {
    confirmToast('Apakah Anda yakin ingin menghapus akun teknisi ini?', async () => {
      try {
        await request.delete(API_ENDPOINTS.USERS.DELETE(userId));
        toast.success('Teknisi berhasil dihapus');
        fetchTechs();
      } catch (err) {
        toast.error('Gagal menghapus pengguna');
      }
    });
  };

  const handleApproveDeposit = async (depositId, status) => {
    try {
      const res = await request.put(API_ENDPOINTS.DEPOSITS.UPDATE_STATUS(depositId), { status });
      if (res.success) {
        toast.success(res.message);
        fetchTechs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses deposit');
    }
  };

  const handleOpenDepositModal = (tech) => {
    setSelectedTech(tech);
    setDepositForm({ amount: '', type: 'topup', notes: 'Topup deposit via transfer bank' });
    setIsDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    try {
      await request.post(API_ENDPOINTS.DEPOSITS.CREATE, {
        technician_id: selectedTech.id,
        amount: depositForm.amount,
        type: depositForm.type,
        notes: depositForm.notes
      });
      toast.success('Deposit berhasil diperbarui!');
      setIsDepositModalOpen(false);
      fetchTechs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan deposit');
    }
  };

  return (
    <DashboardLayout title="Manajemen & Approval Teknisi">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau area kerja..."
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
            <option value="pending">Pending Approval</option>
            <option value="active">Aktif</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-700 text-sm font-semibold">
                <th className="py-3 px-4">Nama Teknisi</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Area Kerja</th>
                <th className="py-3 px-4">Saldo Deposit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Memuat data teknisi...</td>
                </tr>
              ) : techs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Data teknisi tidak ditemukan</td>
                </tr>
              ) : (
                techs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-xs text-gray-500">Pengalaman: {t.experience_years} thn</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{t.phone}</div>
                      <div className="text-xs text-gray-400">{t.email}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{t.working_area || '-'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      Rp {parseFloat(t.balance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {t.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending Review</span>
                      )}
                      {t.status === 'active' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Aktif</span>
                      )}
                      {t.status === 'suspended' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Suspended</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenDepositModal(t)}
                        className="p-1.5 text-[#ff6600] hover:bg-orange-50 rounded-lg transition"
                        title="Topup Saldo Deposit"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Profile / Reset Password"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {t.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'active')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Setujui Akun Teknisi"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {t.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'suspended')}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Suspend Akun Teknisi"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      )}
                      {t.status === 'suspended' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'active')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Aktifkan Akun Teknisi"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(t.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={`Topup Deposit: ${selectedTech?.name}`}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe Transaksi</label>
            <select
              value={depositForm.type}
              onChange={(e) => setDepositForm({ ...depositForm, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
            >
              <option value="topup">Tambah Saldo (Top Up)</option>
              <option value="deduct_fee">Kurangi Saldo (Potongan/Koreksi)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              required
              min="1000"
              value={depositForm.amount}
              onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              placeholder="50000"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
            <textarea
              rows="2"
              value={depositForm.notes}
              onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-xl hover:bg-amber-600"
            >
              Simpan Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User & Reset Password Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Data Teknisi: ${selectedTech?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No HP</label>
              <input
                type="text"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reset Password Baru <span className="text-xs font-normal text-gray-400">(Opsional, biarkan kosong jika tidak diubah)</span>
            </label>
            <input
              type="password"
              placeholder="Masukkan password baru..."
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#ff6600] text-white rounded-full hover:bg-[#e05500] shadow-sm"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
