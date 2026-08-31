"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Register Service Worker required for PWA installation
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed) {
      const dismissTime = parseInt(dismissed, 10);
      const now = new Date().getTime();
      if (now - dismissTime < 24 * 60 * 60 * 1000) return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      // Show iOS prompt after a short delay so it doesn't interrupt immediate load
      setTimeout(() => setIsVisible(true), 3000);
    } else {
      // Android / Chrome: wait for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setIsVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_install_dismissed", new Date().getTime().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-50 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/icon.svg" alt="ICONJ App" className="w-8 h-8" />
        </div>
        <div>
          <p className="font-bold text-sm">Install ICONJ App</p>
          {isIOS ? (
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              Tap <Share className="w-3 h-3 mx-0.5" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-slate-300 mt-0.5">Faster shopping & quick access.</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isIOS && (
          <Button 
            onClick={handleInstallClick} 
            size="sm" 
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold whitespace-nowrap h-8 px-3"
          >
            Install
          </Button>
        )}
        <button onClick={handleDismiss} className="text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
