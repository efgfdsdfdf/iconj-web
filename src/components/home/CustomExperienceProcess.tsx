"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Ruler, Settings, Truck } from "lucide-react";

const steps = [
  {
    icon: Ruler,
    title: "1. Measure",
    desc: "Follow our simple guide to measure your windows perfectly, or request a professional measurement.",
  },
  {
    icon: Settings,
    title: "2. Configure & Quote",
    desc: "Select fabrics, mounts, and motorization. Instantly submit for a guaranteed custom quote.",
  },
  {
    icon: Truck,
    title: "3. Relax & Receive",
    desc: "Approve your quote and we'll craft and deliver your custom treatments nationwide.",
  }
];

export function CustomExperienceProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="py-24 bg-white px-4 overflow-hidden" ref={containerRef}>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-2 block">The ICONJ Difference</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Tailored to perfection,<br/>delivered with ease.</h2>
        </motion.div>

        <div className="relative">
          {/* Animated Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 -translate-x-1/2 rounded-full" />
          <motion.div 
            className="absolute left-8 md:left-1/2 top-0 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 -translate-x-1/2 rounded-full origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-12 md:space-y-24 relative z-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              const Icon = step.icon;

              return (
                <div key={index} className="flex flex-col md:flex-row items-start md:items-center relative">
                  
                  {/* Desktop Left Side */}
                  <div className={`hidden md:block w-1/2 pr-12 text-right ${!isEven ? 'md:order-1 opacity-0' : ''}`}>
                    {isEven && (
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
                        <p className="text-slate-600 text-lg leading-relaxed">{step.desc}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Center Node */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-blue-100 shadow-xl flex items-center justify-center z-20 md:order-2`}
                  >
                    <Icon className="w-6 h-6 text-blue-600" />
                  </motion.div>

                  {/* Mobile & Desktop Right Side */}
                  <div className={`w-full md:w-1/2 pl-24 md:pl-12 ${isEven ? 'md:opacity-0' : 'md:order-3'}`}>
                    {/* On mobile, we always render this block. On desktop, we only render if !isEven */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className={isEven ? "md:hidden" : ""}
                    >
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">{step.desc}</p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
