import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Wallet, PlusCircle, Clock, CheckCircle2, XCircle, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export const TechnicianDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [bankInfo, setBankInfo] = useState('');

  // Topup Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchBankInfo();
  }, []);

  const fetchBankInfo = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setBankInfo(res.data.bank_account || '');
      }
    } catch (err) { }
  };

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DEPOSITS.HISTORY, { page, limit });
      if (res.success) {
        setDeposits(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Gagal memuat histori deposit');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleSubmitTopup = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Masukkan nominal topup yang valid');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('notes', notes);
      if (proofFile) {
        formData.append('proof_image', proofFile);
      }

      const res = await request.post(API_ENDPOINTS.DEPOSITS.TOPUP_SUBMIT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        setAmount('');
        setNotes('');
        setProofFile(null);
        fetchDeposits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan top up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Manajemen & Histori Saldo Deposit">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#109648] text-white flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kelola Deposit Saldo</h3>
              <p className="text-xs text-gray-400">Transfer ke rekening admin lalu unggah bukti transfer untuk mengajukan saldo.</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#ff6600] hover:bg-[#e05500] text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-lg shadow-orange-500/20 flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajukan Top Up Deposit</span>
          </button>
        </div>

        {/* Bank Account Information Banner */}
        {bankInfo && (
          <div className="p-4 bg-[#e8f5ed] border border-[#109648]/30 rounded-2xl text-xs text-[#0b7838] space-y-1">
            <strong className="font-bold block text-sm">Info Rekening Tujuan Transfer Admin:</strong>
            <pre className="font-sans whitespace-pre-wrap font-medium">{bankInfo}</pre>
          </div>
        )}

        {/* Deposits Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-slate-700 text-sm font-semibold">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Tipe Transaksi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bukti / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Memuat riwayat deposit...</td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Belum ada riwayat transaksi deposit</td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(d.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3 px-4 font-bold ${d.type === 'topup' ? 'text-[#109648]' : 'text-red-600'}`}>
                        {d.type === 'topup' ? '+' : '-'} Rp {parseFloat(d.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold capitalize">
                        {d.type === 'topup' ? 'Top Up Deposit' : d.type === 'deduct_fee' ? 'Potongan Fee 10%' : 'Koreksi Admin'}
                      </td>
                      <td className="py-3 px-4">
                        {d.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Menunggu Verifikasi</span>
                        )}
                        {d.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Disetujui</span>
                        )}
                        {d.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">Ditolak</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div>{d.notes || '-'}</div>
                        {d.proof_image && (
                          <a
                            href={`https://api.kingcreativestudio.my.id/ramahlistrik${d.proof_image}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#109648] font-bold hover:underline block mt-0.5"
                          >
                            Lihat Bukti Transfer
                          </a>
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

      {/* Topup Submit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajukan Top Up Deposit Saldo"
      >
        <form onSubmit={handleSubmitTopup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal Top Up (Rp)</label>
            <input
              type="number"
              required
              min="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 50000"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Bukti Transfer</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setProofFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#e8f5ed] file:text-[#109648] hover:file:bg-[#109648] hover:file:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Transfer dari bank BCA a.n Budi Teknisi"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#109648] focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-[#ff6600] text-white rounded-full hover:bg-[#e05500] shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
