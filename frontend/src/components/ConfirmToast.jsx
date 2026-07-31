import React from 'react';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const confirmToast = (message, onConfirm) => {
  toast((t) => (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-2 text-amber-600 font-semibold">
        <ShieldAlert className="w-5 h-5" />
        <span>Konfirmasi Tindakan</span>
      </div>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1 text-xs bg-red-600 text-white font-medium rounded hover:bg-red-700 shadow-sm"
        >
          Ya, Lanjutkan
        </button>
      </div>
    </div>
  ), { duration: 6000 });
};
