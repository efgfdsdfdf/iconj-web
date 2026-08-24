"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Ruler, MapPin, Calendar, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function BookMeasurementPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    street: "",
    city: "",
    state: "",
    window_count: "",
    preferred_date: "",
    preferred_time: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('measurement_requests').insert({
        user_id: user?.id || null, // Allow guests
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: { street: formData.street, city: formData.city, state: formData.state },
        window_count: parseInt(formData.window_count) || 1,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        status: 'pending'
      });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success("Measurement request submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h1>
          <p className="text-slate-600 mb-8">
            An ICONJ measurement professional will review your request and contact you shortly to confirm the appointment.
          </p>
          <Button onClick={() => window.location.href = "/"} className="w-full bg-blue-600 hover:bg-blue-700">
            Return to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: The Form */}
        <div className="flex-1">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-blue-600 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <Ruler className="w-8 h-8 opacity-80" />
                <div>
                  <CardTitle className="text-2xl">Book a Professional Measurement</CardTitle>
                  <CardDescription className="text-blue-100 text-base mt-1">
                    Have our certified professionals measure your windows for a perfect fit.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input required type="tel" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} placeholder="e.g. 08012345678" />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600"/> Address Details</h3>
                </div>
                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input required value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Lagos" />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Lagos" />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600"/> Appointment Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Number of Windows</Label>
                    <Input type="number" min="1" required value={formData.window_count} onChange={e => setFormData({...formData, window_count: e.target.value})} placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Date *</Label>
                    <Input type="date" required value={formData.preferred_date} onChange={e => setFormData({...formData, preferred_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Time *</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                      value={formData.preferred_time} 
                      onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                    >
                      <option value="">Select Time</option>
                      <option value="Morning (8am - 12pm)">Morning (8am - 12pm)</option>
                      <option value="Afternoon (12pm - 4pm)">Afternoon (12pm - 4pm)</option>
                      <option value="Evening (4pm - 6pm)">Evening (4pm - 6pm)</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 mt-4">
                  {loading ? "Submitting Request..." : "Request Measurement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Guide */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6">
          <Card className="border-none shadow-sm bg-blue-50 overflow-hidden">
            <div className="h-40 bg-slate-900 relative">
              <img src="https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80" alt="Window Measurement" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white font-bold text-xl drop-shadow-md">How to Measure</h3>
              </div>
            </div>
            <CardContent className="p-6">
              <h4 className="font-bold text-blue-900 mb-4">Prefer to measure it yourself?</h4>
              <p className="text-sm text-blue-800 mb-6">If you want to order immediately, you can measure your windows yourself using our simple guide.</p>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Measure the Width (cm)</h5>
                    <p className="text-xs text-slate-600">Measure horizontally across the window recess at the top, middle, and bottom. Use the narrowest measurement.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Measure the Height (cm)</h5>
                    <p className="text-xs text-slate-600">Measure vertically inside the recess from top to bottom on the left, middle, and right. Use the longest measurement.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Outside Mount Allowance</h5>
                    <p className="text-xs text-slate-600">If mounting outside the recess, add at least 10cm to both width and height to ensure proper coverage.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
