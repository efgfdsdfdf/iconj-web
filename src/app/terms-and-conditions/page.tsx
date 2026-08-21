import { Scale } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | ICONJ",
  description: "Terms and conditions for using ICONJ.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-slate-800 mb-4">
            <Scale className="w-8 h-8" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
          </div>
          <p className="text-slate-500">Last Updated: [DATE]</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-10 text-slate-700 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p>These Terms and Conditions govern your use of the ICONJ website and the purchase of any products from it. By accessing our website or placing an order, you agree to be bound by these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Products & Pricing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Product Information:</strong> We strive to display product colors and configurations accurately, but we cannot guarantee that your device's display will accurately reflect the real color of the products.</li>
              <li><strong>Custom Configurations:</strong> Many of our products (such as nursery bundles\) are custom-made to your specific dimensions. It is your responsibility to ensure all sizes and options selected during checkout are accurate.</li>
              <li><strong>Pricing:</strong> All prices are in Naira (?) unless stated otherwise. Product availability and final pricing for "Request a Quote" items are subject to supplier confirmation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Orders & Fulfillment</h2>
            <p className="mb-2">ICONJ operates by partnering directly with global manufacturers and suppliers.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Order Acceptance:</strong> Your order constitutes an offer to us to buy a product. All orders are subject to acceptance by us and availability from our suppliers.</li>
              <li><strong>Supplier Fulfillment:</strong> Because products are shipped directly from our manufacturing partners, delivery times may vary based on your location in Nigeria and the supplier's processing time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Shipping & Delivery</h2>
            <p>We aim to deliver products within the estimated timeframes provided at checkout. However, delays can occasionally occur due to unforeseen circumstances (e.g., customs clearance, courier delays). ICONJ is not liable for any delay in delivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Returns & Replacements</h2>
            <p>Our return and replacement policies are strictly governed by our <Link href="/returns" className="text-blue-600 hover:underline">Returns & Replacement Policy</Link>. Because many items are custom-configured, automatic refunds are not guaranteed for customer measurement errors.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Contact Us</h2>
            <p>For any legal or terms-related inquiries, please contact:</p>
            <div className="bg-slate-50 p-4 rounded-lg mt-4 border">
              <p><strong>Email:</strong> [ICONJ SUPPORT EMAIL]</p>
              <p><strong>Business Name:</strong> [ICONJ LEGAL BUSINESS NAME]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


