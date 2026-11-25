import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserCheck, Clock, CheckCircle2, Plus, Link as LinkIcon, 
  Copy, ExternalLink, RefreshCw, Search, Filter, Eye, Pencil, 
  Trash2, Download, Printer, MoreVertical, X, Check, AlertTriangle, 
  Calendar, School, ShieldCheck, Award, MapPin, Phone, Mail, FileText,
  ChevronDown, RotateCcw
} from 'lucide-react';
import apiClient from '../../../services/apiClient';

// Helper to extract student initials
function getStudentInitials(fullName) {
  if (!fullName) return 'ST';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Subcomponent: Status Badge
function ApplicationStatusBadge({ status }) {
  const isCompleted = status === 'Completed';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
          : 'bg-amber-50 text-amber-700 border border-amber-200/90'
      }`}
    >
      {isCompleted ? (
        <CheckCircle2 size={12} className="stroke-[2.5]" />
      ) : (
        <Clock size={12} className="stroke-[2.5]" />
      )}
      <span>{status}</span>
    </span>
  );
}

// Subcomponent: Card Skeleton Loader
function ApplicationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-[280px] animate-pulse">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-5 w-18 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-2">
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
        <div className="flex gap-1.5">
          <div className="h-7 w-7 bg-slate-100 rounded-lg" />
          <div className="h-7 w-7 bg-slate-100 rounded-lg" />
          <div className="h-7 w-7 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Individual Student Application Card
function PastStudentApplicationCard({
  app,
  onView,
  onEdit,
  onDownloadPdf,
  onPrintApp,
  onComplete,
  onReopen,
  onDelete,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}) {
  const isCompleted = app.status === 'Completed';
  const initials = getStudentInitials(app.fullName);

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-full relative ${
        isCompleted
          ? 'bg-emerald-50/25 border-emerald-200/80 border-l-4 border-l-emerald-500 shadow-xs hover:shadow-md hover:border-emerald-300'
          : 'bg-white border-slate-200/90 border-l-4 border-l-amber-500 shadow-xs hover:shadow-md hover:border-slate-300'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Student Avatar */}
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none shadow-2xs ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-100'
              }`}
            >
              {initials}
            </div>

            {/* Name & Student ID */}
            <div className="min-w-0">
              <h3
                className="font-bold text-sm text-slate-900 leading-snug line-clamp-1"
                title={app.fullName}
              >
                {app.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100/60 inline-block">
                  {app.studentId}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <ApplicationStatusBadge status={app.status} />
        </div>

        {/* Card Information */}
        <div className="space-y-2 text-xs pt-1">
          {/* Certificate Name */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Certificate Name:</span>
            <span
              className="font-semibold text-slate-800 text-right truncate max-w-[190px]"
              title={app.certificateName}
            >
              {app.certificateName || '-'}
            </span>
          </div>

          {/* Registered Diploma */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Programme:</span>
            <span
              className="font-semibold text-blue-700 text-right line-clamp-2 max-w-[210px] leading-tight"
              title={app.diplomaProgramme}
            >
              {app.diplomaProgramme || '-'}
            </span>
          </div>

          {/* Mobile Number */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Mobile Number:</span>
            <span className="font-mono text-slate-700 font-medium">
              {app.mobileNumber || '-'}
            </span>
          </div>

          {/* Submission Date */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Submitted:</span>
            <span className="text-slate-600 font-medium">
              {app.createdAt
                ? new Date(app.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </span>
          </div>

          {/* Reference Number */}
          <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-dashed border-slate-100">
            <span className="text-[10px] font-medium text-slate-400 shrink-0">Reference:</span>
            <span className="font-mono text-[10px] text-slate-500 font-medium select-all">
              {app.applicationRef}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between">
        {/* Primary Action: View Application */}
        <button
          type="button"
          onClick={() => onView(app)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition shadow-2xs"
          title="View Full Application Details"
        >
          <Eye size={13} className="text-blue-600" />
          <span>View</span>
        </button>

        {/* Secondary Action Icons + 3-Dot Menu */}
        <div className="flex items-center gap-1">
          {/* Download PDF */}
          <button
            type="button"
            onClick={() => onDownloadPdf(app)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg transition"
            title="Download PDF"
            aria-label="Download PDF"
          >
            <Download size={15} />
          </button>

          {/* Print Application */}
          <button
            type="button"
            onClick={() => onPrintApp(app)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Print Application"
            aria-label="Print Application"
          >
            <Printer size={15} />
          </button>

          {/* Three-Dot More Actions Menu */}
          <div className="relative action-menu-container">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(app._id);
              }}
              className={`p-1.5 rounded-lg transition ${
                isMenuOpen
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="More Actions"
              aria-label="More Actions"
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 divide-y divide-slate-100 text-left animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onView(app);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                  >
                    <Eye size={13} />
                    <span>View Full Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onEdit(app);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                  >
                    <Pencil size={13} />
                    <span>Edit Application</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadPdf(app);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onPrintApp(app);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                  >
                    <Printer size={13} />
                    <span>Print Application</span>
                  </button>
                </div>

                <div className="py-1">
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        onComplete(app);
                        onCloseMenu();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition font-bold"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Mark as Completed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onReopen(app);
                        onCloseMenu();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition font-bold"
                    >
                      <Clock size={13} className="text-amber-600" />
                      <span>Reopen Application</span>
                    </button>
                  )}
                </div>

                {isCompleted && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(app);
                        onCloseMenu();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition font-bold"
                    >
                      <Trash2 size={13} />
                      <span>Permanently Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AdminPastStudents({
  courses = [],
  onDownloadPdf,
  onPrintApp,
  showToast,
}) {
  // Statistics State
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    completedApplications: 0,
    applicationsToday: 0,
    totalLinks: 0,
    activeLinks: 0,
  });

  // Active Stat Card Filter Tracker
  const [activeKpiFilter, setActiveKpiFilter] = useState('all'); // 'all', 'Pending', 'Completed', 'today'

  // Applications & Pagination State
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12); // Clean 12 items per page for 3/2-column grid

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [diplomaFilter, setDiplomaFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showDatePopover, setShowDatePopover] = useState(false);

  // Links Drawer / Modal State
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [linksList, setLinksList] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showCreateLinkForm, setShowCreateLinkForm] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // New Link Form State
  const [newLinkForm, setNewLinkForm] = useState({
    linkName: '',
    branch: '',
    diplomaProgramme: '',
    batch: '',
    expiresAt: '',
    isActive: true,
  });
  const [creatingLink, setCreatingLink] = useState(false);

  // Action Modals State
  const [viewingApp, setViewingApp] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmCompleteApp, setConfirmCompleteApp] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [confirmReopenApp, setConfirmReopenApp] = useState(null);
  const [reopening, setReopening] = useState(false);

  const [confirmDeleteApp, setConfirmDeleteApp] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Active Dropdown Row Action Menu
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/past-students/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch past student stats:', err);
    }
  }, []);

  // Fetch Applications with server-side filters
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter,
        diploma: diplomaFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort: sortOrder,
      };

      const res = await apiClient.get('/api/admin/past-students/applications', { params });
      setApplications(res.data.items || []);
      setTotalRecords(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      if (showToast) showToast('Failed to load past student applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, pageSize, searchQuery, statusFilter, 
    diplomaFilter, startDate, endDate, sortOrder, showToast
  ]);

  // Fetch Links
  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    try {
      const res = await apiClient.get('/api/admin/past-students/links');
      setLinksList(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchStats();
    fetchApplications();
  }, [fetchStats, fetchApplications]);

  // Handle Refresh Click
  const handleRefresh = () => {
    fetchStats();
    fetchApplications();
    if (showToast) showToast('Applications refreshed');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
      if (!e.target.closest('.date-popover-container')) {
        setShowDatePopover(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Clickable KPI Card Filter Handlers
  const handleKpiCardClick = (kpiType) => {
    setCurrentPage(1);
    if (kpiType === 'all') {
      setActiveKpiFilter('all');
      setStatusFilter('all');
      setStartDate('');
      setEndDate('');
    } else if (kpiType === 'Pending') {
      setActiveKpiFilter('Pending');
      setStatusFilter('Pending');
      setStartDate('');
      setEndDate('');
    } else if (kpiType === 'Completed') {
      setActiveKpiFilter('Completed');
      setStatusFilter('Completed');
      setStartDate('');
      setEndDate('');
    } else if (kpiType === 'today') {
      setActiveKpiFilter('today');
      setStatusFilter('all');
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDiplomaFilter('all');
    setStartDate('');
    setEndDate('');
    setSortOrder('newest');
    setActiveKpiFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || diplomaFilter !== 'all' || startDate || endDate || sortOrder !== 'newest'
  );

  // Handle Create Link
  const handleCreateLinkSubmit = async (e) => {
    e.preventDefault();
    if (!newLinkForm.linkName.trim()) {
      alert('Please enter a link name');
      return;
    }

    setCreatingLink(true);
    try {
      await apiClient.post('/api/admin/past-students/links', newLinkForm);
      setNewLinkForm({
        linkName: '',
        branch: '',
        diplomaProgramme: '',
        batch: '',
        expiresAt: '',
        isActive: true,
      });
      setShowCreateLinkForm(false);
      fetchLinks();
      fetchStats();
      if (showToast) showToast('Public application link generated successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to generate link');
    } finally {
      setCreatingLink(false);
    }
  };

  // Handle Copy Link
  const handleCopyLink = (token, linkId) => {
    const origin = window.location.origin;
    const url = `${origin}/past-students/apply/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
    if (showToast) showToast('Application link copied to clipboard');
  };

  // Handle Toggle Link Active Status
  const handleToggleLinkActive = async (link) => {
    try {
      await apiClient.patch(`/api/admin/past-students/links/${link._id}`, {
        isActive: !link.isActive,
      });
      fetchLinks();
      fetchStats();
      if (showToast) showToast(`Link ${!link.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      alert('Failed to update link status');
    }
  };

  // Handle Delete Link
  const handleDeleteLink = async (link) => {
    if (link.submissionCount > 0) {
      const confirmDelete = window.confirm(
        `This link already has ${link.submissionCount} submitted application(s). Deleting it will unlink existing applications. Are you sure you want to proceed?`
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = window.confirm(`Delete application link "${link.linkName}"?`);
      if (!confirmDelete) return;
    }

    try {
      await apiClient.delete(`/api/admin/past-students/links/${link._id}?force=true`);
      fetchLinks();
      fetchStats();
      if (showToast) showToast('Link deleted successfully');
    } catch (err) {
      alert('Failed to delete link');
    }
  };

  // Handle Mark as Completed
  const handleConfirmComplete = async () => {
    if (!confirmCompleteApp) return;
    setCompleting(true);
    try {
      await apiClient.patch(`/api/admin/past-students/applications/${confirmCompleteApp._id}/status`, {
        status: 'Completed',
      });
      setConfirmCompleteApp(null);
      fetchStats();
      fetchApplications();
      if (showToast) showToast('Application marked as Completed');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to complete application');
    } finally {
      setCompleting(false);
    }
  };

  // Handle Reopen Application
  const handleConfirmReopen = async () => {
    if (!confirmReopenApp) return;
    setReopening(true);
    try {
      await apiClient.patch(`/api/admin/past-students/applications/${confirmReopenApp._id}/status`, {
        status: 'Pending',
      });
      setConfirmReopenApp(null);
      fetchStats();
      fetchApplications();
      if (showToast) showToast('Application reopened to Pending');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reopen application');
    } finally {
      setReopening(false);
    }
  };

  // Handle Permanent Delete Application
  const handleConfirmDelete = async () => {
    if (!confirmDeleteApp) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/past-students/applications/${confirmDeleteApp._id}`);
      setConfirmDeleteApp(null);
      fetchStats();
      fetchApplications();
      if (showToast) showToast('Application permanently deleted from database');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  };

  // Handle Save Edit Application
  const handleSaveAppEdit = async (e) => {
    e.preventDefault();
    if (!editingApp) return;

    setSavingEdit(true);
    try {
      await apiClient.patch(`/api/admin/past-students/applications/${editingApp._id}`, {
        fullName: editingApp.fullName,
        certificateName: editingApp.certificateName,
        dob: editingApp.dob,
        gender: editingApp.gender,
        residentialAddress: editingApp.residentialAddress,
        email: editingApp.email,
        mobileNumber: editingApp.mobileNumber,
        whatsappNumber: editingApp.whatsappNumber,
        diplomaProgramme: editingApp.diplomaProgramme,
        branch: editingApp.branch,
        batch: editingApp.batch,
        editReason: editReason || 'Administrative update',
      });
      setEditingApp(null);
      setEditReason('');
      fetchApplications();
      if (showToast) showToast('Application details updated successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update application');
    } finally {
      setSavingEdit(false);
    }
  };

  // Unique diploma list for filter
  const diplomaOptions = useMemo(() => {
    const list = courses.map((c) => c.title);
    return Array.from(new Set(list)).filter(Boolean);
  }, [courses]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Header & Unified Action Row (Clean, uncluttered, no duplicate labels)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Past Students Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect and manage application records from previously registered IAAC students.
          </p>
        </div>

        {/* Unified Action Buttons in a single row */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Generate Link */}
          <button
            type="button"
            onClick={() => {
              setShowLinksModal(true);
              setShowCreateLinkForm(true);
              fetchLinks();
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0B1528] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs shrink-0"
          >
            <Plus size={15} />
            <span>Generate Link</span>
          </button>

          {/* Manage Links */}
          <button
            type="button"
            onClick={() => {
              setShowLinksModal(true);
              setShowCreateLinkForm(false);
              fetchLinks();
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-2xs shrink-0"
          >
            <LinkIcon size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Manage Links</span>
            <span className="sm:hidden">Links</span>
            {stats.totalLinks > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black">
                {stats.totalLinks}
              </span>
            )}
          </button>

          {/* Preview Form */}
          <a
            href="/past-students/preview?preview=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Preview Public Application Form"
          >
            <Eye size={14} className="text-slate-500" />
            <span className="hidden md:inline">Preview</span>
          </a>

          {/* Refresh Applications */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Refresh Applications"
            aria-label="Refresh Applications"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Four Compact & Clickable Statistics Cards                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Applications */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('all')}
          className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3.5 text-left transition-all ${
            activeKpiFilter === 'all' && statusFilter === 'all' && !startDate
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Applications
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight block">
              {stats.totalApplications}
            </span>
          </div>
        </button>

        {/* Card 2: Pending Applications */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('Pending')}
          className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3.5 text-left transition-all ${
            statusFilter === 'Pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight leading-tight block">
              {stats.pendingApplications}
            </span>
          </div>
        </button>

        {/* Card 3: Completed Applications */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('Completed')}
          className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3.5 text-left transition-all ${
            statusFilter === 'Completed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight leading-tight block">
              {stats.completedApplications}
            </span>
          </div>
        </button>

        {/* Card 4: Received Today */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('today')}
          className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3.5 text-left transition-all ${
            activeKpiFilter === 'today'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Received Today
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight leading-tight block">
              {stats.applicationsToday}
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. Compact Filter Section Toolbar                                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, ID, NIC, or ref number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* Filter Dropdowns in a single row */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Status Dropdown */}
            <div className="min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActiveKpiFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Diploma Dropdown */}
            <div className="min-w-[150px] max-w-[200px]">
              <select
                value={diplomaFilter}
                onChange={(e) => {
                  setDiplomaFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer truncate"
              >
                <option value="all">All Diplomas</option>
                {diplomaOptions.map((prog, idx) => (
                  <option key={idx} value={prog}>{prog}</option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="min-w-[130px]">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="nameAsc">Name (A-Z)</option>
                <option value="studentId">Student ID</option>
              </select>
            </div>

            {/* Date Range Popover Button */}
            <div className="relative date-popover-container">
              <button
                type="button"
                onClick={() => setShowDatePopover(!showDatePopover)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition ${
                  startDate || endDate
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                    : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar size={14} className={startDate || endDate ? 'text-blue-600' : 'text-slate-400'} />
                <span>{startDate || endDate ? 'Date Filtered' : 'Dates'}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {/* Date Popover Box */}
              {showDatePopover && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Filter by Submission Date
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start Date:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Date:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setCurrentPage(1);
                        setShowDatePopover(false);
                      }}
                      className="w-full py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      Clear Date Range
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Reset all search and filter options"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status / Active Count Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{applications.length}</strong> of{' '}
            <strong className="text-slate-800">{totalRecords}</strong> applications
          </span>

          {hasActiveFilters && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100/60">
              Filtered View
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Responsive Card-Based Applications Grid                                */}
      {/* Grid: 3 cards on 2xl/xl, 2 on lg/sm, 1 on mobile                          */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ApplicationCardSkeleton key={idx} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {hasActiveFilters ? 'No applications match your search criteria.' : 'No student applications yet.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search terms or clearing current status, diploma, and date filters.'
                : 'Generate a public link and share it with past students to begin collecting records.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B1528] hover:bg-slate-800 rounded-xl transition shadow-xs mt-2"
            >
              <RotateCcw size={13} />
              <span>Clear Filters</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowLinksModal(true);
                setShowCreateLinkForm(true);
                fetchLinks();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B1528] hover:bg-slate-800 rounded-xl transition shadow-xs mt-2"
            >
              <Plus size={14} />
              <span>Generate Application Link</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {applications.map((app) => (
            <PastStudentApplicationCard
              key={app._id}
              app={app}
              onView={(target) => setViewingApp(target)}
              onEdit={(target) => {
                setEditingApp({ ...target });
                setEditReason('');
              }}
              onDownloadPdf={(target) => {
                if (onDownloadPdf) onDownloadPdf(target);
              }}
              onPrintApp={(target) => {
                if (onPrintApp) onPrintApp(target);
              }}
              onComplete={(target) => setConfirmCompleteApp(target)}
              onReopen={(target) => setConfirmReopenApp(target)}
              onDelete={(target) => setConfirmDeleteApp(target)}
              isMenuOpen={openActionMenuId === app._id}
              onToggleMenu={(id) => setOpenActionMenuId(openActionMenuId === id ? null : id)}
              onCloseMenu={() => setOpenActionMenuId(null)}
            />
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Pagination Controls                                                    */}
      {/* ========================================================================= */}
      {totalPages > 1 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex items-center justify-between text-xs text-slate-500 shadow-xs">
          <span>
            Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(p - 1, 1));
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-2xs"
            >
              Previous
            </button>

            <span className="px-2 font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(p + 1, totalPages));
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: Application Link Management Drawer / Modal                       */}
      {/* ========================================================================= */}
      {showLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <LinkIcon size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Application Links Management
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Generate and manage shareable application URLs for past students.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLinkForm(!showCreateLinkForm)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition"
                >
                  {showCreateLinkForm ? 'View Links List' : '+ Generate New Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinksModal(false)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Form: Generate New Link */}
              {showCreateLinkForm && (
                <form onSubmit={handleCreateLinkSubmit} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Create New Shareable Link
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Link Name */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Link Name / Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newLinkForm.linkName}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, linkName: e.target.value })}
                        placeholder="e.g. 2023 Cabin Crew Past Students Batch A"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    {/* Target Branch */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Target Branch (Optional)
                      </label>
                      <input
                        type="text"
                        value={newLinkForm.branch}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, branch: e.target.value })}
                        placeholder="e.g. IAAC City Campus (Colombo)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    {/* Target Batch */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Batch / Intake (Optional)
                      </label>
                      <input
                        type="text"
                        value={newLinkForm.batch}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, batch: e.target.value })}
                        placeholder="e.g. Batch 2023-B"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    {/* Predefined Diploma */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Predefined Diploma (Optional)
                      </label>
                      <select
                        value={newLinkForm.diplomaProgramme}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, diplomaProgramme: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">-- Allow Student to Choose --</option>
                        {diplomaOptions.map((prog, idx) => (
                          <option key={idx} value={prog}>{prog}</option>
                        ))}
                      </select>
                    </div>

                    {/* Expiration Date */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={newLinkForm.expiresAt}
                        onChange={(e) => setNewLinkForm({ ...newLinkForm, expiresAt: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateLinkForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingLink}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#0B1528] hover:bg-slate-900 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      {creatingLink ? 'Generating...' : 'Save & Generate'}
                    </button>
                  </div>
                </form>
              )}

              {/* Links Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Existing Shareable Links ({linksList.length})
                  </h3>
                </div>

                {loadingLinks ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading links...</div>
                ) : linksList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    No application links generated yet. Click "Generate New Link" above.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {linksList.map((link) => {
                      const isExpired = link.expiresAt && new Date() > new Date(link.expiresAt);
                      const fullUrl = `${window.location.origin}/past-students/apply/${link.token}`;

                      return (
                        <div
                          key={link._id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{link.linkName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  !link.isActive ? 'bg-slate-100 text-slate-500' :
                                  isExpired ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {!link.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                                {link.branch && <span>Branch: <strong className="text-slate-600">{link.branch}</strong></span>}
                                {link.batch && <span>Batch: <strong className="text-slate-600">{link.batch}</strong></span>}
                                {link.diplomaProgramme && <span>Prog: <strong className="text-blue-600">{link.diplomaProgramme}</strong></span>}
                                <span>Submissions: <strong className="text-slate-800">{link.submissionCount || 0}</strong></span>
                              </div>
                            </div>

                            {/* Status Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleLinkActive(link)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                link.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {link.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>

                          {/* Link URL Bar & Copy Button */}
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 border border-slate-100">
                            <input
                              type="text"
                              readOnly
                              value={fullUrl}
                              className="bg-transparent text-xs text-slate-600 font-mono w-full select-all focus:outline-hidden"
                            />

                            <button
                              type="button"
                              onClick={() => handleCopyLink(link.token, link._id)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition shrink-0 flex items-center gap-1 shadow-2xs"
                            >
                              {copiedLinkId === link._id ? (
                                <>
                                  <Check size={13} className="text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`/past-students/apply/${link.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-blue-600 transition shrink-0"
                              title="Open in new tab"
                            >
                              <ExternalLink size={15} />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition shrink-0"
                              title="Delete Link"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: View Application Details                                         */}
      {/* ========================================================================= */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B1528] text-white flex items-center justify-center font-bold text-xs">
                  IAAC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      {viewingApp.fullName}
                    </h2>
                    <ApplicationStatusBadge status={viewingApp.status} />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Ref: {viewingApp.applicationRef} | ID: {viewingApp.studentId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onDownloadPdf) onDownloadPdf(viewingApp);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onPrintApp) onPrintApp(viewingApp);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingApp(null)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Section A: Personal Information */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" />
                  <span>Section A – Personal Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div><span className="text-slate-400">Student Full Name:</span> <span className="font-bold text-slate-800 ml-1">{viewingApp.fullName}</span></div>
                  <div><span className="text-slate-400">Certificate Name:</span> <span className="font-bold text-blue-700 ml-1">{viewingApp.certificateName}</span></div>
                  <div><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold text-slate-800 ml-1">{new Date(viewingApp.dob).toLocaleDateString()}</span></div>
                  <div><span className="text-slate-400">Gender:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.gender}</span></div>
                  <div><span className="text-slate-400">{viewingApp.identificationType}:</span> <span className="font-mono font-bold text-slate-800 ml-1">{viewingApp.nicPassportNumber}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-400">Residential Address:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.residentialAddress}</span></div>
                </div>
              </div>

              {/* Section B: Contact Information */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={15} className="text-blue-600" />
                  <span>Section B – Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div><span className="text-slate-400">Email Address:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.email}</span></div>
                  <div><span className="text-slate-400">Mobile Number:</span> <span className="font-mono font-semibold text-slate-800 ml-1">{viewingApp.mobileNumber}</span></div>
                  <div><span className="text-slate-400">WhatsApp Number:</span> <span className="font-mono font-semibold text-slate-800 ml-1">{viewingApp.whatsappNumber}</span></div>
                </div>
              </div>

              {/* Section C & D: Educational Qualifications */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <School size={15} className="text-blue-600" />
                  <span>Section C & D – Educational Qualifications</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div><span className="text-slate-400">School Attended:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.schoolAttended}</span></div>
                  <div><span className="text-slate-400">O/L Exam Year:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.olYear}</span></div>
                  <div><span className="text-slate-400">Mathematics Grade:</span> <span className="font-bold text-blue-700 ml-1">{viewingApp.olMathResult}</span></div>
                  <div><span className="text-slate-400">English Grade:</span> <span className="font-bold text-blue-700 ml-1">{viewingApp.olEnglishResult}</span></div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Overall O/L Summary:</span>
                    <span className="font-semibold text-slate-800 ml-1">
                      {viewingApp.olGradeCounts?.aCount || 0}A, {viewingApp.olGradeCounts?.bCount || 0}B, {viewingApp.olGradeCounts?.cCount || 0}C, {viewingApp.olGradeCounts?.sCount || 0}S, {viewingApp.olGradeCounts?.wCount || 0}W (Total: {viewingApp.totalSubjects} subjects)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section E: Registration Information */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-blue-600" />
                  <span>Section E – IAAC Registration Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div><span className="text-slate-400">Student ID:</span> <span className="font-mono font-bold text-[#0B1528] ml-1">{viewingApp.studentId}</span></div>
                  <div><span className="text-slate-400">Registered Diploma:</span> <span className="font-bold text-blue-700 ml-1">{viewingApp.diplomaProgramme}</span></div>
                  {viewingApp.branch && <div><span className="text-slate-400">Branch:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.branch}</span></div>}
                  {viewingApp.batch && <div><span className="text-slate-400">Batch:</span> <span className="font-semibold text-slate-800 ml-1">{viewingApp.batch}</span></div>}
                </div>
              </div>

              {/* Audit Logs Timeline */}
              {viewingApp.auditLogs && viewingApp.auditLogs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Administrative Processing History
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-3 divide-y divide-slate-100 text-xs">
                    {viewingApp.auditLogs.map((log, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700">{log.action}</span>
                          <span className="text-slate-400 ml-1.5">by {log.performedBy || 'Admin'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: Edit Application Information                                    */}
      {/* ========================================================================= */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900">
                Edit Application: {editingApp.applicationRef}
              </h2>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAppEdit} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={editingApp.fullName}
                    onChange={(e) => setEditingApp({ ...editingApp, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Certificate Name</label>
                  <input
                    type="text"
                    value={editingApp.certificateName}
                    onChange={(e) => setEditingApp({ ...editingApp, certificateName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={editingApp.email}
                    onChange={(e) => setEditingApp({ ...editingApp, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                  <input
                    type="text"
                    value={editingApp.mobileNumber}
                    onChange={(e) => setEditingApp({ ...editingApp, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Residential Address</label>
                  <textarea
                    rows={2}
                    value={editingApp.residentialAddress}
                    onChange={(e) => setEditingApp({ ...editingApp, residentialAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Diploma Programme</label>
                  <select
                    value={editingApp.diplomaProgramme}
                    onChange={(e) => setEditingApp({ ...editingApp, diplomaProgramme: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    {diplomaOptions.map((prog, idx) => (
                      <option key={idx} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Modification Reason (For Audit Log)</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g. Corrected spelling of certificate name per student request"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B1528] hover:bg-slate-900 rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CONFIRMATION MODALS: Complete, Reopen, Delete                           */}
      {/* ========================================================================= */}
      {/* Complete Confirmation */}
      {confirmCompleteApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Mark Application as Completed?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to complete processing for <strong>{confirmCompleteApp.fullName}</strong> ({confirmCompleteApp.studentId})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCompleteApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={completing}
                onClick={handleConfirmComplete}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
              >
                {completing ? 'Completing...' : 'Yes, Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Confirmation */}
      {confirmReopenApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
              <Clock size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Reopen Application to Pending?</h3>
              <p className="text-xs text-slate-500">
                This will move <strong>{confirmReopenApp.fullName}</strong> back to the Pending list for further review.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReopenApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reopening}
                onClick={handleConfirmReopen}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs"
              >
                {reopening ? 'Reopening...' : 'Yes, Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Permanently Delete Application?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this application? All information associated with this application will be removed from the application database. This action cannot be undone.
              </p>
              <p className="text-[11px] font-mono text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">
                Student: {confirmDeleteApp.fullName} ({confirmDeleteApp.studentId})
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
