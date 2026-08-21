import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-blue-50 text-blue-900 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg text-blue-700 mb-4">ICONJ</h3>
          <p className="text-sm">
            Premium prefabricated container solutions and dropshipping e-commerce platform. Delivered direct to your location in Nigeria.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-blue-950">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-primary">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-primary">Categories</Link></li>
          </ul>
        </div>
        {/* Customer Service */}
        <div>
          <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Customer Service</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><Link href="/faq" className="hover:text-orange-500 transition-colors">FAQ</Link></li>
            <li><Link href="/returns" className="hover:text-orange-500 transition-colors">Returns & Replacements</Link></li>
            <li><Link href="/report-issue" className="hover:text-orange-500 transition-colors">Report an Issue</Link></li>
            <li><Link href="/track" className="hover:text-orange-500 transition-colors">Track Order</Link></li>
            <li><Link href="/contact" className="hover:text-orange-500 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Legal</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><Link href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:text-orange-500 transition-colors">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t text-sm text-center">
        &copy; {new Date().getFullYear()} ICONJ. All rights reserved.
      </div>
    </footer>
  );
}
