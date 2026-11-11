import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, BookOpen, Clock, Tag, DollarSign, Pencil, 
  Trash2, X, Check, Image as ImageIcon, MapPin, ExternalLink
} from 'lucide-react';

export default function AdminCourses({
  courses = [],
  onCreateCourse,
  onSaveCourseEdits,
  onDeleteCourse,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form state for creating
  const defaultForm = {
    title: '',
    duration: '',
    courseType: 'Airline & Aviation Programs',
    shortDescription: '',
    totalCourseFee: '',
    branchPrices: { iaacCity: '', airportAcademy: '', iaacCenter: '' },
    minimumEntryRequirements: '',
    evaluationCriteria: '',
    examinationFormat: '',
    additionalNotes: '',
    sessionDetails: '',
    imageData: '',
    imagePreview: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Course Types
  const courseTypes = useMemo(() => {
    const types = new Set(courses.map((c) => c.courseType).filter(Boolean));
    types.add('Airline & Aviation Programs');
    types.add('Pilot Training Programs');
    types.add('Cabin Crew Programs');
    return Array.from(types);
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQ = !q || (c.title || '').toLowerCase().includes(q) || (c.shortDescription || '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || c.courseType === typeFilter;
      return matchQ && matchType;
    });
  }, [courses, searchQuery, typeFilter]);

  // Image upload helper
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
        setEditingCourse((prev) => ({ ...prev, imageData: reader.result, imagePreview: reader.result }));
      } else {
        setForm((prev) => ({ ...prev, imageData: reader.result, imagePreview: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.duration || !form.courseType) {
      setError('Title, duration, and course type are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onCreateCourse(form);
      setForm(defaultForm);
      setShowAddModal(false);
    } catch (err) {
      setError(err?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSubmitting(true);
    setError('');
    try {
      await onSaveCourseEdits(editingCourse._id, editingCourse);
      setEditingCourse(null);
    } catch (err) {
      setError(err?.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title or description..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white outline-none shrink-0"
          >
            <option value="all">All Types</option>
            {courseTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(defaultForm);
            setError('');
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={15} />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <BookOpen size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No courses found</h4>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or add a new course.</p>
          </div>
        ) : (
          filteredCourses.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all group"
            >
              <div>
                {/* Image Cover or Fallback */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <BookOpen size={40} className="text-slate-300" />
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0B1528]/80 text-white backdrop-blur-xs">
                    {c.courseType || 'Program'}
                  </span>
                  {c.duration && (
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-slate-800 shadow-xs">
                      {c.duration}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {c.shortDescription || 'No description provided.'}
                  </p>

                  {/* Branch Prices Snippet */}
                  {c.branchPrices && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {c.branchPrices.iaacCity && (
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          City: Rs. {c.branchPrices.iaacCity}
                        </span>
                      )}
                      {c.branchPrices.airportAcademy && (
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          Airport: Rs. {c.branchPrices.airportAcademy}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {c.totalCourseFee ? `Total: Rs. ${c.totalCourseFee}` : 'Fee on request'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourse({
                        ...c,
                        imagePreview: c.imageUrl || '',
                        branchPrices: c.branchPrices || { iaacCity: '', airportAcademy: '', iaacCenter: '' },
                      });
                      setError('');
                    }}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 transition"
                    title="Edit Course"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(c._id)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-500 text-slate-600 hover:text-rose-600 transition"
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Course Modal */}
      {(showAddModal || editingCourse) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCourse ? 'Edit Course' : 'Create New Diploma Course'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCourse(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={editingCourse ? handleEditSubmit : handleCreateSubmit}
              className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
            >
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCourse ? editingCourse.title : form.title}
                    onChange={(e) => {
                      if (editingCourse) setEditingCourse({ ...editingCourse, title: e.target.value });
                      else setForm({ ...form, title: e.target.value });
                    }}
                    placeholder="e.g. Higher National Diploma in Aviation Management"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCourse ? editingCourse.duration : form.duration}
                    onChange={(e) => {
                      if (editingCourse) setEditingCourse({ ...editingCourse, duration: e.target.value });
                      else setForm({ ...form, duration: e.target.value });
                    }}
                    placeholder="e.g. 1 Year / 6 Months"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Course Type & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Course Type *
                  </label>
                  <select
                    value={editingCourse ? editingCourse.courseType : form.courseType}
                    onChange={(e) => {
                      if (editingCourse) setEditingCourse({ ...editingCourse, courseType: e.target.value });
                      else setForm({ ...form, courseType: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  >
                    {courseTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Total Course Fee (LKR)
                  </label>
                  <input
                    type="text"
                    value={editingCourse ? (editingCourse.totalCourseFee || '') : form.totalCourseFee}
                    onChange={(e) => {
                      if (editingCourse) setEditingCourse({ ...editingCourse, totalCourseFee: e.target.value });
                      else setForm({ ...form, totalCourseFee: e.target.value });
                    }}
                    placeholder="e.g. 350,000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Branch Prices */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Branch Specific Pricing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="IAAC City Academy"
                    value={editingCourse ? (editingCourse.branchPrices?.iaacCity || '') : form.branchPrices.iaacCity}
                    onChange={(e) => {
                      if (editingCourse) {
                        setEditingCourse({
                          ...editingCourse,
                          branchPrices: { ...editingCourse.branchPrices, iaacCity: e.target.value },
                        });
                      } else {
                        setForm({
                          ...form,
                          branchPrices: { ...form.branchPrices, iaacCity: e.target.value },
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Airport Academy"
                    value={editingCourse ? (editingCourse.branchPrices?.airportAcademy || '') : form.branchPrices.airportAcademy}
                    onChange={(e) => {
                      if (editingCourse) {
                        setEditingCourse({
                          ...editingCourse,
                          branchPrices: { ...editingCourse.branchPrices, airportAcademy: e.target.value },
                        });
                      } else {
                        setForm({
                          ...form,
                          branchPrices: { ...form.branchPrices, airportAcademy: e.target.value },
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="IAAC Center"
                    value={editingCourse ? (editingCourse.branchPrices?.iaacCenter || '') : form.branchPrices.iaacCenter}
                    onChange={(e) => {
                      if (editingCourse) {
                        setEditingCourse({
                          ...editingCourse,
                          branchPrices: { ...editingCourse.branchPrices, iaacCenter: e.target.value },
                        });
                      } else {
                        setForm({
                          ...form,
                          branchPrices: { ...form.branchPrices, iaacCenter: e.target.value },
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={editingCourse ? (editingCourse.shortDescription || '') : form.shortDescription}
                  onChange={(e) => {
                    if (editingCourse) setEditingCourse({ ...editingCourse, shortDescription: e.target.value });
                    else setForm({ ...form, shortDescription: e.target.value });
                  }}
                  placeholder="Overview of syllabus, career pathways, and academic accreditation..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Course Banner Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, Boolean(editingCourse))}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {(editingCourse ? editingCourse.imagePreview : form.imagePreview) && (
                    <img
                      src={editingCourse ? editingCourse.imagePreview : form.imagePreview}
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
                    setEditingCourse(null);
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
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Course</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this course? This action cannot be reversed.
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
                  await onDeleteCourse(confirmDeleteId);
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
