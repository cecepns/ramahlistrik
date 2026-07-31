import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Wrench, Phone, Star, MapPin, UserCheck, Search } from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';

// Custom Leaflet DivIcon for User Position ("Lokasi Kamu")
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="flex flex-col items-center group cursor-pointer">
        <div class="bg-red-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap flex items-center space-x-1 animate-bounce">
          <span>📍 Lokasi Kamu</span>
        </div>
        <div class="w-3 h-3 bg-red-600 border-2 border-white rounded-full -mt-1 shadow-md"></div>
      </div>
    `,
    iconSize: [100, 40],
    iconAnchor: [50, 40],
    popupAnchor: [0, -40]
  });
};

// Custom Leaflet DivIcon for Technician Position (Icon User + Nama Teknisi + Jarak Badge)
const createTechnicianMarkerIcon = (name, distanceKm) => {
  const distText = distanceKm !== undefined ? `${parseFloat(distanceKm).toFixed(1)} km` : '';
  const initial = name ? name.charAt(0).toUpperCase() : 'T';

  return L.divIcon({
    className: 'custom-tech-marker',
    html: `
      <div class="flex flex-col items-center group cursor-pointer transform hover:scale-110 transition duration-200">
        <!-- Label Badge: Nama Teknisi & Jarak -->
        <div class="bg-slate-900/90 backdrop-blur-md text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-xl border border-emerald-500/50 flex items-center space-x-1.5 whitespace-nowrap">
          <span class="text-white">${name}</span>
          ${distText ? `<span class="bg-[#ff6600] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">${distText}</span>` : ''}
        </div>
        <!-- Pin Circle with Technician Avatar -->
        <div class="w-8 h-8 rounded-full bg-[#109648] text-white border-2 border-white shadow-lg flex items-center justify-center font-extrabold text-xs -mt-1">
          ${initial}
        </div>
        <div class="w-2 h-2 bg-[#109648] rotate-45 -mt-1.5 border-r border-b border-white"></div>
      </div>
    `,
    iconSize: [140, 50],
    iconAnchor: [70, 50],
    popupAnchor: [0, -50]
  });
};

// Helper component to center Leaflet map smoothly
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export const TechnicianMapSection = () => {
  // Default Center: Jakarta Indonesia (-6.200000, 106.816666)
  const [userLocation, setUserLocation] = useState({ lat: -6.200000, lng: 106.816666 });
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNearbyTechnicians(userLocation.lat, userLocation.lng, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchNearbyTechnicians = async (lat, lng, query = '') => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TECHNICIANS.LIST, {
        available_only: 'true',
        lat,
        lng,
        search: query,
        limit: 50 // Max 50 data teknisi terdekat
      });
      if (res.success) {
        setTechnicians(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectUserLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Mendeteksi posisi Anda...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.dismiss();
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          setHasLocation(true);
          toast.success('Lokasi berhasil dideteksi!');
          fetchNearbyTechnicians(lat, lng);
        },
        (err) => {
          toast.dismiss();
          toast.error('Gagal mengambil lokasi GPS. Menampilkan lokasi default.');
        }
      );
    } else {
      toast.error('Browser Anda tidak mendukung lokasi GPS');
    }
  };

  return (
    <section id="peta-teknisi" className="py-12 bg-white border-t border-b border-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header Title & Real-Time Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#e8f5ed] text-[#109648] px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Live Maps (Maks. 50 Teknisi Terdekat)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Teknisi Aktif di Sekitar Anda</h2>
            <p className="text-slate-500 text-xs">Cari teknisi berdasarkan nama atau alamat area kerja terdekat.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Realtime Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari nama / alamat teknisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-[#109648] focus:outline-none bg-slate-50/50"
              />
            </div>

            <button
              onClick={handleDetectUserLocation}
              className="bg-[#109648] hover:bg-[#0b7838] text-white font-bold text-xs px-5 py-2.5 rounded-full transition shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <Navigation className="w-4 h-4" />
              <span>{hasLocation ? 'Perbarui GPS' : 'Cari via GPS Saya'}</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map & Nearby List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Map View */}
          <div className="lg:col-span-2 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-lg h-[440px] relative z-10">
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={12}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <RecenterMap center={[userLocation.lat, userLocation.lng]} />

              {/* Custom Marker Posisi Kamu */}
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationIcon()}>
                <Popup>
                  <div className="text-xs font-sans p-1">
                    <strong className="text-red-600 block text-sm">📍 Lokasi Kamu</strong>
                    <span>Titik pusat pencarian teknisi terdekat</span>
                  </div>
                </Popup>
              </Marker>

              {/* Custom Marker Teknisi (Nama + Avatar + Jarak) */}
              {technicians.map((tech) => {
                if (!tech.latitude || !tech.longitude) return null;
                const lat = parseFloat(tech.latitude);
                const lng = parseFloat(tech.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker
                    key={tech.id}
                    position={[lat, lng]}
                    icon={createTechnicianMarkerIcon(tech.name, tech.distance_km)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 font-sans text-xs max-w-xs">
                        <h4 className="font-extrabold text-slate-900 text-sm">{tech.name}</h4>
                        <div className="text-[#109648] font-bold">⭐ {parseFloat(tech.rating_avg || 5).toFixed(1)} ({tech.rating_count || 0} ulasan)</div>
                        <div className="text-slate-600">Area: {tech.working_area || 'Umum'}</div>
                        {tech.distance_km !== undefined && (
                          <div className="text-[#ff6600] font-extrabold text-xs">
                            Jarak: {parseFloat(tech.distance_km).toFixed(1)} km dari Lokasi Kamu
                          </div>
                        )}
                        <a
                          href={`https://wa.me/${tech.phone?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 bg-[#ff6600] !text-white font-bold px-4 py-1.5 rounded-full text-center hover:bg-[#e05500] shadow-sm !no-underline text-xs"
                          style={{ color: '#ffffff', textDecoration: 'none' }}
                        >
                          Hubungi Teknisi
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Nearby Technicians List Card */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 max-h-[440px] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-900 border-b pb-2">
              Daftar Teknisi Terdekat ({technicians.filter(t => t.latitude && t.longitude).length})
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat lokasi teknisi...</div>
            ) : technicians.filter(t => t.latitude && t.longitude).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Belum ada teknisi aktif dengan lokasi GPS terdaftar di area ini.
              </div>
            ) : (
              <div className="space-y-3">
                {technicians
                  .filter(t => t.latitude && t.longitude)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setUserLocation({ lat: parseFloat(t.latitude), lng: parseFloat(t.longitude) })}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#109648] hover:shadow-md transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{t.working_area || t.address || 'Umum'}</p>
                        <div className="text-[11px] text-[#109648] font-bold">⭐ {parseFloat(t.rating_avg || 5).toFixed(1)}</div>
                      </div>

                      {t.distance_km !== undefined && (
                        <div className="text-right">
                          <span className="text-[11px] font-extrabold text-[#ff6600] bg-[#fff0e6] px-2.5 py-1 rounded-full border border-[#ff6600]/20">
                            {parseFloat(t.distance_km).toFixed(1)} km
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
