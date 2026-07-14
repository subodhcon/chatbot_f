"use client";

import { useEffect, useState } from "react";
import { Download, X, WifiOff } from "lucide-react";

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Register Service Worker
      if ("serviceWorker" in navigator) {
        const registerSW = () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("[PWA] Service Worker registered successfully:", registration.scope);
            })
            .catch((error) => {
              console.warn("[PWA] Service Worker registration failed:", error);
            });
        };

        if (document.readyState === "complete") {
          registerSW();
        } else {
          window.addEventListener("load", registerSW);
        }
      }

      // 2. Listen for BeforeInstallPrompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // 3. Monitor Online/Offline Status
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      // Set initial offline state
      setIsOffline(!navigator.onLine);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User installation choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismissClick = () => {
    setShowBanner(false);
  };

  return (
    <>
      {/* 1. Offline Mode Visual Alert Indicator */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-amber-600 border border-amber-500 text-white px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(217,119,6,0.3)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider">
            <WifiOff className="h-3.5 w-3.5 animate-pulse" />
            <span>Offline Mode: Using cached data</span>
          </div>
        </div>
      )}

      {/* 2. Custom Install Prompt Banner */}
      {showBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Download className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold tracking-tight">Install Admin Panel</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Install this application on your device for instant launch, and custom notifications.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
                >
                  Install Now
                </button>
                <button
                  onClick={handleDismissClick}
                  className="text-slate-400 hover:text-white text-[10px] font-semibold px-2 py-1.5 transition cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            <button 
              onClick={handleDismissClick}
              className="text-slate-500 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
