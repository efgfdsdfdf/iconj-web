import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

export default function TrackOrderGuestPage() {
  return (
    <div className="container flex min-h-[calc(100vh-200px)] flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Track Your Order</h1>
        <p className="text-slate-500 max-w-md mx-auto">Enter your order details below to check the real-time shipping status of your container or parts.</p>
      </div>

      <Card className="w-full max-w-[500px] shadow-lg">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>You can find your Order ID in your confirmation email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input id="orderId" placeholder="e.g. ICONJ-2024-000256" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="Email used during checkout" className="h-12" />
          </div>
          
          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
            Track Order
          </Button>

          <div className="text-center mt-6 text-sm text-slate-500">
            Have an account? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Log in to view all orders</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
