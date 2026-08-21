import { Shield } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ICONJ",
  description: "How ICONJ handles and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-slate-500">Last Updated: [DATE]</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-10 text-slate-700 space-y-8 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p>Welcome to ICONJ. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, and delivery address when you create an account.</li>
              <li><strong>Order & Delivery Information:</strong> Specific dimensions, window configurations, and delivery instructions required to fulfill your custom orders.</li>
              <li><strong>Payment Information:</strong> We do NOT store your credit/debit card details. All payments are securely processed by Paystack. We only receive verification that your payment was successful.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. How We Use Information</h2>
            <p>We use your information primarily to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Process and deliver your orders (including communicating custom configurations to our suppliers).</li>
              <li>Manage your account and order history.</li>
              <li>Provide customer support and resolve order issues.</li>
              <li>Send you essential updates regarding your shipment or quotes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. How We Share Information</h2>
            <p className="mb-2">We may share your data with third parties in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supplier/Fulfillment Information:</strong> Necessary order dimensions and delivery details are shared with our manufacturing partners to create and ship your product.</li>
              <li><strong>Payment Processing:</strong> Shared securely with Paystack to process transactions.</li>
            </ul>
            <p className="mt-4 font-medium text-slate-900">ICONJ will never sell your personal data to third-party marketers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is limited to employees, agents, contractors, and other third parties who have a business need to know.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Contact Information</h2>
            <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us at:</p>
            <div className="bg-slate-50 p-4 rounded-lg mt-4 border">
              <p><strong>Email:</strong> [ICONJ SUPPORT EMAIL]</p>
              <p><strong>Address:</strong> [ICONJ BUSINESS ADDRESS]</p>
              <p><strong>Business Name:</strong> [ICONJ LEGAL BUSINESS NAME]</p>
            </div>
          </section>
        </div>

        {/* Support CTAs */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <Link href="/contact" className="bg-white p-6 rounded-xl border shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Still need help?</h3>
            <p className="text-sm text-slate-500 mt-1">Contact ICONJ Support</p>
          </Link>
          <Link href="/report-issue" className="bg-white p-6 rounded-xl border shadow-sm hover:border-orange-500 hover:shadow-md transition-all group">
            <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Have a problem with your order?</h3>
            <p className="text-sm text-slate-500 mt-1">Report an Issue</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

