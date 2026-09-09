'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewLandingPagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    headline: '',
    subheadline: '',
    hero_image_url: '',
    body_content: '',
    theme_color: '#f97316',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.title || !form.headline) {
      toast.error('Slug, title and headline are required');
      return;
    }
    // Enforce clean slug
    const cleanSlug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug: cleanSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create landing page');
      toast.success('Landing page created!');
      router.push('/admin/marketing/landing-pages');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/marketing/landing-pages">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Landing Page</h1>
          <p className="text-slate-500 text-sm mt-0.5">This page will be live at <code className="bg-slate-100 px-1 rounded">/lp/{form.slug || 'your-slug'}</code></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6 shadow-sm">
        {/* Slug & Title */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug <span className="text-red-500">*</span></Label>
            <Input
              id="slug"
              placeholder="e.g. blackout-blinds-promo"
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
            />
            <p className="text-xs text-slate-500">Use lowercase letters and hyphens only. No spaces.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Page Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="e.g. 20% Off Blackout Blinds"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>
        </div>

        {/* Headline & Subheadline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Hero Headline <span className="text-red-500">*</span></Label>
          <Input
            id="headline"
            placeholder="e.g. Transform Your Home with Premium Blackout Blinds"
            value={form.headline}
            onChange={e => set('headline', e.target.value)}
          />
          <p className="text-xs text-slate-500">This is the large text customers see first. Make it compelling!</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subheadline">Subheadline (optional)</Label>
          <Input
            id="subheadline"
            placeholder="e.g. Limited time offer — get 20% off all blackout blind orders this week"
            value={form.subheadline}
            onChange={e => set('subheadline', e.target.value)}
          />
        </div>

        {/* Hero Image */}
        <div className="space-y-2">
          <Label htmlFor="hero_image_url">Hero Image URL (optional)</Label>
          <Input
            id="hero_image_url"
            placeholder="https://..."
            value={form.hero_image_url}
            onChange={e => set('hero_image_url', e.target.value)}
          />
          <p className="text-xs text-slate-500">Paste a direct image URL. Recommend: 1200×600px. Leave blank for a plain dark background.</p>
        </div>

        {/* Body Content */}
        <div className="space-y-2">
          <Label htmlFor="body_content">Body Content (optional)</Label>
          <Textarea
            id="body_content"
            rows={5}
            placeholder="Describe your offer, your brand story, or any details that will convince customers to buy..."
            value={form.body_content}
            onChange={e => set('body_content', e.target.value)}
          />
        </div>

        {/* Theme Color */}
        <div className="space-y-2">
          <Label htmlFor="theme_color">Theme Colour</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="theme_color"
              value={form.theme_color}
              onChange={e => set('theme_color', e.target.value)}
              className="w-12 h-12 rounded-lg border cursor-pointer p-1"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">{form.theme_color}</p>
              <p className="text-xs text-slate-500">Used for buttons, badges, and accents on the page.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Creating...' : 'Create Landing Page'}
          </Button>
          {form.slug && (
            <Link href={`/lp/${form.slug}`} target="_blank">
              <Button type="button" variant="outline" className="gap-2">
                <Eye className="w-4 h-4" /> Preview
              </Button>
            </Link>
          )}
          <Link href="/admin/marketing/landing-pages">
            <Button type="button" variant="ghost" className="text-slate-500">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
