import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

export interface BranchItem {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function BranchManager() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organization/branches', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load branches');
      const data: BranchItem[] = await res.json();
      setBranches(data || []);
    } catch (err) {
      toast.error(isArabic ? 'تعذر تحميل قائمة الفروع' : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: BranchItem) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
    setFormIsActive(branch.is_active !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(isArabic ? 'يرجى إدخال اسم الفرع' : 'Branch name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBranch) {
        // Edit
        const res = await fetch(`/api/organization/branches/${encodeURIComponent(editingBranch.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formName.trim(),
            address: formAddress.trim() || null,
            phone: formPhone.trim() || null,
            isActive: formIsActive,
          }),
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success(isArabic ? 'تم تحديث بيانات الفرع بنجاح! ✨' : 'Branch updated successfully!');
      } else {
        // Create
        const res = await fetch('/api/organization/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formName.trim(),
            address: formAddress.trim() || null,
            phone: formPhone.trim() || null,
            isActive: formIsActive,
          }),
        });
        if (!res.ok) throw new Error('Failed to create');
        toast.success(isArabic ? 'تم إضافة الفرع الجديد بنجاح! 🏢' : 'New branch created successfully!');
      }

      setIsModalOpen(false);
      await loadBranches();
    } catch (err) {
      toast.error(isArabic ? 'حدث خطأ أثناء حفظ الفرع' : 'Error saving branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/organization/branches/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(isArabic ? 'تم حذف الفرع بنجاح' : 'Branch deleted');
      await loadBranches();
    } catch (err) {
      toast.error(isArabic ? 'تعذر حذف الفرع' : 'Could not delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleBranchStatus = async (branch: BranchItem) => {
    const newStatus = branch.is_active === false;
    try {
      const res = await fetch(`/api/organization/branches/${encodeURIComponent(branch.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      toast.success(
        isArabic
          ? newStatus
            ? `تم تفعيل فرع ${branch.name} ✅`
            : `تم تعطيل فرع ${branch.name}`
          : `Branch status updated`
      );
      await loadBranches();
    } catch (err) {
      toast.error(isArabic ? 'تعذر تغيير حالة الفرع' : 'Failed to update branch status');
    }
  };

  const filteredBranches = branches.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3a4d] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
            <Building2 className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isArabic ? 'إدارة فروع العيادة (Branches Multi-Location)' : 'Clinic Branches Management'}
            </h3>
            <p className="text-xs text-slate-400">
              {isArabic
                ? 'أضف ونظم فروع عيادتك الجغرافية، وعيّن الموظفين والمواعيد لكل فرع باستقلالية كاملة.'
                : 'Manage your multi-location clinic branches, staff allocations, and schedules.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBranches}
            disabled={loading}
            className="p-2.5 bg-[#0f2a3f] hover:bg-[#183e5c] text-sky-300 rounded-xl border border-sky-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
            title={isArabic ? 'تحديث الفروع' : 'Refresh'}
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Plus className="size-4" />
            <span>{isArabic ? 'إضافة فرع جديد' : 'Add New Branch'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3.5 top-3 size-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث باسم الفرع، العنوان، أو الهاتف...' : 'Search branch name, address, phone...'}
            className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span>{isArabic ? `إجمالي الفروع: ${branches.length}` : `Total branches: ${branches.length}`}</span>
          <span className="text-emerald-400">
            {isArabic
              ? `النشطة: ${branches.filter((b) => b.is_active !== false).length}`
              : `Active: ${branches.filter((b) => b.is_active !== false).length}`}
          </span>
        </div>
      </div>

      {/* Branches List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="size-4 animate-spin text-sky-400" />
          <span>{isArabic ? 'جارٍ تحميل الفروع من قاعدة البيانات...' : 'Loading branches...'}</span>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-[#0d2134] border border-dashed border-[#1e3a4d] rounded-2xl p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 grid place-items-center">
            <Building className="size-6" />
          </div>
          <h4 className="text-sm font-bold text-white">
            {searchQuery
              ? isArabic
                ? 'لم يتم العثور على فروع مطابقة لبحثك'
                : 'No matching branches found'
              : isArabic
              ? 'لا توجد فروع مسجلة حتى الآن'
              : 'No branches registered yet'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isArabic
              ? 'أضف فروع عيادتك الآن لتتمكن من فصل حجوزات كل فرع وتحديد الأطباء والاستقبال لكل موقع.'
              : 'Add your clinic branches to organize appointments, doctors, and staff per location.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>{isArabic ? 'إنشاء أول فرع' : 'Create First Branch'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const isActive = branch.is_active !== false;
            return (
              <div
                key={branch.id}
                className={`bg-[#0d2134] border rounded-2xl p-5 space-y-4 transition-all hover:border-sky-500/40 relative group ${
                  isActive ? 'border-[#1e3a4d]' : 'border-red-500/20 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isActive
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {branch.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleBranchStatus(branch)}
                        className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{isActive ? (isArabic ? 'فرع نشط' : 'Active') : (isArabic ? 'متوقف مؤقتاً' : 'Inactive')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(branch)}
                      className="p-1.5 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 rounded-lg transition-colors"
                      title={isArabic ? 'تعديل الفرع' : 'Edit branch'}
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(isArabic ? `هل أنت متأكد من حذف فرع "${branch.name}"؟` : `Delete branch "${branch.name}"?`)) {
                          handleDelete(branch.id);
                        }
                      }}
                      disabled={deletingId === branch.id}
                      className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title={isArabic ? 'حذف الفرع' : 'Delete branch'}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-[#1e3a4d]/60 pt-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="size-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">
                      {branch.address || (isArabic ? 'لم يتم تحديد عنوان' : 'No address specified')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]" dir="ltr">
                    <Phone className="size-3.5 text-emerald-400 shrink-0" />
                    <span>{branch.phone || (isArabic ? 'لا يوجد هاتف' : 'No phone')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 shadow-2xl space-y-5 animate-rise"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-[#1e3a4d] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingBranch
                      ? isArabic
                        ? `تعديل بيانات فرع (${editingBranch.name})`
                        : `Edit Branch (${editingBranch.name})`
                      : isArabic
                      ? 'إضافة فرع جديد للعيادة'
                      : 'Add New Clinic Branch'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'سيتم حفظ الفرع فوراً في سوبابيز' : 'Synced directly with Supabase'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {isArabic ? 'اسم الفرع * (مثال: فرع التجمع الخامس، فرع المعادي)' : 'Branch Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isArabic ? 'فرع الرياض - حي العليا' : 'e.g. Downtown Branch'}
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {isArabic ? 'العنوان التفصيلي' : 'Full Address'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder={isArabic ? 'شارع التحرير، برج الأطباء، الدور الرابع' : 'Street address, building, floor'}
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl pr-9 pl-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <MapPin className="absolute right-3 top-3 size-3.5 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {isArabic ? 'رقم هاتف الفرع للتواصل' : 'Branch Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+966501234567"
                    dir="ltr"
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl pr-3.5 pl-9 py-2.5 text-white focus:outline-none focus:border-sky-500 font-mono transition-colors text-left"
                  />
                  <Phone className="absolute left-3 top-3 size-3.5 text-slate-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-[#1e3a4d] bg-[#081624] text-sky-500 focus:ring-0 size-4"
                />
                <label htmlFor="formIsActive" className="text-slate-300 font-semibold cursor-pointer">
                  {isArabic ? 'تفعيل الفرع واستقبال المواعيد به فوراً' : 'Activate branch and accept bookings'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e3a4d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>{editingBranch ? (isArabic ? 'حفظ التعديلات' : 'Update') : (isArabic ? 'إنشاء الفرع' : 'Create Branch')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
