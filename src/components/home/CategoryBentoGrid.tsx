"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CategoryBentoGrid({ categories }: { categories: any[] }) {
  // We'll map the top categories into a Bento layout.
  // We want ideally 4-6 categories for a nice bento.
  const displayCats = categories.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Explore the <br/>Collections</h2>
            <p className="text-slate-400 max-w-md text-lg">Curated styles to elevate every room in your home or office.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/shop" className="group inline-flex items-center text-blue-400 font-semibold hover:text-blue-700 transition-colors text-lg">
              View All Categories
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 grid-rows-[auto] md:grid-rows-2 gap-4 md:gap-6 min-h-[600px]"
        >
          {displayCats.map((cat, i) => {
            // Determine bento sizing
            // 0: Large (span 2 cols, 2 rows if possible, or just span 2 cols)
            // 1: Medium (span 1 col, 1 row)
            // etc
            let bentoClasses = "col-span-1 row-span-1";
            if (i === 0) bentoClasses = "col-span-2 md:row-span-2 min-h-[250px] md:min-h-full";
            else if (i === 1) bentoClasses = "col-span-1 md:row-span-1 min-h-[180px] md:min-h-[250px]";
            else if (i === 2) bentoClasses = "col-span-1 md:row-span-1 min-h-[180px] md:min-h-[250px]";
            // If more, they just stack. Let's stick to max 5 for a clean 3-col bento.
            if (i > 2) bentoClasses = "md:col-span-1 md:row-span-1 min-h-[250px] hidden md:block";

            return (
              <motion.div key={cat.name} variants={itemVariants} className={`relative group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-[0_0_15px_rgba(255,255,255,0.05)] ${bentoClasses}`}>
                <Link href={`/shop?category=${encodeURIComponent(cat.name)}`} className="absolute inset-0 z-20">
                  <span className="sr-only">Shop {cat.name}</span>
                </Link>
                
                {/* Image */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                  <motion.img 
                    src={cat.img} 
                    alt={cat.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-8">
                  <h3 className="text-white text-2xl md:text-3xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{cat.name}</h3>
                  <p className="text-slate-300 text-sm md:text-base opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 line-clamp-2">
                    {cat.desc}
                  </p>
                  
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowRight className="w-5 h-5 text-white -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
