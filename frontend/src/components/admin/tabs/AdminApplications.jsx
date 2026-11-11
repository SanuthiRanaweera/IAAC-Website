import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, RotateCcw, Download, Eye, CheckCircle, 
  Clock, Trash2, Mail, Phone, MapPin, Calendar, BookOpen,
  User, Check, X, Printer, AlertTriangle, Award, Sparkles,
  ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminApplications({
  applications = [],
  selectedApplicationId,
  setSelectedApplicationId,
  onApproveApplication,
  onReviewApplication,
  onReopenApplication,
  onToggleApplicationDone,
  onDeleteApplication,
  onDownloadApplicationPdf,
  onPrintApplication,
  onExportReport,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'reviewed', 'approved'
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 rows of 3 cards on desktop

  // Confirm Approve Modal state
  const [confirmApproveApp, setConfirmApproveApp] = useState(null);
  const [approving, setApproving] = useState(false);

  // Confirm Review Modal state ("Mark as Checked")
  const [confirmReviewApp, setConfirmReviewApp] = useState(null);
  const [reviewReason, setReviewReason] = useState('Minimum qualifications not met');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Confirm Delete Modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Extract unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = new Set();
    applications.forEach((a) => {
      const c = a.course || a.courseApplied || a.program;
      if (c) courses.add(c.trim());
    });
    return Array.from(courses).sort();
  }, [applications]);

  // Extract unique years
  const uniqueYears = useMemo(() => {
    const years = new Set();
    applications.forEach((a) => {
      if (a.createdAt) {
        const dt = new Date(a.createdAt);
        if (!isNaN(dt.getTime())) years.add(dt.getFullYear());
      }
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [applications]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCourseFilter('all');
    setStatusFilter('all');
    setYearFilter('all');
    setMonthFilter('all');
    setCurrentPage(1);
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.trim().toLowerCase();
      const name = (app.fullName || app.name || '').toLowerCase();
      const email = (app.email || '').toLowerCase();
      const phone = (app.mobile || app.phone || app.contact || '').toLowerCase();
      const id = String(app.id || '').toLowerCase();
      const nic = (app.nic || '').toLowerCase();

      // Search matching
      if (q && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !id.includes(q) && !nic.includes(q)) {
        return false;
      }

      // Course filter
      if (courseFilter !== 'all') {
        const c = (app.course || app.courseApplied || app.program || '').trim();
        if (c !== courseFilter) return false;
      }

      // Status filter
      const isAppDone = Boolean(app.isDone || app.status === 'approved');
      const isAppReviewed = Boolean(!app.isDone && (app.reviewStatus === 'reviewed' || app.status === 'reviewed'));

      if (statusFilter === 'pending') {
        if (isAppDone || isAppReviewed) return false;
      } else if (statusFilter === 'reviewed') {
        if (!isAppReviewed) return false;
      } else if (statusFilter === 'approved') {
        if (!isAppDone) return false;
      }

      // Date filters
      if (app.createdAt) {
        const dt = new Date(app.createdAt);
        if (!isNaN(dt.getTime())) {
          if (yearFilter !== 'all' && dt.getFullYear() !== Number(yearFilter)) return false;
          if (monthFilter !== 'all' && dt.getMonth() + 1 !== Number(monthFilter)) return false;
        }
      }

      return true;
    });
  }, [applications, searchQuery, courseFilter, statusFilter, yearFilter, monthFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(start, start + itemsPerPage);
  }, [filteredApplications, currentPage]);

  // Selected Application for Details Modal
  const selectedApp = useMemo(() => {
    if (!selectedApplicationId) return null;
    return applications.find((a) => String(a.id) === String(selectedApplicationId)) || null;
  }, [applications, selectedApplicationId]);

  // Handle Approve Confirm
  const handleConfirmApprove = async () => {
    if (!confirmApproveApp) return;
    setApproving(true);
    try {
      await onApproveApplication(confirmApproveApp.id);
      setConfirmApproveApp(null);
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  // Handle Review Confirm ("Mark as Checked")
  const handleConfirmReview = async () => {
    if (!confirmReviewApp) return;
    setReviewing(true);
    try {
      if (onReviewApplication) {
        await onReviewApplication(confirmReviewApp.id, {
          reviewReason,
          reviewRemarks,
        });
      }
      setConfirmReviewApp(null);
      setReviewReason('Minimum qualifications not met');
      setReviewRemarks('');
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (isApproved, isReviewed, isRejected = false) => {
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
          <X size={12} className="text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    }
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0">
          <Check size={12} className="text-emerald-700 stroke-[2.5]" />
          <span>✓ Approved</span>
        </span>
      );
    }
    if (isReviewed) {
      return (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs">
            <Check size={12} className="text-slate-600 stroke-[2.5]" />
            <span>✓ Reviewed</span>
          </span>
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
            Does Not Meet Requirements
          </span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        <Clock size={12} className="text-amber-600" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, ID, phone, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {onExportReport && (
              <button
                type="button"
                onClick={onExportReport}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Course
            </label>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Courses ({uniqueCourses.length})</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="reviewed">Reviewed – Not Eligible</option>
              <option value="approved">Approved Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Years</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Applications ({filteredApplications.length})
          </span>
          <span className="text-[11px] text-slate-400">
            • Showing {paginatedApplications.length} of {filteredApplications.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved ({applications.filter((a) => a.isDone || a.status === 'approved').length})
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Reviewed ({applications.filter((a) => !a.isDone && (a.reviewStatus === 'reviewed' || a.status === 'reviewed')).length})
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending ({applications.filter((a) => !a.isDone && a.reviewStatus !== 'reviewed' && a.status !== 'reviewed').length})
          </span>
        </div>
      </div>

      {/* RESTORED APPLICATIONS CARD GRID */}
      {paginatedApplications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <User size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No applications found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria or resetting filters to see records.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Responsive CSS Grid: 3 cards per row on desktop, 2 on tablet, 1 on mobile */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {paginatedApplications.map((app) => {
            const name = app.fullName || app.name || 'Unnamed Applicant';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const isApproved = Boolean(app.isDone || app.status === 'approved');
            const isReviewed = Boolean(!app.isDone && (app.reviewStatus === 'reviewed' || app.status === 'reviewed'));
            const isRejected = app.status === 'rejected';
            const courseTitle = app.course || app.courseApplied || app.program || 'General Program';
            const phone = app.mobile || app.phone || app.contact || '-';
            const dateStr = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-';

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                key={app.id}
                className={`rounded-2xl border p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-w-0 transition-all duration-[250ms] ease-out motion-reduce:transition-none ${
                  isApproved || isReviewed
                    ? 'bg-[#E5E7EB] border-[#CBD5E1] shadow-none hover:border-slate-400/60'
                    : isRejected
                    ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                    : 'bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Card Header: Initials Avatar, Course Badge & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs transition-colors duration-[250ms] ${
                          isApproved || isReviewed
                            ? 'bg-slate-300/80 text-slate-700 border border-slate-400/40'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200/60'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        {/* Student full name - NO strikethrough styling! */}
                        <h4
                          className={`font-bold text-sm sm:text-base truncate leading-snug transition-colors duration-[250ms] ${
                            isApproved || isReviewed
                              ? 'text-slate-700'
                              : isRejected
                              ? 'text-rose-950'
                              : 'text-slate-900'
                          }`}
                        >
                          {name}
                        </h4>
                        <p
                          className={`text-[11px] font-mono truncate transition-colors duration-[250ms] ${
                            isApproved || isReviewed ? 'text-[#64748B]' : 'text-slate-400'
                          }`}
                        >
                          ID: {String(app.id).slice(-8)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {renderStatusBadge(isApproved, isReviewed, isRejected)}
                    </div>
                  </div>

                  {/* Course Badge & Campus */}
                  <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider truncate max-w-full transition-colors duration-[250ms] ${
                        isApproved || isReviewed
                          ? 'bg-slate-200/90 text-slate-700 border border-slate-300'
                          : isRejected
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}
                    >
                      {courseTitle}
                    </span>
                    {app.academy && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium truncate transition-colors duration-[250ms] ${
                          isApproved || isReviewed
                            ? 'bg-slate-200/70 text-slate-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {app.academy}
                      </span>
                    )}
                  </div>

                  {/* Contact & Date Details */}
                  <div
                    className={`space-y-1.5 py-2.5 border-t text-xs transition-colors duration-[250ms] ${
                      isApproved || isReviewed
                        ? 'border-slate-300/70 text-slate-600'
                        : 'border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Phone
                        size={13}
                        className={`shrink-0 transition-colors duration-[250ms] ${
                          isApproved || isReviewed ? 'text-[#64748B]' : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={`font-medium font-mono text-[11px] ${
                          isApproved || isReviewed ? 'text-slate-700' : 'text-slate-800'
                        }`}
                      >
                        {phone}
                      </span>
                    </div>
                    {app.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail
                          size={13}
                          className={`shrink-0 transition-colors duration-[250ms] ${
                            isApproved || isReviewed ? 'text-[#64748B]' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`truncate text-[11px] ${
                            isApproved || isReviewed ? 'text-[#64748B]' : 'text-slate-600'
                          }`}
                        >
                          {app.email}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-2 text-[11px] transition-colors duration-[250ms] ${
                        isApproved || isReviewed ? 'text-[#64748B]' : 'text-slate-400'
                      }`}
                    >
                      <Calendar size={13} className="shrink-0" />
                      <span>Applied: {dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  className={`pt-3.5 border-t flex items-center justify-between gap-2 mt-2 transition-colors duration-[250ms] ${
                    isApproved || isReviewed ? 'border-slate-300/70' : 'border-slate-100'
                  }`}
                >
                  {/* View Details Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedApplicationId(app.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
                      isApproved || isReviewed
                        ? 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/70'
                    }`}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Status & Review Action Buttons */}
                    {isApproved ? (
                      /* Approved State: Done status toggle */
                      <button
                        type="button"
                        onClick={() => onToggleApplicationDone(app.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-300 font-medium text-xs transition flex items-center gap-1"
                        title="Click to revert status to Pending Review"
                      >
                        <CheckCircle size={13} className="text-emerald-600" />
                        <span>Done</span>
                      </button>
                    ) : isReviewed ? (
                      /* Reviewed State: Reopen button or Approve button */
                      <>
                        <button
                          type="button"
                          onClick={() => onReopenApplication && onReopenApplication(app.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-300 font-medium text-xs transition flex items-center gap-1 shadow-2xs"
                          title="Reopen application for pending review"
                        >
                          <RotateCcw size={12} className="text-slate-500" />
                          <span>Reopen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmApproveApp(app)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs hover:shadow"
                          title="Approve & Send Congratulations Email (if new info provided)"
                        >
                          <Award size={13} />
                          <span>Approve</span>
                        </button>
                      </>
                    ) : (
                      /* Pending State: Mark Checked button & Approve & Send Email button */
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmReviewApp(app)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
                          title="Mark this application as reviewed without approving (No email sent)"
                        >
                          <CheckCircle size={13} className="text-slate-600" />
                          <span>Mark Checked</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmApproveApp(app)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs hover:shadow"
                          title="Approve & Send Congratulations Email"
                        >
                          <Award size={14} />
                          <span>Approve</span>
                        </button>
                      </>
                    )}

                    {/* Download PDF */}
                    {onDownloadApplicationPdf && (
                      <button
                        type="button"
                        onClick={() => onDownloadApplicationPdf(app)}
                        className={`p-1.5 rounded-xl transition border ${
                          isApproved || isReviewed
                            ? 'bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200/60'
                        }`}
                        title="Download Application PDF"
                      >
                        <Download size={14} />
                      </button>
                    )}

                    {/* Delete Application */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(app.id)}
                      className={`p-1.5 rounded-xl transition ${
                        isApproved || isReviewed
                          ? 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                          : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                      }`}
                      title="Delete Application"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages} ({filteredApplications.length} total applications)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, currentPage - 3),
              Math.min(totalPages, currentPage + 2)
            ).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                  currentPage === p
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Full Student Details Modal / Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center shadow-xs ${
                  selectedApp.isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {(selectedApp.fullName || selectedApp.name || 'S')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedApp.fullName || selectedApp.name || 'Student Details'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">
                      Ref ID: {selectedApp.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedApp.isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedApp.reviewStatus === 'reviewed' || selectedApp.status === 'reviewed'
                        ? 'bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedApp.isDone
                        ? 'Approved & Enrolled'
                        : selectedApp.reviewStatus === 'reviewed' || selectedApp.status === 'reviewed'
                        ? 'Reviewed — Does Not Meet Requirements'
                        : 'Pending Review'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplicationId(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Internal Review Remarks Banner */}
              {(selectedApp.reviewStatus === 'reviewed' || selectedApp.status === 'reviewed') && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300 w-fit">
                      <CheckCircle size={12} className="text-slate-600" />
                      Reviewed — Does Not Meet Requirements
                    </span>
                    {selectedApp.reviewedAt && (
                      <span className="text-[11px] text-slate-500">
                        Checked on {new Date(selectedApp.reviewedAt).toLocaleDateString()} by {selectedApp.reviewedBy || 'Admin'}
                      </span>
                    )}
                  </div>
                  {selectedApp.reviewReason && (
                    <div className="text-xs">
                      <span className="font-bold text-slate-700">Review Reason: </span>
                      <span className="text-slate-900 font-medium">{selectedApp.reviewReason}</span>
                    </div>
                  )}
                  {selectedApp.reviewRemarks && (
                    <div className="text-xs bg-white/80 p-3 rounded-xl border border-slate-200 text-slate-700">
                      <span className="font-bold text-slate-700 block mb-0.5">Internal Remarks (Confidential):</span>
                      <p className="italic text-slate-800">{selectedApp.reviewRemarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Program Overview Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
                    Enrolled Diploma Programme
                  </span>
                  <h4 className="text-base font-black">
                    {selectedApp.course || selectedApp.courseApplied || selectedApp.program || 'Aviation Diploma'}
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Campus: {selectedApp.academy || 'General Campus'} • Referral: {selectedApp.referral || 'Direct / Online'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                    Submission Date
                  </span>
                  <p className="text-xs font-semibold">
                    {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              {/* Personal Information Grid */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <User size={14} className="text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Title</span>
                    <span className="font-semibold text-slate-800">{selectedApp.title || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                    <span className="font-semibold text-slate-800">{selectedApp.fullName || selectedApp.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">NIC / Passport</span>
                    <span className="font-semibold text-slate-800">{selectedApp.nic || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                    <span className="font-semibold text-slate-800">
                      {selectedApp.dob ? new Date(selectedApp.dob).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                    <span className="font-semibold text-slate-800">{selectedApp.gender || '-'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Home Address</span>
                    <span className="font-semibold text-slate-800">{selectedApp.homeAddress || selectedApp.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Phone size={14} className="text-blue-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-semibold text-slate-800">{selectedApp.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Number</span>
                    <span className="font-semibold text-slate-800">{selectedApp.mobile || selectedApp.contact || selectedApp.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Number</span>
                    <span className="font-semibold text-slate-800">{selectedApp.whatsapp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Education & GCE O/L Results */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-600" />
                  Academic History & G.C.E. O/L Results
                </h4>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">School Attended</span>
                      <span className="font-semibold text-slate-800">{selectedApp.school || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">O/L Year</span>
                      <span className="font-semibold text-slate-800">{selectedApp.olYear || '-'}</span>
                    </div>
                  </div>

                  {selectedApp.olResults && typeof selectedApp.olResults === 'object' && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-2">
                        Subject Performance
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(selectedApp.olResults).map(([subject, grade]) => (
                          <div
                            key={subject}
                            className="bg-white p-2 rounded-lg border border-slate-200 text-center"
                          >
                            <span className="text-[10px] font-medium text-slate-400 uppercase block truncate">
                              {subject}
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              {grade || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <User size={14} className="text-blue-600" />
                  Parent / Guardian Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Guardian Name</span>
                    <span className="font-semibold text-slate-800">{selectedApp.parentName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Guardian Phone</span>
                    <span className="font-semibold text-slate-800">{selectedApp.parentPhone || selectedApp.parentMobile || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onDownloadApplicationPdf && (
                  <button
                    type="button"
                    onClick={() => onDownloadApplicationPdf(selectedApp)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                )}

                {onPrintApplication && (
                  <button
                    type="button"
                    onClick={() => onPrintApplication(selectedApp)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Print Form</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.isDone ? (
                  <button
                    type="button"
                    onClick={() => onToggleApplicationDone(selectedApp.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                  >
                    Revert to Pending
                  </button>
                ) : selectedApp.reviewStatus === 'reviewed' || selectedApp.status === 'reviewed' ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (onReopenApplication) {
                          await onReopenApplication(selectedApp.id);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw size={13} className="text-slate-500" />
                      <span>Reopen for Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmApproveApp(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <Award size={15} />
                      <span>Approve & Send Email</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmReviewApp(selectedApp)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                      title="Mark as Checked without approving (No email will be sent)"
                    >
                      <CheckCircle size={14} className="text-slate-600" />
                      <span>Mark Checked</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmApproveApp(selectedApp);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <Award size={15} />
                      <span>Approve & Send Email</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedApplicationId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Marking as Checked / Reviewed */}
      {confirmReviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle size={24} className="text-slate-600" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mark Application as Checked
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mark this application as reviewed without approving the student?{' '}
                <span className="font-semibold text-slate-700">
                  No approval email will be sent
                </span>, and no enrollment record will be created.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason (Why applicant does not meet criteria)
                </label>
                <select
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                >
                  <option value="Minimum qualifications not met">Minimum qualifications not met</option>
                  <option value="Age requirement not met">Age requirement not met</option>
                  <option value="Required documents missing">Required documents missing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Remarks (Optional - Not visible to student)
                </label>
                <textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g., Student does not meet the minimum educational qualification required for this course."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => {
                  setConfirmReviewApp(null);
                  setReviewRemarks('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={handleConfirmReview}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-slate-900/20"
              >
                {reviewing ? (
                  <span>Saving Review...</span>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Confirm Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approval & Sending Email */}
      {confirmApproveApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Mail size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Application Approval
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are approving the application for{' '}
                <span className="font-semibold text-slate-800">
                  {confirmApproveApp.fullName || confirmApproveApp.name}
                </span>. An automated Congratulations & Enrolment email with official details will be dispatched to{' '}
                <span className="font-semibold text-slate-800">{confirmApproveApp.email}</span>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                Please ensure the student meets minimum entry prerequisites before proceeding.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={approving}
                onClick={() => setConfirmApproveApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={handleConfirmApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {approving ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete Application
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this application? This action cannot be undone.
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
                  await onDeleteApplication(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
