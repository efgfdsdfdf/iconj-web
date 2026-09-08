"use client";

import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FeaturedShowcase({ products }: { products: any[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-24 bg-slate-950 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm mb-2 block">Trending</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Featured Treatments</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Link href="/shop" className="group inline-flex items-center text-blue-400 font-semibold hover:text-blue-300 transition-colors text-lg">
              Shop All
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="h-full"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
