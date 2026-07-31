import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { confirmToast } from '../components/ConfirmToast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Wrench, Search, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    icon: 'Wrench',
    estimated_time: '1-2 jam',
    is_active: 1
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SERVICES.LIST, { page, limit, search });
      if (res.success) {
        setServices(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Gagal memuat layanan');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 300); // 300ms debounce as required by rules
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        icon: service.icon || 'Wrench',
        estimated_time: service.estimated_time || '1-2 jam',
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', icon: 'Wrench', estimated_time: '1-2 jam', is_active: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await request.put(API_ENDPOINTS.SERVICES.UPDATE(editingService.id), formData);
        toast.success('Layanan berhasil diperbarui');
      } else {
        await request.post(API_ENDPOINTS.SERVICES.CREATE, formData);
        toast.success('Layanan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      toast.error('Gagal menyimpan layanan');
    }
  };

  const handleDelete = (id) => {
    confirmToast('Apakah Anda yakin ingin menghapus layanan ini?', async () => {
      try {
        await request.delete(API_ENDPOINTS.SERVICES.DELETE(id));
        toast.success('Layanan berhasil dihapus');
        fetchServices();
      } catch (err) {
        toast.error('Gagal menghapus layanan');
      }
    });
  };

  return (
    <DashboardLayout title="Manajemen Layanan Jasa Listrik">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Search & Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari layanan (min 300ms debounce)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#ff6600] hover:bg-[#e05500] text-white font-semibold text-xs px-5 py-2.5 rounded-full flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Layanan</span>
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-700 text-sm font-semibold">
                <th className="py-3 px-4">Nama Layanan</th>
                <th className="py-3 px-4">Harga Jasa</th>
                <th className="py-3 px-4">Estimasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Memuat data layanan...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Tidak ada layanan ditemukan</td>
                </tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{srv.name}</div>
                      <div className="text-xs text-gray-500 font-normal">{srv.description}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">
                      Rp {parseFloat(srv.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{srv.estimated_time}</td>
                    <td className="py-3 px-4">
                      {srv.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(srv)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
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

      {/* Create / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Layanan</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Perbaikan Saklar Lampu"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Harga (Rp)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="100000"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estimasi Waktu</label>
              <input
                type="text"
                value={formData.estimated_time}
                onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                placeholder="1-2 jam"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active === 1}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Layanan Aktif</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#ff6600] text-white rounded-full hover:bg-[#e05500] shadow-sm"
            >
              Simpan Layanan
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
