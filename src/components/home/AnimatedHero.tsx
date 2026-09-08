"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cpu, Ruler, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AnimatedHero() {
  const textVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
  };

  return (
    <section className="relative h-[100vh] min-h-[700px] w-full flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* Minimal Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] group-hover:bg-blue-500 transition-colors">
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight drop-shadow-md">ICONJ</span>
        </Link>
      </motion.div>

      {/* FUTURISTIC BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {/* Base Image with deep blend */}
        <motion.img 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 20, ease: "easeOut" }}
          src="/images/zebra_blinds_hero.jpg" 
          alt="Premium Window Blinds" 
          className="w-full h-full object-cover object-center mix-blend-overlay"
        />
        
        {/* Animated Grid Floor */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Animated Moving Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, -50, 0], 
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 50, 0], 
            y: [0, 50, -50, 0],
            scale: [1, 0.8, 1.2, 1]
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-emerald-500/20 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

      {/* FLOATING GLASS PILLS (Futuristic UI Elements) */}
      <motion.div 
        animate={{ y: [-10, 10, -10] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] md:left-[20%] z-30 hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/80 text-sm shadow-[0_0_30px_rgba(59,130,246,0.2)]"
      >
        <Cpu className="w-4 h-4 text-blue-400" /> Smart Motorization
      </motion.div>

      <motion.div 
        animate={{ y: [10, -10, 10] }} 
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[30%] right-[5%] md:right-[15%] z-30 hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/80 text-sm shadow-[0_0_30px_rgba(16,185,129,0.2)]"
      >
        <Ruler className="w-4 h-4 text-emerald-400" /> Laser Precision
      </motion.div>

      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center mt-12">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium tracking-wide uppercase shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next-Gen Window Treatments
        </motion.div>

        <motion.h1 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="text-5xl md:text-7xl lg:text-[6rem] font-black text-white tracking-tighter mb-6 leading-[1.1]"
        >
          ENGINEERED FOR <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 animate-gradient bg-[length:200%_auto]">
            YOUR SPACE.
          </span>
        </motion.h1>

        <motion.p 
          custom={2}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
        >
          Experience the future of interior design. Custom-fitted, motorized blinds and luxurious curtains tailored to the millimeter.
        </motion.p>

        <motion.div 
          custom={3}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center"
        >
          <Button asChild size="lg" className="relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-14 text-lg w-full sm:w-auto transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]">
            <Link href="/shop">
              <span className="relative z-10 flex items-center">
                Explore Collection <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0" />
            </Link>
          </Button>
          
          <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-white/5 backdrop-blur-md border-white/10 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto transition-transform hover:scale-105 active:scale-95">
            <Link href="/quote">
              Configure Custom
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Futuristic Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
      >
        <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
          <motion.div 
            animate={{ y: [-64, 64] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-400 to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
}
