"use client";

import { motion } from "framer-motion";

const items = [
  "Custom Measurements",
  "Nationwide Delivery",
  "Premium Fabrics",
  "Guaranteed Fit",
  "Expert Craftsmanship",
  "Secure Payments",
];

export function InfiniteMarquee() {
  return (
    <section className="py-12 bg-slate-900 overflow-hidden relative">
      {/* Gradients for fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent z-10" />

      <div className="flex w-fit">
        <motion.div
          animate={{ x: [0, -1035] }} // -1035 is an arbitrary width, we can use 50% translation if we duplicate perfectly
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex whitespace-nowrap gap-12 px-6 items-center"
        >
          {/* We render the list 4 times to ensure it never runs out of screen space on wide monitors */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              {items.map((item, j) => (
                <div key={j} className="flex items-center gap-12">
                  <span className="text-xl md:text-2xl font-medium text-slate-400 uppercase tracking-widest">{item}</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
