"use client";

import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function WhatsAppWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // You can replace this with your actual business WhatsApp number (e.g. '2348012345678')
  // Make sure it includes the country code without the '+' sign
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348000000000"; 
  const message = encodeURIComponent("Hi ICONJ Support! I need some help.");

  const handleClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg shadow-green-500/30 transition-transform hover:scale-105 active:scale-95"
      aria-label="Contact Support on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-current" />
      <span className="font-bold hidden sm:inline-block">Contact Support</span>
    </button>
  );
}
