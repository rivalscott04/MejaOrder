"use client";

import { useState, useEffect } from "react";
import { Wrench, Clock } from "lucide-react";

type MaintenancePageProps = {
  message?: string | null;
  estimatedCompletionAt?: string | null;
  tenantName?: string;
  tenantLogo?: string | null;
};

export function MaintenancePage({
  message,
  estimatedCompletionAt,
  tenantName,
  tenantLogo,
}: MaintenancePageProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!estimatedCompletionAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const completion = new Date(estimatedCompletionAt).getTime();
      const difference = completion - now;

      if (difference <= 0) {
        setTimeRemaining("Maintenance selesai");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}h ${hours}j ${minutes}m ${seconds}d`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}d`);
      } else {
        setTimeRemaining(`${seconds}d`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [estimatedCompletionAt]);

  const defaultMessage =
    "Sistem sedang dalam pemeliharaan. Kami akan kembali segera. Terima kasih atas pengertian Anda.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        {tenantLogo && (
          <div className="mb-8 flex justify-center">
            <img src={tenantLogo} alt={tenantName || "Logo"} className="h-24 w-auto object-contain" />
          </div>
        )}

        {/* Icon & SVG Illustration */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-amber-100 p-6">
              <Wrench className="h-16 w-16 text-amber-600" />
            </div>
            {/* SVG Maintenance Illustration */}
            <svg
              className="absolute -right-4 -top-4 h-24 w-24 text-amber-200"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
              <path
                d="M30 50 L45 50 M55 50 L70 50 M50 30 L50 45 M50 55 L50 70"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
          Sedang Dalam Pemeliharaan
        </h1>

        {/* Message */}
        <p className="mb-8 text-lg text-slate-600 md:text-xl">
          {message || defaultMessage}
        </p>

        {/* SVG Maintenance Illustration */}
        <div className="mb-8 flex justify-center">
          <svg
            className="h-64 w-64 text-amber-200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle */}
            <circle cx="100" cy="100" r="90" fill="currentColor" opacity="0.1" />
            
            {/* Gear 1 */}
            <g transform="translate(50, 50)">
              <circle cx="0" cy="0" r="25" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.4" />
              <circle cx="0" cy="0" r="15" fill="currentColor" opacity="0.2" />
              <path
                d="M-25 0 L-35 0 M25 0 L35 0 M0 -25 L0 -35 M0 25 L0 35 M-17.7 -17.7 L-25 -25 M17.7 17.7 L25 25 M-17.7 17.7 L-25 25 M17.7 -17.7 L25 -25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            </g>
            
            {/* Gear 2 */}
            <g transform="translate(150, 150)">
              <circle cx="0" cy="0" r="25" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.4" />
              <circle cx="0" cy="0" r="15" fill="currentColor" opacity="0.2" />
              <path
                d="M-25 0 L-35 0 M25 0 L35 0 M0 -25 L0 -35 M0 25 L0 35 M-17.7 -17.7 L-25 -25 M17.7 17.7 L25 25 M-17.7 17.7 L-25 25 M17.7 -17.7 L25 -25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            </g>
            
            {/* Wrench Icon in Center */}
            <g transform="translate(100, 100)">
              <path
                d="M-20 -30 L-10 -20 L10 -20 L20 -30 L20 -10 L10 0 L-10 0 L-20 -10 Z"
                fill="currentColor"
                opacity="0.3"
              />
              <rect x="-3" y="0" width="6" height="20" fill="currentColor" opacity="0.4" />
            </g>
          </svg>
        </div>

        {/* Countdown */}
        {estimatedCompletionAt && timeRemaining && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-6 py-3">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              Estimasi selesai: <span className="font-bold">{timeRemaining}</span>
            </span>
          </div>
        )}

        {/* Footer */}
        <p className="text-sm text-slate-500">
          {tenantName && `${tenantName} - `}Kami mohon maaf atas ketidaknyamanannya
        </p>
      </div>
    </div>
  );
}

