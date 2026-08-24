"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user already dismissed it recently
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed) {
      const dismissTime = parseInt(dismissed, 10);
      const now = new Date().getTime();
      // If dismissed less than 24 hours ago, don't show
      if (now - dismissTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    
    // Whether they accepted or rejected the OS prompt, the deferredPrompt is consumed.
    // We must hide our banner because the button will no longer work without a refresh.
    setIsVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that the user dismissed it so we don't spam them
    localStorage.setItem("pwa_install_dismissed", new Date().getTime().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
          <Download className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-sm">Install the ICONJ App</p>
          <p className="text-xs text-blue-100 hidden sm:block">Get faster access and a better shopping experience.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleInstallClick} 
          size="sm" 
          className="bg-white text-blue-700 hover:bg-blue-50 font-bold whitespace-nowrap"
        >
          Install Now
        </Button>
        <button onClick={handleDismiss} className="text-blue-200 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
