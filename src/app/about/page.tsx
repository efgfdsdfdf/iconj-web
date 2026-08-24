import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Truck, Factory, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About ICONJ</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          We are Nigeria&apos;s premier marketplace for custom blinds, curtains, and window treatments, connecting you directly with top-tier manufacturers and professional installers.
        </p>
      </section>

      {/* Content */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              At ICONJ, we recognized the growing demand for premium, custom-fitted window treatments in Nigeria. Our mission is to eliminate the complexity of sourcing high-quality blinds and curtains by providing a streamlined, secure marketplace connected directly to top manufacturers. From precise measurements to flawless installation, we handle the entire window treatment lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="bg-blue-50 border-none shadow-sm">
              <CardContent className="p-6">
                <Truck className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Direct-to-Customer</h3>
                <p className="text-slate-600 text-sm">We handle the logistics so you don&apos;t have to. Your products are shipped directly from our trusted suppliers to your specific delivery address in Nigeria.</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-none shadow-sm">
              <CardContent className="p-6">
                <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Secure & Transparent</h3>
                <p className="text-slate-600 text-sm">With Paystack integrations and real-time order tracking, you always know where your money went and when your products will arrive.</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-none shadow-sm">
              <CardContent className="p-6">
                <Factory className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
                <p className="text-slate-600 text-sm">Our suppliers use international standards, ensuring your blinds and curtains feature durable fabrics and reliable, quiet motorized systems.</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-none shadow-sm">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Dedicated Support</h3>
                <p className="text-slate-600 text-sm">Whether you need help with a custom electrical configuration or measuring your windows, our Nigerian-based support team is here to help.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

