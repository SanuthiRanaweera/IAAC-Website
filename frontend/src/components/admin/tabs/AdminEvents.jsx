import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Calendar, Clock, Pencil, Trash2, X, Check,
  Image as ImageIcon, MapPin, Sparkles
} from 'lucide-react';

export default function AdminEvents({
  events = [],
  onCreateEvent,
  onSaveEventEdits,
  onDeleteEvent,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const defaultForm = {
    title: '',
    description: '',
    eventDate: '',
    imageData: '',
    imagePreview: '',
    galleryImages: [],
  };
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.description || '').toLowerCase().includes(q)
      );
    });
  }, [events, searchQuery]);

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
        setEditingEvent((prev) => ({
          ...prev,
          imageData: reader.result,
          imagePreview: reader.result,
          galleryImages: [reader.result],
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          imageData: reader.result,
          imagePreview: reader.result,
          galleryImages: [reader.result],
        }));
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
      await onCreateEvent(form);
      setForm(defaultForm);
      setShowAddModal(false);
    } catch (err) {
      setError(err?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    setError('');
    try {
      await onSaveEventEdits(editingEvent._id, editingEvent);
      setEditingEvent(null);
    } catch (err) {
      setError(err?.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
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
          <span>Add New Event</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No events found</h4>
            <p className="text-xs text-slate-400 mt-1">Schedule a new upcoming event for the IAAC website.</p>
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all group"
            >
              <div>
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {ev.imageUrl ? (
                    <img
                      src={ev.imageUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Calendar size={40} className="text-slate-300" />
                  )}
                  {ev.eventDate && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0B1528]/85 text-white backdrop-blur-xs flex items-center gap-1">
                      <Calendar size={11} className="text-blue-300" />
                      {new Date(ev.eventDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {ev.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  {ev.createdAt ? `Added ${new Date(ev.createdAt).toLocaleDateString()}` : 'Event'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent({
                        ...ev,
                        eventDate: ev.eventDate ? new Date(ev.eventDate).toISOString().split('T')[0] : '',
                        imagePreview: ev.imageUrl || '',
                      });
                      setError('');
                    }}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 transition"
                    title="Edit Event"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(ev._id)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-500 text-slate-600 hover:text-rose-600 transition"
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={editingEvent ? handleEditSubmit : handleCreateSubmit}
              className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
            >
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent ? editingEvent.title : form.title}
                  onChange={(e) => {
                    if (editingEvent) setEditingEvent({ ...editingEvent, title: e.target.value });
                    else setForm({ ...form, title: e.target.value });
                  }}
                  placeholder="e.g. Annual Aviation Career Fair & Graduation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Scheduled Event Date
                </label>
                <input
                  type="date"
                  value={editingEvent ? editingEvent.eventDate : form.eventDate}
                  onChange={(e) => {
                    if (editingEvent) setEditingEvent({ ...editingEvent, eventDate: e.target.value });
                    else setForm({ ...form, eventDate: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editingEvent ? (editingEvent.description || '') : form.description}
                  onChange={(e) => {
                    if (editingEvent) setEditingEvent({ ...editingEvent, description: e.target.value });
                    else setForm({ ...form, description: e.target.value });
                  }}
                  placeholder="Event schedule, venue, keynote speakers, and participant guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Event Poster / Banner
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, Boolean(editingEvent))}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {(editingEvent ? editingEvent.imagePreview : form.imagePreview) && (
                    <img
                      src={editingEvent ? editingEvent.imagePreview : form.imagePreview}
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
                    setEditingEvent(null);
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
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
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
              <h3 className="text-base font-bold text-slate-900">Delete Event</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this event?
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
                  await onDeleteEvent(confirmDeleteId);
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
