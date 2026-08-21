import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function QuotePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a Custom Quote</h1>
        <p className="text-slate-500">Need a specialized configuration or electrical setup? Tell us your requirements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          <CardDescription>We will calculate the exact supplier cost and contact you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Interest</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Smart Motorized Blinds</option>
                <option>Blackout Blinds</option>
                <option>Smart Curtain Track System</option>
                <option>Custom / Large Project</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" defaultValue="1" min="1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specific Requirements (Dimensions, Fabrics, Motor)</Label>
            <Textarea placeholder="e.g. I need a 300cm wide smart curtain track with blackout fabric..." className="h-32" />
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="08012345678" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Delivery State</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Rivers</option>
                </select>
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
            Submit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
