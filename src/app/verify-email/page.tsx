import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900">Check Your Email</h1>
        
        <p className="text-slate-600 text-lg">
          We've sent a secure confirmation link to your email address. Please click the link to verify your account and complete your registration.
        </p>
        
        <p className="text-sm text-slate-500">
          If you don't see it in a few minutes, make sure to check your spam or junk folder.
        </p>

        <div className="pt-6 border-t mt-6">
          <Link href="/login">
            <Button variant="outline" className="w-full">Return to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
