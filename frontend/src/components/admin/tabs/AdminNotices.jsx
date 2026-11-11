import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Bell, Clock, Calendar, Pencil, Trash2, X, Check,
  Image as ImageIcon, Sparkles, Tag, Eye, ExternalLink, Maximize2,
  AlertTriangle, Filter, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['General', 'Admissions', 'Examinations', 'Events', 'Holidays', 'Urgent'];

export default function AdminNotices({
  notices = [],
  onCreateNotice,
  onSaveNoticeEdits,
  onToggleNoticePopup,
  onDeleteNotice,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [popupFilter, setPopupFilter] = useState('all'); // 'all', 'activePopup', 'regular'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [previewNotice, setPreviewNotice] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const defaultForm = {
    title: '',
    description: '',
    category: 'General',
    imageData: '',
    imagePreview: '',
    showAsPopup: false,
    popupPriority: 'medium',
    popupStartDate: '',
    popupEndDate: '',
    popupStatus: 'active',
    popupButtonText: '',
    popupButtonUrl: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQ = !q || (n.title || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
      const isPopup = Boolean(n.showAsPopup || n.isPopup);
      const matchPopup = popupFilter === 'all' || (popupFilter === 'activePopup' ? isPopup : !isPopup);
      return matchQ && matchCat && matchPopup;
    });
  }, [notices, searchQuery, categoryFilter, popupFilter]);

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditingNotice((prev) => ({ ...prev, imageData: reader.result, imagePreview: reader.result }));
      } else {
        setForm((prev) => ({ ...prev, imageData: reader.result, imagePreview: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onCreateNotice(form);
      setForm(defaultForm);
      setShowAddModal(false);
    } catch (err) {
      setError(err?.message || 'Failed to create notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingNotice) return;
    setSubmitting(true);
    setError('');
    try {
      await onSaveNoticeEdits(editingNotice._id, editingNotice);
      setEditingNotice(null);
    } catch (err) {
      setError(err?.message || 'Failed to update notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1 max-w-xl">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={popupFilter}
            onChange={(e) => setPopupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none"
          >
            <option value="all">All Types</option>
            <option value="activePopup">Homepage Popups Only</option>
            <option value="regular">Standard Notices Only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(defaultForm);
            setError('');
            setShowAddModal(true);
          }}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={15} />
          <span>Add New Notice</span>
        </button>
      </div>

      {/* Grid of Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Bell size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No notices found</h4>
            <p className="text-xs text-slate-400 mt-1">Publish an announcement or create a homepage popup modal.</p>
          </div>
        ) : (
          filteredNotices.map((n) => {
            const isPopup = Boolean(n.showAsPopup || n.isPopup);

            return (
              <div
                key={n._id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isPopup
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : 'border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Top Badge Banner */}
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                        <Tag size={10} />
                        {n.category || 'General'}
                      </span>
                      {n.popupPriority && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          n.popupPriority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          n.popupPriority === 'low' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {n.popupPriority}
                        </span>
                      )}
                    </div>

                    {isPopup && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs flex items-center gap-1">
                        <Sparkles size={11} />
                        Active Popup
                      </span>
                    )}
                  </div>

                  {/* Image Thumbnail */}
                  {n.imageUrl && (
                    <div className="h-36 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center my-1">
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {n.description || 'No description content provided.'}
                    </p>

                    {/* Expiry Dates */}
                    {(n.popupStartDate || n.popupEndDate) && (
                      <div className="pt-2 text-[10px] text-slate-400 space-y-0.5 font-medium">
                        {n.popupStartDate && (
                          <p>Start: {new Date(n.popupStartDate).toLocaleDateString()}</p>
                        )}
                        {n.popupEndDate && (
                          <p className="text-amber-600 font-semibold">
                            Expires: {new Date(n.popupEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Toggle Popup Button */}
                  <button
                    type="button"
                    onClick={() => onToggleNoticePopup(n)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                      isPopup
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 shadow-xs'
                        : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-600 hover:text-amber-700'
                    }`}
                  >
                    <Sparkles size={13} className={isPopup ? 'text-amber-600' : 'text-slate-400'} />
                    <span>{isPopup ? '★ Active Popup' : 'Set as Popup'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Live Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewNotice(n)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 transition"
                      title="Preview Announcement Popup"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotice({
                          ...n,
                          showAsPopup: Boolean(n.showAsPopup ?? n.isPopup),
                          imagePreview: n.imageUrl || '',
                          popupStartDate: n.popupStartDate ? new Date(n.popupStartDate).toISOString().slice(0, 16) : '',
                          popupEndDate: n.popupEndDate ? new Date(n.popupEndDate).toISOString().slice(0, 16) : '',
                        });
                        setError('');
                      }}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 transition"
                      title="Edit Notice"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(n._id)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-500 text-slate-600 hover:text-rose-600 transition"
                      title="Delete Notice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Notice Modal */}
      {(showAddModal || editingNotice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingNotice ? 'Edit Notice & Announcement' : 'Create New Notice'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingNotice(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={editingNotice ? handleEditSubmit : handleCreateSubmit}
              className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
            >
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingNotice ? editingNotice.title : form.title}
                    onChange={(e) => {
                      if (editingNotice) setEditingNotice({ ...editingNotice, title: e.target.value });
                      else setForm({ ...form, title: e.target.value });
                    }}
                    placeholder="e.g. 2026 Batch Intake Now Open"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={editingNotice ? (editingNotice.category || 'General') : form.category}
                    onChange={(e) => {
                      if (editingNotice) setEditingNotice({ ...editingNotice, category: e.target.value });
                      else setForm({ ...form, category: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notice Content / Description
                </label>
                <textarea
                  rows={4}
                  value={editingNotice ? (editingNotice.description || '') : form.description}
                  onChange={(e) => {
                    if (editingNotice) setEditingNotice({ ...editingNotice, description: e.target.value });
                    else setForm({ ...form, description: e.target.value });
                  }}
                  placeholder="Complete announcement message..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Smart Homepage Popup Section Box */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Homepage Entry Popup Announcement Settings
                    </h4>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingNotice ? Boolean(editingNotice.showAsPopup) : Boolean(form.showAsPopup)}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, showAsPopup: e.target.checked });
                        else setForm({ ...form, showAsPopup: e.target.checked });
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="font-bold text-slate-800 text-xs">Enable as Homepage Popup</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Priority Level
                    </label>
                    <select
                      value={editingNotice ? (editingNotice.popupPriority || 'medium') : form.popupPriority}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, popupPriority: e.target.value });
                        else setForm({ ...form, popupPriority: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editingNotice ? (editingNotice.popupStartDate || '') : form.popupStartDate}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, popupStartDate: e.target.value });
                        else setForm({ ...form, popupStartDate: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editingNotice ? (editingNotice.popupEndDate || '') : form.popupEndDate}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, popupEndDate: e.target.value });
                        else setForm({ ...form, popupEndDate: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Action button in popup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Optional Action Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Register Now"
                      value={editingNotice ? (editingNotice.popupButtonText || '') : form.popupButtonText}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, popupButtonText: e.target.value });
                        else setForm({ ...form, popupButtonText: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Action Button Link / URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /apply-now or https://..."
                      value={editingNotice ? (editingNotice.popupButtonUrl || '') : form.popupButtonUrl}
                      onChange={(e) => {
                        if (editingNotice) setEditingNotice({ ...editingNotice, popupButtonUrl: e.target.value });
                        else setForm({ ...form, popupButtonUrl: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notice Poster Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, Boolean(editingNotice))}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {(editingNotice ? editingNotice.imagePreview : form.imagePreview) && (
                    <img
                      src={editingNotice ? editingNotice.imagePreview : form.imagePreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNotice(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? 'Saving...' : editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal (Premium Modern Announcement Modal 2.0) */}
      <AnimatePresence>
        {previewNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080F23]/65 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[20px] shadow-2xl border border-slate-100 w-full max-w-[620px] max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <header className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0B1528] text-white flex items-center justify-center font-bold text-xs">
                    IAAC
                  </div>
                  <span className="font-semibold text-slate-800 text-sm tracking-tight">
                    Official Announcement
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewNotice(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </header>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-6 sm:py-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {previewNotice.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100 text-[11px] uppercase tracking-wider">
                      <Tag size={11} className="text-blue-500" />
                      {previewNotice.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium text-slate-400 text-xs">
                    <Calendar size={12} />
                    {new Date(previewNotice.createdAt || Date.now()).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-xl sm:text-[24px] font-bold text-[#0B1528] leading-[1.3] tracking-tight">
                  {previewNotice.title || 'Untitled Notice'}
                </h2>

                {previewNotice.imageUrl && (
                  <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <img
                      src={previewNotice.imageUrl}
                      alt={previewNotice.title}
                      className="w-full max-h-[240px] object-contain"
                    />
                  </div>
                )}

                {previewNotice.description && (
                  <div className="text-[15px] sm:text-base text-slate-600 leading-[1.6] whitespace-pre-line">
                    {previewNotice.description}
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="px-5 py-4 sm:px-6 sm:py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewNotice(null)}
                  className="order-2 sm:order-1 text-slate-500 hover:text-slate-800 text-sm font-medium px-2 py-1.5 rounded-lg transition hover:bg-slate-200/50 w-full sm:w-auto text-center"
                >
                  Continue to Website
                </button>

                <div className="order-1 sm:order-2 flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {previewNotice.popupButtonText ? (
                    <div className="h-[44px] px-5 rounded-[10px] bg-[#0B1528] text-white text-sm font-medium transition shadow-xs flex items-center justify-center gap-2 w-full sm:w-auto text-center">
                      <span>{previewNotice.popupButtonText}</span>
                      <ExternalLink size={14} />
                    </div>
                  ) : previewNotice.imageUrl ? (
                    <div className="h-[44px] px-5 rounded-[10px] bg-[#0B1528] text-white text-sm font-medium transition shadow-xs flex items-center justify-center gap-2 w-full sm:w-auto text-center">
                      <span>View Full Notice</span>
                      <Maximize2 size={14} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewNotice(null)}
                      className="h-[44px] px-6 rounded-[10px] bg-[#0B1528] text-white text-sm font-medium transition shadow-xs flex items-center justify-center w-full sm:w-auto text-center"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Notice</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this notice? If active, it will also be removed as the homepage popup.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteNotice(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
