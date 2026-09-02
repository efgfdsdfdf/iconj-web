import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Customization & Order Policy | ICONJ",
  description: "Customization & Order Policy for ICONJ - Customizable blinds, curtains & window accessories in Nigeria.",
};

export default function CustomizationPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900 mb-6 border-b pb-4">Customization & Order Policy</h1>
          
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p>
              At ICONJ, we coordinate the fulfillment of customizable window d�cor according to your exact specifications. 
              Please review our Customization & Order Policy below before placing your order.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">1. Fulfillment of Customized Orders</h2>
            <p>
              Customized orders are fulfilled strictly according to the specifications submitted by the customer during the checkout process. ICONJ coordinates with our trusted suppliers to ensure your order is prepared as requested.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">2. Customer Responsibilities</h2>
            <p>
              Customers are solely responsible for verifying that all measurements, dimensions, colours, styles, and customization selections are accurate before submitting an order. Please use our measurement guides if you are unsure.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">3. Cancellations & Returns</h2>
            <p>
              Because your order is customized to your specifications, customized products may have different cancellation and return conditions compared to standard, off-the-shelf products. Customized products cannot be returned or refunded for "change of mind" or incorrect measurements provided by the customer. Returns are only accepted for verifiable production defects or damages in transit.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">4. Additional Customization Fees</h2>
            <p>
              Additional customization fees may apply depending on the specific options selected (e.g., motorization, special fabrics). These fees will be displayed during the configuration and checkout process.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">5. Delivery & Shipping</h2>
            <p>
              Delivery timelines can vary depending on product fulfillment times and shipping locations. Final delivery and shipping charges will be calculated and displayed during checkout based on the applicable shipping rules.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">6. Installation Services</h2>
            <p>
              Please note that ICONJ currently provides the products only. Installation is not provided by ICONJ. Customers are responsible for arranging the installation of their customized products upon delivery.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
