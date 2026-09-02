import { RefreshCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Returns & Replacement Policy | ICONJ",
  description: "Our policy for returning or replacing damaged or incorrect products.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-orange-600 mb-4">
            <RefreshCcw className="w-8 h-8" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Returns & Replacements</h1>
          </div>
          <p className="text-slate-500">Last Updated: [DATE]</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-10 text-slate-700 space-y-8 leading-relaxed">
          
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r">
            <p className="font-bold text-slate-900">Important Notice Regarding Custom Products</p>
            <p className="text-sm mt-1">Many ICONJ products (like curated bundles or specific hygiene products\) are uniquely packaged or subject to hygiene laws. Because these items are customized to your specifications, they cannot be returned simply for a "change of mind" or incorrect sizes ordered by the customer.</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. When Can I Request a Replacement?</h2>
            <p className="mb-2">You are eligible to report an issue and request a resolution if your order arrives with any of the following problems:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The product is physically damaged during delivery.</li>
              <li>You received the wrong product or incorrect color.</li>
              <li>The item is defective or malfunctioning out of the box.</li>
              <li>Missing components or parts.</li>
              <li>The product size, color, or variant does not match what you explicitly ordered.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Supplier Resolution Process</h2>
            <p>Because we work directly with specialized suppliers, we coordinate closely with them to resolve issues. Our suppliers guarantee:</p>
            <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600 bg-slate-50 py-2 pr-2">
              "We will resend the parts or remake the item, depending on the specific situation."
            </blockquote>
            <p>If a component is missing or damaged \(e.g., a broken bottle cap or missing toy part\), we will expedite the shipping of a replacement part. If the entire unit is defective or produced incorrectly based on your provided specifications, the item will be remade at no cost to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Step-by-Step Resolution Process</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-slate-900">Report the Issue</h3>
                  <p className="text-sm mt-1">Use our <Link href="/report-issue" className="text-blue-600 hover:underline">Report an Issue form</Link> within 48 hours of delivery.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-slate-900">Provide Evidence</h3>
                  <p className="text-sm mt-1">Upload clear photos or videos showing the defect, damage, or missing part, along with photos of the original packaging.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-slate-900">Review & Supplier Contact</h3>
                  <p className="text-sm mt-1">Our support team will review your submission and contact the supplier on your behalf immediately.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0"><CheckCircle2 className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-slate-900">Resolution</h3>
                  <p className="text-sm mt-1">We will notify you whether a replacement part is being shipped or a complete remake has been ordered.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/report-issue" className="block bg-orange-500 text-white text-center font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
            Report an Order Issue Now
          </Link>
        </div>
      </div>
    </div>
  );
}


