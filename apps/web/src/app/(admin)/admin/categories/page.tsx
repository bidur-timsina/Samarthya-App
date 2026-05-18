'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tag, Plus, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/courses/categories').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/courses/categories', { name }).then(r => r.data),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setName('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <p className="text-dark-muted text-sm">{categories.length} categories</p>
      </div>

      {/* Add form */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add New Category</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) createMutation.mutate(); }}
            placeholder="e.g. Loksewa Preparation"
            className="input flex-1"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="btn-primary flex items-center gap-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-100 dark:divide-dark-border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-dark-muted">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-14 text-center">
            <Tag className="w-10 h-10 mx-auto mb-3 text-dark-muted opacity-30" />
            <p className="text-dark-muted">No categories yet. Add one above.</p>
          </div>
        ) : categories.map((cat: any) => (
          <div key={cat.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-brand-900/20 flex items-center justify-center flex-shrink-0">
              <Tag className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
              <div className="flex items-center gap-1 text-xs text-dark-muted">
                <BookOpen className="w-3 h-3" />
                {cat._count?.courses ?? 0} courses
              </div>
            </div>
            <span className="text-xs text-dark-muted font-mono bg-gray-100 dark:bg-dark-bg px-2 py-1 rounded-lg">
              {cat.slug}
            </span>
            <button
              onClick={() => {
                if (confirm(`Delete "${cat.name}"? Courses in this category will become uncategorized.`)) {
                  deleteMutation.mutate(cat.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
