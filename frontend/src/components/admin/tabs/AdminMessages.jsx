import React, { useState, useMemo } from 'react';
import { 
  Search, MessageSquare, CheckCircle, Clock, Trash2, Eye,
  Mail, Phone, Calendar, User, X, Check, ExternalLink, RotateCcw
} from 'lucide-react';

export default function AdminMessages({
  messages = [],
  onMarkMessageDone,
  onDeleteMessage,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'done'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const subj = (m.subject || '').toLowerCase();
      const body = (m.message || '').toLowerCase();

      if (q && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !subj.includes(q) && !body.includes(q)) {
        return false;
      }

      if (statusFilter === 'new' && m.isDone) return false;
      if (statusFilter === 'done' && !m.isDone) return false;

      return true;
    });
  }, [messages, searchQuery, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
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
            placeholder="Search inquiries by name, email, subject..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
          >
            <option value="all">All Messages ({messages.length})</option>
            <option value="new">New / Unread ({messages.filter((m) => !m.isDone).length})</option>
            <option value="done">Processed ({messages.filter((m) => m.isDone).length})</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
              title="Reset filters"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Student Inquiries & Contact Messages
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {filteredMessages.length} records
            </span>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <MessageSquare size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No inquiries found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are no student inquiries matching your current criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 sm:pl-6">Sender</th>
                  <th className="py-3.5 px-3">Contact</th>
                  <th className="py-3.5 px-3">Subject & Message</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-4 sm:pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.map((msg) => {
                  const initials = (msg.name || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isDone = Boolean(msg.isDone);

                  return (
                    <tr
                      key={msg.id}
                      className="hover:bg-slate-50/90 transition-colors group"
                    >
                      {/* Sender */}
                      <td className="py-3.5 pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                            isDone ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate text-[13px]">
                              {msg.name}
                            </p>
                            {msg.academy && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {msg.academy}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="space-y-0.5">
                          <p className="truncate text-slate-700">{msg.email || '-'}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{msg.phone || '-'}</p>
                        </div>
                      </td>

                      {/* Subject & Preview */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {msg.subject || 'No subject'}
                        </p>
                        <p className="text-slate-500 text-[11px] truncate">
                          {msg.message || '-'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isDone
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle size={12} className="text-slate-500" />
                              <span>Processed</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} className="text-rose-600" />
                              <span>New Inquiry</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(msg)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                            title="View Full Message"
                          >
                            <Eye size={15} />
                          </button>

                          {!isDone && onMarkMessageDone && (
                            <button
                              type="button"
                              onClick={() => onMarkMessageDone(msg.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition flex items-center gap-1"
                              title="Mark as Processed"
                            >
                              <Check size={13} />
                              <span className="hidden sm:inline">Done</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Message"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Inquiry Details</h3>
                  <p className="text-xs text-slate-400">
                    Received on {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Campus / Academy</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.academy || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.phone || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Subject</span>
                <p className="font-bold text-slate-900 text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedMessage.subject || 'No subject'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Message Content</span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed text-slate-800 font-normal">
                  {selectedMessage.message || 'No message provided.'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {selectedMessage.email ? (
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Inquiry to IAAC')}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <Mail size={14} />
                  <span>Reply via Email</span>
                </a>
              ) : <div />}

              <div className="flex items-center gap-2">
                {!selectedMessage.isDone && onMarkMessageDone && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkMessageDone(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                  >
                    Mark as Processed
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
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
              <h3 className="text-base font-bold text-slate-900">Delete Message</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this message? This action cannot be undone.
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
                  await onDeleteMessage(confirmDeleteId);
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
