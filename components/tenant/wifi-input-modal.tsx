"use client";

import { useState } from "react";
import { X } from "lucide-react";

type WifiInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (wifiName: string, wifiPassword: string) => void;
};

export function WifiInputModal({ isOpen, onClose, onConfirm }: WifiInputModalProps) {
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(wifiName.trim(), wifiPassword.trim());
    setWifiName("");
    setWifiPassword("");
  };

  const handleSkip = () => {
    onConfirm("", "");
    setWifiName("");
    setWifiPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Informasi WiFi (Opsional)</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          Masukkan informasi WiFi jika ingin dicetak di invoice. Kosongkan jika tidak ingin mencetak.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama WiFi</label>
            <input
              type="text"
              value={wifiName}
              onChange={(e) => setWifiName(e.target.value)}
              placeholder="Contoh: BrewHaven_WiFi"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password WiFi</label>
            <input
              type="text"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="Contoh: password123"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
          >
            Lanjut tanpa WiFi
          </button>
          <button
            onClick={handleConfirm}
            disabled={!wifiName.trim() || !wifiPassword.trim()}
            className="flex-1 cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 active:scale-95 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 disabled:active:scale-100"
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
}

