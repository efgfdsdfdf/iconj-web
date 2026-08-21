import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 text-slate-600 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg text-primary mb-4">ICONJ</h3>
          <p className="text-sm">
            Premium prefabricated container solutions and dropshipping e-commerce platform. Delivered direct to your location in Nigeria.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-slate-900">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-primary">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-primary">Categories</Link></li>
            <li><Link href="/track" className="hover:text-primary">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-slate-900">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            <li><Link href="/returns" className="hover:text-primary">Returns & Issues</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-slate-900">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t text-sm text-center">
        &copy; {new Date().getFullYear()} ICONJ. All rights reserved.
      </div>
    </footer>
  );
}
