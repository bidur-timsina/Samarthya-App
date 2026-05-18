'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Upload, Loader2, Link2, Check, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', price: '0',
    level: 'BEGINNER', isPublished: false, isFeatured: false,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'link'>('upload');
  const [thumbnailLink, setThumbnailLink] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/courses/categories').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/courses', data).then(r => r.data),
    onSuccess: (course) => {
      toast.success('Course created!');
      router.push(`/admin/courses/${course.id}/edit`);
    },
    onError: () => toast.error('Failed to create course'),
  });

  // Upload immediately on file select
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview instantly
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailUrl('');
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/image', fd);
      setThumbnailUrl(data.url);
      toast.success('Thumbnail uploaded!');
    } catch (err: any) {
      setThumbnailPreview('');
      toast.error(err?.response?.data?.message ?? 'Upload failed — check MinIO is running');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (uploading) return toast.error('Please wait for thumbnail to finish uploading');
    createMutation.mutate({ ...form, price: Number(form.price), thumbnail: thumbnailUrl });
  };

  const busy = uploading || createMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Course</h1>
          <p className="text-dark-muted text-sm">Fill in the details to create a new course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thumbnail */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Course Thumbnail</label>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-border rounded-lg">
              <button type="button" onClick={() => setThumbnailMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailMode === 'upload' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <button type="button" onClick={() => setThumbnailMode('link')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailMode === 'link' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Link2 className="w-3.5 h-3.5" /> Link
              </button>
            </div>
          </div>

          {/* Preview */}
          {thumbnailPreview && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-bg" style={{ height: 160 }}>
              <img src={thumbnailPreview} alt="preview" className={cn('w-full h-full object-cover', uploading && 'opacity-50')} />
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-bg/60">
                  <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                  <p className="text-sm text-white font-medium">Uploading…</p>
                </div>
              )}
              <button type="button" onClick={() => { setThumbnailPreview(''); setThumbnailUrl(''); setThumbnailLink(''); }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload mode */}
          {thumbnailMode === 'upload' && (
            <div
              onClick={() => !uploading && document.getElementById('thumbnail-input')?.click()}
              className={cn('border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-colors',
                uploading ? 'cursor-wait border-brand-500' : 'cursor-pointer hover:border-brand-400 border-gray-200 dark:border-dark-border')}
            >
              <Upload className="w-6 h-6 text-dark-muted" />
              <p className="text-sm text-dark-muted">Click to upload image</p>
              <p className="text-xs text-dark-muted/60">PNG, JPG, WEBP up to 5MB</p>
              <input id="thumbnail-input" type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            </div>
          )}

          {/* Link mode */}
          {thumbnailMode === 'link' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={thumbnailLink}
                onChange={e => setThumbnailLink(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); if (thumbnailLink.trim()) { setThumbnailPreview(thumbnailLink.trim()); setThumbnailUrl(thumbnailLink.trim()); } }
                }}
                placeholder="https://example.com/image.jpg"
                className="input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => { if (thumbnailLink.trim()) { setThumbnailPreview(thumbnailLink.trim()); setThumbnailUrl(thumbnailLink.trim()); } }}
                className="btn-primary px-4 flex items-center gap-1.5 text-sm"
              >
                <Check className="w-4 h-4" /> Apply
              </button>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Loksewa Preparation: Complete Guide"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what students will learn..."
              rows={4}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="input">
                <option value="">Select category</option>
                {(categories ?? []).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="input">
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (NRS)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted text-sm">NRS</span>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="input pl-14"
                placeholder="0 for free"
              />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Visibility</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isPublished ? 'bg-brand-700' : 'bg-dark-border'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Publish course</p>
              <p className="text-xs text-dark-muted">Students can see and enroll</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isFeatured ? 'bg-brand-700' : 'bg-dark-border'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Featured</p>
              <p className="text-xs text-dark-muted">Show on homepage</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/admin/courses" className="btn-secondary px-6">Cancel</Link>
          <button type="submit" disabled={busy} className="btn-primary px-6 flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Course
          </button>
        </div>
      </form>
    </div>
  );
}
