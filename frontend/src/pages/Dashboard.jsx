import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../hooks/useAuth.js';

// Modular Admin Components
import AdminSidebar from '../components/admin/AdminSidebar.jsx';
import AdminTopbar from '../components/admin/AdminTopbar.jsx';
import DashboardOverview from '../components/admin/tabs/DashboardOverview.jsx';
import AdminApplications from '../components/admin/tabs/AdminApplications.jsx';
import AdminMessages from '../components/admin/tabs/AdminMessages.jsx';
import AdminCourses from '../components/admin/tabs/AdminCourses.jsx';
import AdminPractical from '../components/admin/tabs/AdminPractical.jsx';
import AdminEvents from '../components/admin/tabs/AdminEvents.jsx';
import AdminNotices from '../components/admin/tabs/AdminNotices.jsx';
import AdminAnalytics from '../components/admin/tabs/AdminAnalytics.jsx';
import AdminReports from '../components/admin/tabs/AdminReports.jsx';
import AdminSettings from '../components/admin/tabs/AdminSettings.jsx';
import AdminPastStudents from '../components/admin/tabs/AdminPastStudents.jsx';
import { downloadPastStudentPdf, printPastStudentApp } from '../utils/pastStudentPdf.js';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Tab & Layout State
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const prefs = localStorage.getItem('iaac_admin_prefs');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.defaultTab) return parsed.defaultTab;
      }
    } catch (_) {}
    return 'dashboard';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Core Data Collections
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [pastStudentStats, setPastStudentStats] = useState(null);

  // Selected Application for Details view
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  // Trigger modal states from Overview
  const [showAddNoticeFromOverview, setShowAddNoticeFromOverview] = useState(false);
  const [showAddEventFromOverview, setShowAddEventFromOverview] = useState(false);

  // Toast Notification helper
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch all collections from backend
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [appsRes, msgsRes, coursesRes, trainRes, eventsRes, noticesRes, pastStatsRes] = await Promise.allSettled([
        apiClient.get('/api/admin/applications'),
        apiClient.get('/api/admin/messages'),
        apiClient.get('/api/courses'),
        apiClient.get('/api/training-programs'),
        apiClient.get('/api/events'),
        apiClient.get('/api/notices'),
        apiClient.get('/api/admin/past-students/stats'),
      ]);

      if (appsRes.status === 'fulfilled') setApplications(appsRes.value?.data?.items || []);
      if (msgsRes.status === 'fulfilled') setMessages(msgsRes.value?.data?.items || []);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value?.data?.items || coursesRes.value?.data || []);
      if (trainRes.status === 'fulfilled') setTrainingPrograms(trainRes.value?.data?.items || trainRes.value?.data || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value?.data?.items || eventsRes.value?.data || []);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value?.data?.items || noticesRes.value?.data || []);
      if (pastStatsRes.status === 'fulfilled') setPastStudentStats(pastStatsRes.value?.data || null);

      if (isRefresh) {
        showToast('Dashboard data refreshed successfully');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('iaac_token');
    localStorage.removeItem('iaac_user');
    setUser(null);
    navigate('/admin/login', { replace: true });
  };

  // Derive dynamic notifications & alerts from live database state
  const notifications = useMemo(() => {
    const list = [];

    // Pending applications
    const pendingApps = applications.filter((a) => !a.isDone);
    if (pendingApps.length > 0) {
      list.push({
        type: 'warning',
        title: `${pendingApps.length} Applications Awaiting Review`,
        message: `Latest applicant: ${pendingApps[0]?.fullName || pendingApps[0]?.name || 'Student'} for ${pendingApps[0]?.course || 'Course'}`,
        targetTab: 'applications',
        time: 'Action Required',
        read: false,
      });
    }

    // Unread messages
    const unreadMsgs = messages.filter((m) => !m.isDone);
    if (unreadMsgs.length > 0) {
      list.push({
        type: 'info',
        title: `${unreadMsgs.length} Unread Inquiries`,
        message: `Inquiry from ${unreadMsgs[0]?.name}: "${unreadMsgs[0]?.subject || 'Question'}"`,
        targetTab: 'messages',
        time: 'New',
        read: false,
      });
    }

    // Active popup announcement
    const popupNotice = notices.find((n) => n.showAsPopup || n.isPopup);
    if (popupNotice) {
      list.push({
        type: 'success',
        title: 'Active Homepage Popup',
        message: `"${popupNotice.title}" is currently displaying to website visitors`,
        targetTab: 'notices',
        time: 'Live Now',
        read: false,
      });
    }

    // Upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = events.filter((e) => e.eventDate && new Date(e.eventDate) >= today);
    if (upcomingEvents.length > 0) {
      list.push({
        type: 'info',
        title: `${upcomingEvents.length} Upcoming Scheduled Events`,
        message: `Next: ${upcomingEvents[0]?.title} on ${new Date(upcomingEvents[0]?.eventDate).toLocaleDateString()}`,
        targetTab: 'events',
        time: 'Scheduled',
        read: false,
      });
    }

    return list;
  }, [applications, messages, notices, events]);

  // Sidebar dynamic stats
  const sidebarStats = useMemo(() => ({
    pendingApplications: applications.filter((a) => !a.isDone && a.reviewStatus !== 'reviewed').length,
    unreadMessages: messages.filter((m) => !m.isDone).length,
    pendingPastStudents: pastStudentStats?.pendingApplications || 0,
    coursesCount: courses.length,
    practicalsCount: trainingPrograms.length,
    eventsCount: events.length,
    activePopups: notices.filter((n) => n.showAsPopup || n.isPopup).length,
  }), [applications, messages, pastStudentStats, courses, trainingPrograms, events, notices]);

  // ==========================================
  // APPLICATION ACTIONS & EMAIL INTEGRATION
  // ==========================================
  const handleApproveApplication = async (appId) => {
    try {
      const targetApp = applications.find((a) => String(a.id) === String(appId));
      let pdfDataUri = undefined;
      if (targetApp) {
        try {
          pdfDataUri = downloadApplicationPdf(targetApp, { download: false });
        } catch (_) {}
      }

      const res = await apiClient.post(
        `/api/admin/applications/${appId}/approve`,
        { applicationPdf: pdfDataUri },
        { timeout: 35000 }
      );

      setApplications((prev) =>
        prev.map((a) =>
          String(a.id) === String(appId)
            ? { ...a, isDone: true, status: 'approved', reviewStatus: 'approved' }
            : a
        )
      );

      const msg = res?.data?.message || 'Application approved and enrolment email dispatched.';
      showToast(msg, 'success');
      return res?.data;
    } catch (err) {
      console.error('Approve failed:', err);
      showToast(err?.response?.data?.message || 'Failed to approve application', 'error');
      throw err;
    }
  };

  // Dedicated Review Action (Reviewed - Not Eligible, NO EMAIL)
  const handleReviewApplication = async (appId, reviewData = {}) => {
    try {
      const res = await apiClient.patch(`/api/admin/applications/${appId}/review`, reviewData);
      const updated = res.data;
      setApplications((prev) =>
        prev.map((a) =>
          String(a.id) === String(appId)
            ? {
                ...a,
                isDone: false,
                status: 'reviewed',
                reviewStatus: 'reviewed',
                reviewReason: updated.reviewReason || reviewData.reviewReason || a.reviewReason,
                reviewRemarks: updated.reviewRemarks || reviewData.reviewRemarks || a.reviewRemarks,
                reviewedAt: updated.reviewedAt || new Date().toISOString(),
                reviewedBy: updated.reviewedBy || 'Admin',
              }
            : a
        )
      );
      showToast('Application marked as reviewed. No approval email was sent.', 'success');
      return updated;
    } catch (err) {
      console.error('Failed to review application:', err);
      showToast(err?.response?.data?.message || 'Failed to mark application as reviewed', 'error');
      throw err;
    }
  };

  // Reopen decision back to pending review
  const handleReopenApplication = async (appId) => {
    try {
      const res = await apiClient.patch(`/api/admin/applications/${appId}/review`, { reopen: true });
      const updated = res.data;
      setApplications((prev) =>
        prev.map((a) =>
          String(a.id) === String(appId)
            ? {
                ...a,
                isDone: false,
                status: 'pending',
                reviewStatus: 'pending',
              }
            : a
        )
      );
      showToast('Application reopened for pending review', 'success');
      return updated;
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reopen application', 'error');
      throw err;
    }
  };

  const handleToggleApplicationDone = async (appId) => {
    try {
      const res = await apiClient.patch(`/api/admin/applications/${appId}/done`);
      const updatedDone = res?.data?.isDone;
      setApplications((prev) =>
        prev.map((a) =>
          String(a.id) === String(appId)
            ? { ...a, isDone: updatedDone, status: updatedDone ? 'approved' : 'pending' }
            : a
        )
      );
      showToast(updatedDone ? 'Marked as Approved' : 'Reverted to Pending Review');
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      await apiClient.delete(`/api/admin/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => String(a.id) !== String(appId)));
      if (String(selectedApplicationId) === String(appId)) {
        setSelectedApplicationId(null);
      }
      showToast('Application deleted successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete application', 'error');
    }
  };

  // ==========================================
  // PDF APPLICATION GENERATION
  // ==========================================
  const safeText = (val) => (val === null || val === undefined ? '-' : String(val).trim() || '-');

  const downloadApplicationPdf = (app, { download = true } = {}) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 60;
    let y = 40;

    const checkPageBreak = (needed = 40) => {
      if (y + needed > pageHeight - marginBottom) {
        doc.addPage();
        y = 40;
      }
    };

    // Header Background
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, 100, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text('IAAC', 40, 50);

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('Student Admission Application', 40, 75);

    doc.setFontSize(10);
    doc.text(`Ref ID: ${app.id || 'N/A'}`, pageWidth - 40, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 40, 75, { align: 'right' });

    y = 130;

    // Diploma Badge
    const diplomaText = safeText(app?.course || app?.courseApplied || app?.program || 'N/A');
    doc.setFillColor(30, 58, 138);
    doc.rect(40, y, pageWidth - 80, 45, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 210, 255);
    doc.text('DIPLOMA PROGRAMME', 55, y + 16);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(diplomaText, 55, y + 34);
    y += 65;

    const drawSection = (title, data) => {
      checkPageBreak(70);
      doc.setFillColor(239, 246, 255);
      doc.rect(40, y, pageWidth - 80, 25, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text(title.toUpperCase(), 50, y + 17);
      y += 40;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      data.forEach(([label, value]) => {
        const textValue = safeText(value);
        const splitText = doc.splitTextToSize(textValue, 350);
        const fieldHeight = splitText.length * 14 + 6;
        checkPageBreak(fieldHeight + 10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 50, y);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, 180, y);
        y += fieldHeight;
      });
      y += 15;
    };

    drawSection('Personal Information', [
      ['Title', app.title],
      ['Full Name', app.fullName || app.name],
      ['Date of Birth', app.dob ? new Date(app.dob).toLocaleDateString() : '-'],
      ['Gender', app.gender],
      ['NIC / Passport', app.nic],
      ['Address', app.homeAddress || app.address],
    ]);

    drawSection('Contact Details', [
      ['Email Address', app.email],
      ['Mobile Number', app.mobile || app.contact || app.phone],
      ['WhatsApp Number', app.whatsapp],
    ]);

    drawSection('Education', [
      ['School Attended', app.school],
      ['O/L Year', app.olYear],
    ]);

    if (app.olResults) {
      checkPageBreak(60);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text('G.C.E O/L Results Summary:', 50, y);
      y += 20;
      let xPos = 50;
      Object.entries(app.olResults).forEach(([subj, grade]) => {
        checkPageBreak(20);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${subj.charAt(0).toUpperCase() + subj.slice(1)}: ${grade || '-'}`, xPos, y);
        xPos += 120;
        if (xPos > pageWidth - 100) {
          xPos = 50;
          y += 15;
        }
      });
      y += 25;
    }

    drawSection('Parent / Guardian', [
      ['Guardian Name', app.parentName],
      ['Guardian Contact', app.parentPhone || app.parentMobile],
    ]);

    drawSection('Program Details', [
      ['Diploma Chosen', app.course || app.courseApplied || app.program],
      ['Academy / Campus', app.academy],
      ['Referred By', app.referral || 'General Office'],
      ['Application Date', app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'],
      ['Status', app.isDone ? 'Processed & Enrolled' : 'Pending'],
    ]);

    checkPageBreak(125);
    doc.setFillColor(239, 246, 255);
    doc.rect(40, y, pageWidth - 80, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text('STUDENT DECLARATION', 50, y + 17);
    y += 42;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const declaration =
      'All payments are non-refundable. Instalments must be paid on or before the due dates. IAAC reserves the right to charge interest on delayed payments. I agree to abide by the rules and regulations of the college.';
    const declarationLines = doc.splitTextToSize(declaration, pageWidth - 100);
    doc.text(declarationLines, 50, y);
    y += declarationLines.length * 14 + 28;
    doc.line(50, y, 230, y);
    doc.line(pageWidth - 220, y, pageWidth - 50, y);
    doc.setFontSize(9);
    doc.text('Student Signature', 50, y + 14);
    doc.text('Date', pageWidth - 220, y + 14);
    y += 45;

    const lastPageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(40, lastPageHeight - 50, pageWidth - 40, lastPageHeight - 50);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This document is electronically generated by the IAAC Administration System.', pageWidth / 2, lastPageHeight - 30, { align: 'center' });

    const fileSafeName = String(app.fullName || app.name || 'Student').replace(/[^a-z0-9]+/gi, '_');
    if (download) {
      doc.save(`IAAC_Application_${fileSafeName}.pdf`);
    }
    return doc.output('datauristring');
  };

  const printApplication = (app) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application - ${safeText(app.fullName || app.name)}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
            .header h1 { color: #1e3a8a; margin: 0; font-size: 24px; text-transform: uppercase; }
            .section { margin-bottom: 24px; }
            .section-title { background: #eff6ff; padding: 6px 12px; font-weight: bold; color: #1e40af; border-left: 4px solid #2563eb; margin-bottom: 12px; text-transform: uppercase; font-size: 13px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .field { margin-bottom: 8px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; display: block; font-weight: bold; }
            .value { font-size: 14px; font-weight: 500; color: #0f172a; border-bottom: 1px dotted #cbd5e1; padding-bottom: 2px; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>International Airline & Aviation College</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Admission Application Record</p>
          </div>
          <div class="section">
            <div class="section-title">Diploma Programme</div>
            <div class="grid">
              <div class="field"><span class="label">Course</span><div class="value">${safeText(app.course || app.program)}</div></div>
              <div class="field"><span class="label">Campus</span><div class="value">${safeText(app.academy)}</div></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="grid">
              <div class="field"><span class="label">Full Name</span><div class="value">${safeText(app.fullName || app.name)}</div></div>
              <div class="field"><span class="label">NIC</span><div class="value">${safeText(app.nic)}</div></div>
              <div class="field"><span class="label">Email</span><div class="value">${safeText(app.email)}</div></div>
              <div class="field"><span class="label">Phone</span><div class="value">${safeText(app.mobile || app.phone)}</div></div>
            </div>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} by IAAC Admin Portal 2.0.
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=900,height=800');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // ==========================================
  // MESSAGES ACTIONS
  // ==========================================
  const handleMarkMessageDone = async (id) => {
    try {
      await apiClient.patch(`/api/admin/messages/${id}/done`);
      setMessages((prev) => prev.map((m) => (String(m.id) === String(id) ? { ...m, isDone: true } : m)));
      showToast('Inquiry marked as processed');
    } catch {
      showToast('Failed to update message', 'error');
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await apiClient.delete(`/api/admin/messages/${id}`);
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(id)));
      showToast('Message deleted');
    } catch {
      showToast('Failed to delete message', 'error');
    }
  };

  // ==========================================
  // COURSES CRUD
  // ==========================================
  const handleCreateCourse = async (courseData) => {
    const payload = {
      title: courseData.title,
      duration: courseData.duration,
      courseType: courseData.courseType,
      shortDescription: courseData.shortDescription || undefined,
      totalCourseFee: courseData.totalCourseFee || undefined,
      branchPrices: courseData.branchPrices || undefined,
      imageData: courseData.imageData || undefined,
    };
    const res = await apiClient.post('/api/courses', payload);
    const created = res?.data;
    if (created?._id) {
      setCourses((prev) => [created, ...prev]);
      showToast('Course created successfully');
    }
  };

  const handleSaveCourseEdits = async (id, updatedData) => {
    const payload = {
      title: updatedData.title,
      duration: updatedData.duration,
      courseType: updatedData.courseType,
      shortDescription: updatedData.shortDescription,
      totalCourseFee: updatedData.totalCourseFee,
      branchPrices: updatedData.branchPrices,
      imageData: updatedData.imageData || undefined,
      imageUrl: !updatedData.imageData ? updatedData.imageUrl : undefined,
    };
    const res = await apiClient.put(`/api/courses/${id}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setCourses((prev) => prev.map((c) => (String(c._id) === String(id) ? updated : c)));
      showToast('Course updated successfully');
    }
  };

  const handleDeleteCourse = async (id) => {
    await apiClient.delete(`/api/courses/${id}`);
    setCourses((prev) => prev.filter((c) => String(c._id) !== String(id)));
    showToast('Course deleted');
  };

  // ==========================================
  // PRACTICAL TRAINING CRUD
  // ==========================================
  const handleCreatePractical = async (trainingData) => {
    const payload = {
      title: trainingData.title || 'Practical Session',
      duration: trainingData.duration || '-',
      courseType: 'Practical Training',
      shortDescription: trainingData.shortDescription || undefined,
      imageData: trainingData.imageData || undefined,
      imageUrls: trainingData.galleryImages?.length ? trainingData.galleryImages : undefined,
    };
    const res = await apiClient.post('/api/training-programs', payload);
    const created = res?.data;
    if (created?._id) {
      setTrainingPrograms((prev) => [created, ...prev]);
      showToast('Practical training created');
    }
  };

  const handleSavePracticalEdits = async (id, updatedData) => {
    const payload = {
      title: updatedData.title,
      duration: updatedData.duration || '-',
      shortDescription: updatedData.shortDescription,
      imageData: updatedData.imageData || undefined,
      imageUrl: !updatedData.imageData ? updatedData.imageUrl : undefined,
      imageUrls: updatedData.galleryImages?.length ? updatedData.galleryImages : undefined,
    };
    const res = await apiClient.put(`/api/training-programs/${id}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setTrainingPrograms((prev) => prev.map((t) => (String(t._id) === String(id) ? updated : t)));
      showToast('Practical training updated');
    }
  };

  const handleDeletePractical = async (id) => {
    await apiClient.delete(`/api/training-programs/${id}`);
    setTrainingPrograms((prev) => prev.filter((t) => String(t._id) !== String(id)));
    showToast('Practical training deleted');
  };

  // ==========================================
  // EVENTS CRUD
  // ==========================================
  const handleCreateEvent = async (eventData) => {
    const payload = {
      title: eventData.title,
      description: eventData.description || undefined,
      eventDate: eventData.eventDate || undefined,
      imageData: eventData.imageData || undefined,
      imageUrls: eventData.galleryImages?.length ? eventData.galleryImages : undefined,
    };
    const res = await apiClient.post('/api/events', payload);
    const created = res?.data;
    if (created?._id) {
      setEvents((prev) => [created, ...prev]);
      showToast('Event created successfully');
    }
  };

  const handleSaveEventEdits = async (id, updatedData) => {
    const payload = {
      title: updatedData.title,
      description: updatedData.description,
      eventDate: updatedData.eventDate || undefined,
      imageData: updatedData.imageData || undefined,
      imageUrl: !updatedData.imageData ? updatedData.imageUrl : undefined,
    };
    const res = await apiClient.put(`/api/events/${id}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setEvents((prev) => prev.map((e) => (String(e._id) === String(id) ? updated : e)));
      showToast('Event updated successfully');
    }
  };

  const handleDeleteEvent = async (id) => {
    await apiClient.delete(`/api/events/${id}`);
    setEvents((prev) => prev.filter((e) => String(e._id) !== String(id)));
    showToast('Event deleted');
  };

  // ==========================================
  // NOTICES & SMART POPUP CRUD
  // ==========================================
  const handleCreateNotice = async (noticeData) => {
    const payload = {
      title: noticeData.title,
      description: noticeData.description || undefined,
      category: noticeData.category || 'General',
      imageData: noticeData.imageData || undefined,
      showAsPopup: Boolean(noticeData.showAsPopup),
      popupPriority: noticeData.popupPriority || 'medium',
      popupStartDate: noticeData.popupStartDate ? new Date(noticeData.popupStartDate) : undefined,
      popupEndDate: noticeData.popupEndDate ? new Date(noticeData.popupEndDate) : undefined,
      popupStatus: noticeData.popupStatus || 'active',
      popupButtonText: noticeData.popupButtonText || undefined,
      popupButtonUrl: noticeData.popupButtonUrl || undefined,
    };
    const res = await apiClient.post('/api/notices', payload);
    const created = res?.data;
    if (created?._id) {
      setNotices((prev) => [created, ...prev]);
      showToast('Notice published successfully');
    }
  };

  const handleSaveNoticeEdits = async (id, updatedData) => {
    const payload = {
      title: updatedData.title,
      description: updatedData.description,
      category: updatedData.category || 'General',
      imageData: updatedData.imageData || undefined,
      imageUrl: !updatedData.imageData ? updatedData.imageUrl : undefined,
      showAsPopup: Boolean(updatedData.showAsPopup),
      popupPriority: updatedData.popupPriority || 'medium',
      popupStartDate: updatedData.popupStartDate ? new Date(updatedData.popupStartDate) : null,
      popupEndDate: updatedData.popupEndDate ? new Date(updatedData.popupEndDate) : null,
      popupStatus: updatedData.popupStatus || 'active',
      popupButtonText: updatedData.popupButtonText,
      popupButtonUrl: updatedData.popupButtonUrl,
    };
    const res = await apiClient.put(`/api/notices/${id}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setNotices((prev) => prev.map((n) => (String(n._id) === String(id) ? updated : n)));
      showToast('Notice updated successfully');
    }
  };

  const handleToggleNoticePopup = async (notice) => {
    try {
      const res = await apiClient.patch(`/api/notices/${notice._id}/toggle-popup`);
      const updated = res?.data;
      if (updated?._id) {
        setNotices((prev) => prev.map((n) => (String(n._id) === String(notice._id) ? updated : n)));
        showToast(updated.showAsPopup ? 'Notice set as active homepage popup' : 'Homepage popup deactivated');
      }
    } catch {
      showToast('Failed to toggle popup', 'error');
    }
  };

  const handleDeleteNotice = async (id) => {
    await apiClient.delete(`/api/notices/${id}`);
    setNotices((prev) => prev.filter((n) => String(n._id) !== String(id)));
    showToast('Notice deleted');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-screen w-full">
        {/* Fixed Desktop Sidebar & Mobile Drawer */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          stats={sidebarStats}
          onLogout={handleLogout}
        />

        {/* Main Content Area with dynamic desktop sidebar offset */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[250px]'
          }`}
        >
          {/* Topbar */}
          <AdminTopbar
            activeTab={activeTab}
            setMobileOpen={setMobileOpen}
          />

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading IAAC Smart Admin Dashboard...</p>
              </div>
            ) : (
              <>
                {/* 1. Dashboard Overview */}
                {activeTab === 'dashboard' && (
                  <DashboardOverview
                    applications={applications}
                    messages={messages}
                    courses={courses}
                    events={events}
                    notices={notices}
                    setActiveTab={setActiveTab}
                    onOpenNewNotice={() => setActiveTab('notices')}
                    onOpenNewEvent={() => setActiveTab('events')}
                    onSelectApplication={(id) => {
                      setSelectedApplicationId(id);
                      setActiveTab('applications');
                    }}
                  />
                )}

                {/* 2. Applications Management */}
                {activeTab === 'applications' && (
                  <AdminApplications
                    applications={applications}
                    selectedApplicationId={selectedApplicationId}
                    setSelectedApplicationId={setSelectedApplicationId}
                    onApproveApplication={handleApproveApplication}
                    onReviewApplication={handleReviewApplication}
                    onReopenApplication={handleReopenApplication}
                    onToggleApplicationDone={handleToggleApplicationDone}
                    onDeleteApplication={handleDeleteApplication}
                    onDownloadApplicationPdf={(app) => downloadApplicationPdf(app, { download: true })}
                    onPrintApplication={printApplication}
                    onExportReport={() => setActiveTab('reports')}
                  />
                )}

                {/* 3. Messages / Student Inquiries */}
                {activeTab === 'messages' && (
                  <AdminMessages
                    messages={messages}
                    onMarkMessageDone={handleMarkMessageDone}
                    onDeleteMessage={handleDeleteMessage}
                  />
                )}

                {/* 3b. Past Students Management */}
                {activeTab === 'past-students' && (
                  <AdminPastStudents
                    courses={courses}
                    onDownloadPdf={(app) => downloadPastStudentPdf(app, { download: true })}
                    onPrintApp={printPastStudentApp}
                    showToast={showToast}
                  />
                )}

                {/* 4. Courses Directory */}
                {activeTab === 'courses' && (
                  <AdminCourses
                    courses={courses}
                    onCreateCourse={handleCreateCourse}
                    onSaveCourseEdits={handleSaveCourseEdits}
                    onDeleteCourse={handleDeleteCourse}
                  />
                )}

                {/* 5. Practical Training */}
                {activeTab === 'practical' && (
                  <AdminPractical
                    trainingPrograms={trainingPrograms}
                    onCreatePractical={handleCreatePractical}
                    onSavePracticalEdits={handleSavePracticalEdits}
                    onDeletePractical={handleDeletePractical}
                  />
                )}

                {/* 6. Events */}
                {activeTab === 'events' && (
                  <AdminEvents
                    events={events}
                    onCreateEvent={handleCreateEvent}
                    onSaveEventEdits={handleSaveEventEdits}
                    onDeleteEvent={handleDeleteEvent}
                  />
                )}

                {/* 7. Notices & Smart Popup */}
                {activeTab === 'notices' && (
                  <AdminNotices
                    notices={notices}
                    onCreateNotice={handleCreateNotice}
                    onSaveNoticeEdits={handleSaveNoticeEdits}
                    onToggleNoticePopup={handleToggleNoticePopup}
                    onDeleteNotice={handleDeleteNotice}
                  />
                )}

                {/* 8. Analytics */}
                {activeTab === 'analytics' && (
                  <AdminAnalytics
                    applications={applications}
                    courses={courses}
                  />
                )}

                {/* 9. Advanced Reports Generator */}
                {activeTab === 'reports' && (
                  <AdminReports
                    applications={applications}
                  />
                )}

                {/* 10. Settings */}
                {activeTab === 'settings' && (
                  <AdminSettings
                    user={user}
                    onRefresh={() => loadDashboardData(true)}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
