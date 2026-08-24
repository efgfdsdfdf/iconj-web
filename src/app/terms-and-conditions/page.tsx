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
            <Scale className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
          </div>
          <p className="text-slate-500 font-medium">Last Updated: August 24, 2026</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-10 prose prose-slate max-w-none text-slate-700">
          <p>
            Welcome to ICONJ. These Terms and Conditions govern your use of the ICONJ marketplace platform, operated by <strong>ICONJ Global Services</strong>. By accessing our platform, registering as a buyer, seller, or supplier, or making a purchase, you agree to be bound by these terms.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">1. Introduction</h2>
          <p>
            ICONJ Global Services operates a multi-vendor marketplace specializing in Blinds, Curtains, and Window Treatments. We connect customers with manufacturers, wholesalers, installers, and independent sellers.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">2. Seller & Supplier Agreements</h2>
          <p>
            By registering as a Seller, Manufacturer, or Supplier on ICONJ, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
            <li>Provide accurate representations, custom measurement rules, and pricing for your products.</li>
            <li>Fulfill accepted dropshipping or wholesale orders within the agreed lead times.</li>
            <li>Allow ICONJ to process payments on your behalf and deduct the agreed marketplace commission prior to payout.</li>
            <li>Maintain the quality and safety standards expected of premium window treatments.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">3. Customer Measurements & Custom Orders</h2>
          <p>
            Because blinds and curtains are often made-to-measure:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
            <li>Customers are responsible for providing accurate width and height measurements unless they book an official ICONJ Measurement Service.</li>
            <li>Custom-cut or specially manufactured items cannot be returned or refunded unless there is a verifiable manufacturing defect.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">4. Installation Services</h2>
          <p>
            Where a customer selects "Delivery + Installation," ICONJ acts as an intermediary connecting the customer with an approved independent installer. ICONJ Global Services is not directly liable for damages incurred during independent installation, though we strictly vet our professionals and enforce a dispute resolution policy.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">5. Payments and Payouts</h2>
          <p>
            All payments are securely processed through Paystack. Sellers and Suppliers will receive their payouts to their verified bank accounts on the designated settlement days, minus platform commissions and delivery fees.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">6. Contact Information</h2>
          <p>
            If you have any questions or concerns regarding these terms, please contact us at:<br/>
            <strong>Email:</strong> <a href="mailto:ezeilodavid292@gmail.com" className="text-blue-600 font-medium hover:underline">ezeilodavid292@gmail.com</a><br/>
            <strong>Legal Entity:</strong> ICONJ Global Services
          </p>
        </div>
      </div>
    </div>
  );
}
