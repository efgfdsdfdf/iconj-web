import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-lg text-slate-600">Have a question about a product, shipping, or need support with an existing order? Our team is here to help.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-blue-600 text-white">
            <CardContent className="p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-blue-300 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Head Office</h4>
                      <p className="text-blue-100 text-sm leading-relaxed">123 Marina Street,<br />Lagos Island, Lagos,<br />Nigeria</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-blue-300 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-blue-100 text-sm">0800 ICONJ HELP<br />+234 801 234 5678</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-blue-300 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-blue-100 text-sm">support@iconj.com<br />sales@iconj.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Send us a message</h3>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="First Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Last Name" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <select id="subject" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>General Inquiry</option>
                      <option>Order Support</option>
                      <option>Product Question</option>
                      <option>Returns/Issues</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="How can we help you today?" className="min-h-[150px]" />
                </div>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
