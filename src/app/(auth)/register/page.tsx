"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyAdminNewUser } from "./actions";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    intent: "retail"
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            intent: formData.intent
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Notify admin of successful signup
      await notifyAdminNewUser(`${formData.firstName} ${formData.lastName}`, formData.email).catch(console.error);

      router.refresh();
      
      setTimeout(() => {
        if (data.session) {
          window.location.href = "/welcome";
        } else {
          window.location.href = "/verify-email";
        }
      }, 800);
      
    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12">
      <Card className="w-full max-w-[450px]">
        <CardHeader className="space-y-1 text-center mb-2">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create your ICONJ account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-3 pb-2">
              <Label className="text-sm font-semibold">What are you here to do?</Label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${formData.intent === 'retail' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="intent" value="retail" checked={formData.intent === 'retail'} onChange={e => setFormData({...formData, intent: e.target.value})} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.intent === 'retail' ? 'border-blue-600' : 'border-slate-300'}`}>
                    {formData.intent === 'retail' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Shop for yourself</span>
                    <span className="text-xs text-slate-500">Retail customer</span>
                  </div>
                </label>
                
                <label className={`flex items-center space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${formData.intent === 'wholesale' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="intent" value="wholesale" checked={formData.intent === 'wholesale'} onChange={e => setFormData({...formData, intent: e.target.value})} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.intent === 'wholesale' ? 'border-blue-600' : 'border-slate-300'}`}>
                    {formData.intent === 'wholesale' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Buy for your business</span>
                    <span className="text-xs text-slate-500">Wholesale access & bulk pricing</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${formData.intent === 'seller' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="intent" value="seller" checked={formData.intent === 'seller'} onChange={e => setFormData({...formData, intent: e.target.value})} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.intent === 'seller' ? 'border-blue-600' : 'border-slate-300'}`}>
                    {formData.intent === 'seller' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Sell on ICON</span>
                    <span className="text-xs text-slate-500">Create a store and sell products</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
