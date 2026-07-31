import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Wrench, Calendar, MapPin, User, CheckCircle, Navigation, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerCreateOrder = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [techSearch, setTechSearch] = useState('');
  const [userGps, setUserGps] = useState(null);

  const [formData, setFormData] = useState({
    service_id: '',
    technician_id: '',
    address: '',
    notes: '',
    scheduled_at: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTechniciansData(userGps?.lat, userGps?.lng, techSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [techSearch]);

  useEffect(() => {
    fetchInitialServices();
    fetchTechniciansData();
  }, []);

  const fetchInitialServices = async () => {
    try {
      const srvRes = await request.get(API_ENDPOINTS.SERVICES.LIST, { active_only: 'true', limit: 50 });
      if (srvRes.success) setServices(srvRes.data);
    } catch (err) {
      toast.error('Gagal mengambil data layanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechniciansData = async (userLat = null, userLng = null, search = '') => {
    try {
      const params = { available_only: 'true', limit: 50 };
      if (userLat && userLng) {
        params.lat = userLat;
        params.lng = userLng;
      }
      if (search) {
        params.search = search;
      }
      const techRes = await request.get(API_ENDPOINTS.TECHNICIANS.LIST, params);
      if (techRes.success) setTechnicians(techRes.data);
    } catch (err) {
      toast.error('Gagal mengambil data teknisi');
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Mendeteksi GPS Anda untuk mengurutkan teknisi terdekat...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.dismiss();
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserGps({ lat, lng });
          toast.success('Teknisi berhasil diurutkan berdasarkan jarak terdekat!');
          fetchTechniciansData(lat, lng, techSearch);
        },
        () => {
          toast.dismiss();
          toast.error('Gagal mengakses GPS');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.service_id || !formData.technician_id) {
      toast.error('Pilih layanan dan teknisi terlebih dahulu');
      return;
    }

    try {
      const res = await request.post(API_ENDPOINTS.ORDERS.CREATE, formData);
      if (res.success) {
        toast.success(`Pesanan #${res.order_code} berhasil dibuat!`);
        navigate('/customer/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    }
  };

  const selectedServiceObj = services.find(s => s.id === parseInt(formData.service_id));

  return (
    <DashboardLayout title="Pesan Jasa Teknisi Listrik">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-slate-900 pb-4 border-b">Form Pemesanan Jasa</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Service */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">1. Pilih Layanan Listrik</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setFormData({ ...formData, service_id: srv.id })}
                  className={`
                    p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-2
                    ${formData.service_id === srv.id ? 'border-emerald-600 bg-emerald-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200'}
                  `}
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{srv.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{srv.description}</p>
                  </div>
                  <div className="font-extrabold text-emerald-600">
                    Rp {parseFloat(srv.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Select Technician */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-sm font-bold text-slate-800">2. Pilih Teknisi Aktif (Tersedia & Deposit Cukup)</label>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Input Box */}
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama / area..."
                    value={techSearch}
                    onChange={(e) => setTechSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-full focus:ring-2 focus:ring-[#109648] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-xs bg-[#e8f5ed] text-[#109648] hover:bg-[#109648] hover:text-white font-bold px-3.5 py-1.5 rounded-full transition flex items-center justify-center space-x-1.5 whitespace-nowrap"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Urutkan Terdekat via GPS</span>
                </button>
              </div>
            </div>
            {technicians.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-xl">
                Saat ini belum ada teknisi aktif dengan saldo deposit mencukupi.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technicians.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setFormData({ ...formData, technician_id: t.id })}
                    className={`
                      p-4 rounded-2xl border-2 cursor-pointer transition flex items-center space-x-3 justify-between
                      ${formData.technician_id === t.id ? 'border-emerald-600 bg-emerald-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#109648] font-bold text-white flex items-center justify-center flex-shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{t.name}</h4>
                        <p className="text-xs text-gray-500">Area: {t.working_area || 'Umum'}</p>
                        <div className="text-xs text-emerald-600 font-semibold">⭐ {parseFloat(t.rating_avg || 5).toFixed(1)}</div>
                      </div>
                    </div>

                    {t.distance_km !== undefined && (
                      <span className="text-[11px] font-extrabold text-[#ff6600] bg-[#fff0e6] px-2.5 py-1 rounded-full whitespace-nowrap">
                        {parseFloat(t.distance_km).toFixed(1)} km
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Address & Schedule */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">3. Alamat Lengkap & Catatan Lokasi</label>
              <textarea
                required
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Mawar No. 12, RT 01/02 (Pagar Hitam, Samping Alfamart)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">4. Tanggal & Jam Pengerjaan</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">Total Pembayaran Jasa (Bayar di Tempat):</span>
              <div className="text-2xl font-extrabold text-emerald-600">
                Rp {selectedServiceObj ? parseFloat(selectedServiceObj.price).toLocaleString() : '0'}
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-600/20 transition"
            >
              Kirim Pesanan Sekarang
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
