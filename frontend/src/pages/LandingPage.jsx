import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Wrench, ArrowRight } from 'lucide-react';
import heroImg from '../assets/hero.png';
import { TechnicianMapSection } from '../components/TechnicianMapSection';

export const LandingPage = ({ defaultSection }) => {
  useEffect(() => {
    if (defaultSection) {
      const elem = document.getElementById(defaultSection);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [defaultSection]);

  const services = [
    { name: 'Servis Instalasi Ringan', price: 'Rp 75.000', time: '1 Jam', desc: 'Perbaikan saklar, stop kontak, atau fitting lampu yang bermasalah.' },
    { name: 'Pemasangan Instalasi Baru', price: 'Rp 120.000', time: '2-3 Jam', desc: 'Pemasangan titik lampu atau stop kontak baru per titik.' },
    { name: 'Survey & Korsleting', price: 'Rp 100.000', time: '1-2 Jam', desc: 'Pemeriksaan jalur kabel utama yang menyebabkan listrik anjlok/korslet.' },
    { name: 'Pemasangan MCB / Panel', price: 'Rp 150.000', time: '2 Jam', desc: 'Penggantian MCB yang rusak atau penambahan box panel listrik.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <Navbar />

      {/* Hero Section - 2 Columns Layout with hero.png on Right */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-2 md:gap-12 items-center">
          {/* Left Column: Text & CTA Buttons */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-[#e8f5ed] text-[#109648] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
              <span>Layanan Listrik Digital Terpercaya</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
              Urus Masalah Listrik Kini <span className="text-[#109648]">Lebih</span> <span className="text-[#ff6600]">Mudah</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed max-w-lg mx-auto md:mx-0">
              Sistem digital terpadu Ramah Listrik untuk membantu Anda mendapatkan layanan teknisi listrik profesional secara online tanpa perlu antre panjang.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Link
                to="/customer/create-order"
                className="w-full sm:w-auto bg-[#ff6600] hover:bg-[#e05500] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2"
              >
                <span>Pesan Teknisi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-7 py-3.5 rounded-full text-sm transition text-center"
              >
                Masuk Akun
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="flex justify-center items-center">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <img
                src={heroImg}
                alt="Ramah Listrik Hero Illustration"
                className="w-full h-auto object-contain drop-shadow-md rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live Leaflet GPS Map Section for Nearby Technicians */}
      <TechnicianMapSection />

      {/* Services Section - Compact Padding & Premium Cards with Cover Placeholder */}
      <section id="layanan" className="py-10 bg-slate-50 border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Layanan Utama Kami</h2>
            <p className="text-slate-500 text-xs">Pilih jenis layanan teknisi listrik sesuai kebutuhan Anda.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {/* Cover Image Placeholder with Centered Icon */}
                <div className="h-32 bg-gradient-to-br from-[#e8f5ed] to-[#fff0e6] relative flex items-center justify-center border-b border-slate-100/60">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#109648] group-hover:scale-110 group-hover:bg-[#109648] group-hover:text-white transition duration-300">
                    <Wrench className="w-7 h-7" />
                  </div>
                  <span className="absolute top-2.5 right-2.5 text-[10px] bg-white/90 backdrop-blur-sm text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-100">
                    {srv.time}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-[#109648] transition">
                      {srv.name}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Mulai dari</span>
                    <span className="font-extrabold text-[#ff6600] text-base">
                      {srv.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-20 max-w-5xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Cara Mudah Menggunakan Jasa</h2>
          <p className="text-slate-600 text-sm">Proses pengajuan cepat dalam 4 langkah sederhana.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e8f5ed] text-[#109648] font-bold text-lg flex items-center justify-center mx-auto">1</div>
            <h4 className="font-bold text-slate-900 text-base">Pilih Layanan</h4>
            <p className="text-slate-500 text-xs">Tentukan jenis perbaikan atau instalasi listrik.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#fff0e6] text-[#ff6600] font-bold text-lg flex items-center justify-center mx-auto">2</div>
            <h4 className="font-bold text-slate-900 text-base">Pilih Teknisi</h4>
            <p className="text-slate-500 text-xs">Pilih teknisi aktif terdekat di wilayah Anda.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e8f5ed] text-[#109648] font-bold text-lg flex items-center justify-center mx-auto">3</div>
            <h4 className="font-bold text-slate-900 text-base">Pengerjaan</h4>
            <p className="text-slate-500 text-xs">Teknisi memproses perbaikan sesuai jadwal.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#fff0e6] text-[#ff6600] font-bold text-lg flex items-center justify-center mx-auto">4</div>
            <h4 className="font-bold text-slate-900 text-base">Selesai & Bayar</h4>
            <p className="text-slate-500 text-xs">Pembayaran langsung ke teknisi tanpa komisi tambahan.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700">Ramah Listrik</p>
          <p>© 2026 Ramah Listrik Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
