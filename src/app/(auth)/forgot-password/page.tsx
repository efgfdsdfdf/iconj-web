"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await resetPassword(formData);
    // Regardless of true/false outcome in backend, we show success to prevent enumeration
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <MailCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h2>
          <p className="text-slate-500 mt-2">
            If an account exists for the email provided, we have sent a password reset link. Please check your inbox and spam folder.
          </p>
          <div className="mt-8">
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Reset Link
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
