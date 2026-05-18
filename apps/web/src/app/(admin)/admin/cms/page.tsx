'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Megaphone, Plus, Trash2, ImageIcon, Bell, Pencil, X, Check } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_BANNER = { title: '', image: '', link: '', isActive: true };
const EMPTY_ANN = { title: '', body: '', type: 'INFO' };

export default function AdminCmsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'banners' | 'announcements'>('banners');

  // banner form state
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<typeof EMPTY_BANNER>({ ...EMPTY_BANNER });

  // announcement form state
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState<typeof EMPTY_ANN>({ ...EMPTY_ANN });

  const { data: banners } = useQuery({ queryKey: ['admin', 'banners'], queryFn: () => api.get('/cms/banners?all=true').then(r => r.data) });
  const { data: announcements } = useQuery({ queryKey: ['admin', 'announcements'], queryFn: () => api.get('/cms/announcements').then(r => r.data) });

  // ── Banner mutations ─────────────────────────────────────────────────────────
  const createBanner = useMutation({
    mutationFn: (d: any) => api.post('/cms/banners', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      qc.invalidateQueries({ queryKey: ['cms', 'banners'] });
      toast.success('Banner created');
      closeBannerForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create banner'),
  });

  const updateBanner = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/cms/banners/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      qc.invalidateQueries({ queryKey: ['cms', 'banners'] });
      toast.success('Banner updated');
      closeBannerForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update banner'),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/banners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      qc.invalidateQueries({ queryKey: ['cms', 'banners'] });
    },
  });

  // ── Announcement mutations ───────────────────────────────────────────────────
  const createAnn = useMutation({
    mutationFn: (d: any) => api.post('/cms/announcements', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Announcement posted');
      closeAnnForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to post announcement'),
  });

  const updateAnn = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/cms/announcements/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Announcement updated');
      closeAnnForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update announcement'),
  });

  const deleteAnn = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const openNewBanner = () => { setEditingBannerId(null); setBannerForm({ ...EMPTY_BANNER }); setShowBannerForm(true); };
  const openEditBanner = (b: any) => { setEditingBannerId(b.id); setBannerForm({ title: b.title, image: b.image ?? '', link: b.link ?? '', isActive: b.isActive }); setShowBannerForm(true); };
  const closeBannerForm = () => { setShowBannerForm(false); setEditingBannerId(null); setBannerForm({ ...EMPTY_BANNER }); };

  const openNewAnn = () => { setEditingAnnId(null); setAnnForm({ ...EMPTY_ANN }); setShowAnnForm(true); };
  const openEditAnn = (a: any) => { setEditingAnnId(a.id); setAnnForm({ title: a.title, body: a.body, type: a.type ?? 'INFO' }); setShowAnnForm(true); };
  const closeAnnForm = () => { setShowAnnForm(false); setEditingAnnId(null); setAnnForm({ ...EMPTY_ANN }); };

  const submitBanner = () => {
    if (editingBannerId) updateBanner.mutate({ id: editingBannerId, data: bannerForm });
    else createBanner.mutate(bannerForm);
  };

  const submitAnn = () => {
    if (editingAnnId) updateAnn.mutate({ id: editingAnnId, data: annForm });
    else createAnn.mutate(annForm);
  };

  const annColor = (type: string) => {
    if (type === 'WARNING') return 'bg-amber-500/20 text-amber-400';
    if (type === 'URGENT') return 'bg-red-500/20 text-red-400';
    return 'bg-brand-900/20 text-brand-400';
  };

  const bannerPending = createBanner.isPending || updateBanner.isPending;
  const annPending = createAnn.isPending || updateAnn.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CMS</h1>
        <p className="text-dark-muted text-sm">Manage banners and announcements</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-dark-surface rounded-xl p-1 border border-gray-200 dark:border-dark-border gap-1 w-fit">
        {(['banners', 'announcements'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-900 dark:hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── BANNERS ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNewBanner} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          {showBannerForm && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{editingBannerId ? 'Edit Banner' : 'New Banner'}</h3>
                <button onClick={closeBannerForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-bg">
                  <X className="w-4 h-4 text-dark-muted" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                <input type="text" value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Banner title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
                <input type="text" value={bannerForm.image} onChange={e => setBannerForm(f => ({ ...f, image: e.target.value }))} className="input" placeholder="https://..." />
                {bannerForm.image && (
                  <div className="mt-2 h-28 rounded-lg overflow-hidden bg-dark-bg">
                    <img src={bannerForm.image} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link (optional)</label>
                <input type="text" value={bannerForm.link} onChange={e => setBannerForm(f => ({ ...f, link: e.target.value }))} className="input" placeholder="https://..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setBannerForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${bannerForm.isActive ? 'bg-brand-700' : 'bg-dark-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bannerForm.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-900 dark:text-white">Active</span>
              </label>
              <div className="flex justify-end gap-3">
                <button onClick={closeBannerForm} className="btn-secondary px-4">Cancel</button>
                <button
                  onClick={submitBanner}
                  disabled={!bannerForm.title || !bannerForm.image || bannerPending}
                  className="btn-primary px-4"
                >
                  {bannerPending ? 'Saving…' : editingBannerId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(banners ?? []).length === 0 && (
              <div className="card p-10 text-center text-dark-muted col-span-2">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No banners yet</p>
              </div>
            )}
            {(banners ?? []).map((b: any) => (
              <div key={b.id} className="card overflow-hidden">
                {b.image && (
                  <div className="h-36 bg-dark-bg overflow-hidden">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{b.title}</p>
                    <span className={cn('badge text-xs', b.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-dark-muted')}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditBanner(b)} className="p-1.5 rounded hover:bg-brand-900/10">
                      <Pencil className="w-4 h-4 text-brand-400" />
                    </button>
                    <button onClick={() => { if (confirm('Delete banner?')) deleteBanner.mutate(b.id); }} className="p-1.5 rounded hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {tab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNewAnn} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>

          {showAnnForm && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{editingAnnId ? 'Edit Announcement' : 'Post Announcement'}</h3>
                <button onClick={closeAnnForm} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-bg">
                  <X className="w-4 h-4 text-dark-muted" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input type="text" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. New batch starting June 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label>
                <textarea value={annForm.body} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} rows={3} className="input resize-none" placeholder="Announcement details..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select value={annForm.type} onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))} className="input">
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={closeAnnForm} className="btn-secondary px-4">Cancel</button>
                <button
                  onClick={submitAnn}
                  disabled={!annForm.title || !annForm.body || annPending}
                  className="btn-primary px-4"
                >
                  {annPending ? 'Saving…' : editingAnnId ? 'Save Changes' : 'Post'}
                </button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-dark-border">
            {(announcements ?? []).length === 0 && (
              <div className="p-10 text-center text-dark-muted">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No announcements yet</p>
              </div>
            )}
            {(announcements ?? []).map((a: any) => (
              <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                <span className={cn('badge flex-shrink-0 mt-0.5', annColor(a.type))}>{a.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-sm text-dark-muted mt-0.5 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-dark-muted mt-1">{formatRelativeTime(a.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEditAnn(a)} className="p-1.5 rounded hover:bg-brand-900/10">
                    <Pencil className="w-4 h-4 text-brand-400" />
                  </button>
                  <button onClick={() => { if (confirm('Delete?')) deleteAnn.mutate(a.id); }} className="p-1.5 rounded hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
