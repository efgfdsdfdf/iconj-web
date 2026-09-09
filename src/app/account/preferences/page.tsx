import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

export const metadata = { title: "Communication Preferences | ICONJ" };

async function updatePreferences(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const optIn = formData.get("marketing_opt_in") === "on";
  const emailFreq = formData.get("marketing_frequency") as string;
  const sms = formData.get("accepts_sms") === "on";
  const whatsapp = formData.get("accepts_whatsapp") === "on";

  await supabase.from("profiles").update({
    marketing_opt_in: optIn,
    marketing_frequency: emailFreq,
    accepts_sms: sms,
    accepts_whatsapp: whatsapp
  }).eq("id", user.id);

  revalidatePath("/account/preferences");
}

export default async function PreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("marketing_opt_in, marketing_frequency, accepts_sms, accepts_whatsapp")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/account" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Communication Preferences</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" /> Manage Notifications</CardTitle>
          <CardDescription>Choose how you want to hear from us about new products, discounts, and order updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePreferences} className="space-y-8">
            
            {/* Email Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-4 h-4" /> Email Marketing</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Promotional Emails</Label>
                  <p className="text-sm text-slate-500">Receive coupons, sales, and personalized recommendations.</p>
                </div>
                <Switch name="marketing_opt_in" defaultChecked={profile?.marketing_opt_in ?? true} />
              </div>
              
              <div className="grid gap-2">
                <Label>Email Frequency</Label>
                <select 
                  name="marketing_frequency" 
                  defaultValue={profile?.marketing_frequency || 'all'}
                  className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">Send me everything (Recommended)</option>
                  <option value="weekly">Weekly digest only</option>
                  <option value="monthly">Monthly newsletter only</option>
                </select>
              </div>
            </div>

            <hr />

            {/* Direct Messaging */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4" /> Direct Messaging</h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">SMS Notifications</Label>
                  <p className="text-sm text-slate-500">Text alerts for major sales and urgent order updates.</p>
                </div>
                <Switch name="accepts_sms" defaultChecked={profile?.accepts_sms ?? false} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp</Label>
                  <p className="text-sm text-slate-500">Receive personalized support and exclusive VIP updates on WhatsApp.</p>
                </div>
                <Switch name="accepts_whatsapp" defaultChecked={profile?.accepts_whatsapp ?? false} />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Preferences</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <p className="text-xs text-slate-400 mt-6 text-center">
        Note: You cannot opt-out of transactional emails (e.g., order confirmations, password resets) as these are required to service your account.
      </p>
    </div>
  );
}
