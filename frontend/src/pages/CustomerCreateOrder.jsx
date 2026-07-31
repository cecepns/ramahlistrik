import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useAuth } from '../context/AuthContext';
import { Wrench, Calendar, MapPin, User, CheckCircle, Navigation, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerCreateOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [techSearch, setTechSearch] = useState('');
  const [userGps, setUserGps] = useState(null);

  const [formData, setFormData] = useState({
    service_id: '',
    technician_id: '',
    address: user?.address || '',
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
      toast.loading('Mendeteksi lokasi GPS Anda...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          toast.dismiss();
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserGps({ lat, lng });
          toast.success('Lokasi GPS berhasil didapatkan!');
          fetchTechniciansData(lat, lng, techSearch);

          // Reverse geocoding optional attempt
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.display_name) {
              setFormData(prev => ({ ...prev, address: geoData.display_name }));
            }
          } catch (e) {
            // silent fallback
          }
        },
        () => {
          toast.dismiss();
          toast.error('Gagal mengakses GPS device Anda');
        }
      );
    } else {
      toast.error('Browser Anda tidak mendukung Geolocation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.service_id) {
      toast.error('Pilih layanan listrik terlebih dahulu');
      return;
    }
    if (!formData.technician_id) {
      toast.error('Pilih teknisi terlebih dahulu');
      return;
    }
    if (!formData.address || !formData.address.trim()) {
      toast.error('Alamat lengkap wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.ORDERS.CREATE, formData);
      if (res.success) {
        toast.success(`Pesanan #${res.order_code} berhasil dibuat!`);
        navigate('/customer/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceObj = services.find(s => s.id === parseInt(formData.service_id));

  return (
    <DashboardLayout title="Pesan Jasa Teknisi Listrik">
      <div className="max-w-3xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Form Pemesanan Jasa</h2>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            Responsif & Mudah
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Service */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">1. Pilih Layanan Listrik *</label>
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Memuat daftar layanan...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((srv) => {
                  const isSelected = formData.service_id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setFormData(prev => ({ ...prev, service_id: srv.id }))}
                      className={`
                        p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 relative
                        ${isSelected ? 'border-[#109648] bg-emerald-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{srv.description}</p>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-[#109648] flex-shrink-0 ml-2" />}
                      </div>
                      <div className="font-extrabold text-[#109648] text-base">
                        Rp {parseFloat(srv.price).toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Technician */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-sm font-bold text-slate-800">2. Pilih Teknisi Listrik *</label>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative min-w-[200px]">
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
                  className="text-xs bg-[#e8f5ed] text-[#109648] hover:bg-[#109648] hover:text-white font-bold px-3 py-1.5 rounded-full transition flex items-center justify-center space-x-1.5 whitespace-nowrap"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Urutkan Terdekat via GPS</span>
                </button>
              </div>
            </div>

            {technicians.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded-2xl border border-amber-200">
                Saat ini belum ada teknisi aktif dengan saldo deposit mencukupi.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technicians.map((t) => {
                  const isSelected = formData.technician_id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setFormData(prev => ({ ...prev, technician_id: t.id }))}
                      className={`
                        p-4 rounded-2xl border-2 cursor-pointer transition flex items-center space-x-3 justify-between relative
                        ${isSelected ? 'border-[#109648] bg-emerald-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200'}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#109648] font-bold text-white flex items-center justify-center flex-shrink-0 text-sm">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">Area: {t.working_area || 'Umum'}</p>
                          <div className="text-xs text-[#109648] font-semibold">⭐ {parseFloat(t.rating_avg || 5).toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        {isSelected && <CheckCircle className="w-5 h-5 text-[#109648]" />}
                        {t.distance_km !== null && t.distance_km !== undefined && !isNaN(parseFloat(t.distance_km)) && (
                          <span className="text-[10px] font-extrabold text-[#ff6600] bg-[#fff0e6] px-2 py-0.5 rounded-full whitespace-nowrap">
                            {parseFloat(t.distance_km).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Address & Schedule */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label htmlFor="order-address" className="block text-sm font-bold text-slate-800">
                  3. Alamat Lengkap & Catatan Lokasi *
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-xs text-[#109648] hover:underline font-semibold flex items-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Isi Alamat dari GPS Saya</span>
                </button>
              </div>
              <textarea
                id="order-address"
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, address: val }));
                }}
                placeholder="Tuliskan nama jalan, nomor rumah, RT/RW, dan patokan lokasi (misal: Samping Indomaret)..."
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#109648] focus:outline-none text-sm text-slate-800 placeholder-gray-400 bg-white relative z-10 block"
              ></textarea>
            </div>

            <div>
              <label htmlFor="order-schedule" className="block text-sm font-bold text-slate-800 mb-1.5">
                4. Tanggal & Jam Pengerjaan *
              </label>
              <input
                id="order-schedule"
                type="datetime-local"
                required
                value={formData.scheduled_at}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#109648] focus:outline-none text-sm text-slate-800 bg-white block"
              />
            </div>
          </div>

          {/* Summary & Submit Button (Fixed Mobile Responsive Layout) */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs text-gray-500 font-medium">Total Pembayaran Jasa (Bayar di Tempat):</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#109648]">
                Rp {selectedServiceObj ? parseFloat(selectedServiceObj.price).toLocaleString('id-ID') : '0'}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-[#109648] hover:bg-[#0c7a3a] text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50"
            >
              <span>{submitting ? 'Memproses Pesanan...' : 'Kirim Pesanan Sekarang'}</span>
              <Send className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
