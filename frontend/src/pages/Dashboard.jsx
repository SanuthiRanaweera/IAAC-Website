import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, User, FileText, Calendar, BookOpen, UploadCloud,
  ChevronLeft, ChevronRight, Trash2, MessageSquare, Briefcase, Bell, Eye, X, CheckCircle, Mail, Phone, MapPin, Pencil, Plus, Menu, Award, Download
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

const createEmptyCourseForm = (defaults = {}) => ({
  title: '',
  duration: '',
  courseType: '',
  shortDescription: '',
  totalCourseFee: '',
  branchPrices: {
    iaacCity: '',
    airportAcademy: '',
    iaacCenter: '',
  },
  minimumEntryRequirements: '',
  evaluationCriteria: '',
  examinationFormat: '',
  additionalNotes: '',
  sessionDetails: '',
  imageUrl: '',
  imageData: '',
  imagePreview: '',
  imageUrlsInput: '',
  galleryImages: [],
  ...defaults,
});

// --- CALENDAR HELPERS ---
const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

function Dashboard() {
  const [activeTab, setActiveTab] = useState('application'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [notices, setNotices] = useState([]);

  // Modal State
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  
  // Editing State
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Reports State
  const [monthlyReportYear, setMonthlyReportYear] = useState(String(new Date().getFullYear()));
  const [monthlyReportMonth, setMonthlyReportMonth] = useState(''); // '' = all months

  // Forms State
  const [courseForm, setCourseForm] = useState({});
  const [practicalForm, setPracticalForm] = useState(createEmptyCourseForm({ courseType: 'Practical Training' }));
  const [eventForm, setEventForm] = useState({});
  const [staffForm, setStaffForm] = useState({});
  const [noticeForm, setNoticeForm] = useState({});
  const [newCourseForm, setNewCourseForm] = useState(createEmptyCourseForm());
  const [newPracticalForm, setNewPracticalForm] = useState(createEmptyCourseForm({ courseType: 'Practical Training' }));
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [showNewPracticalForm, setShowNewPracticalForm] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventForm, setNewEventForm] = useState({ title: '', description: '', eventDate: '', galleryImages: [] });
  const [showNewStaffForm, setShowNewStaffForm] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', subject: '', description: '', imageData: '', imagePreview: '' });
  const [courseCreateStatus, setCourseCreateStatus] = useState({ submitting: false, success: false, error: '' });
  const [practicalCreateStatus, setPracticalCreateStatus] = useState({ submitting: false, success: false, error: '' });
  const [eventCreateStatus, setEventCreateStatus] = useState({ submitting: false, success: false, error: '' });
  const [staffCreateStatus, setStaffCreateStatus] = useState({ submitting: false, success: false, error: '' });
  const [showNewNoticeForm, setShowNewNoticeForm] = useState(false);
  const [newNoticeForm, setNewNoticeForm] = useState({ title: '', description: '', imageData: '', imagePreview: '' });
  const [noticeCreateStatus, setNoticeCreateStatus] = useState({ submitting: false, success: false, error: '' });

  // Navigation Items
  const navItems = [
    { value: 'application', label: 'Applications', icon: Briefcase },
    { value: 'message', label: 'Messages', icon: MessageSquare },
    { value: 'course', label: 'Courses', icon: BookOpen },
    { value: 'practical', label: 'Practical', icon: UploadCloud },
    { value: 'event', label: 'Events', icon: Calendar },
    { value: 'staff', label: 'Staff', icon: Users },
    { value: 'notice', label: 'Notices', icon: Bell },
  ];

  useEffect(() => {
    let isMounted = true;
    // Use individual non-blocking requests so critical data renders ASAP
    const cancelers = [];

    const get = (url, onSuccess) => {
      const controller = new AbortController();
      cancelers.push(controller);
      apiClient.get(url, { signal: controller.signal })
        .then((res) => { if (isMounted) onSuccess(res?.data?.items || []); })
        .catch(() => {});
    };

    // Priority: admin data first
    get('/api/admin/applications', (items) => setApplications(items));
    get('/api/admin/messages', (items) => setMessages(items));

    // Secondary: content lists (do not block rendering)
    get('/api/courses', (items) => setCourses(items));
    get('/api/training-programs', (items) => setTrainingPrograms(items));
    get('/api/events', (items) => setEvents(items));
    get('/api/staff', (items) => setStaffMembers(items));
    get('/api/notices', (items) => setNotices(items));

    return () => {
      isMounted = false;
      cancelers.forEach((c) => c.abort());
    };
  }, []);

  const availableApplicationYears = useMemo(() => {
    const years = new Set();
    applications.forEach((a) => {
      const dt = a?.createdAt ? new Date(a.createdAt) : null;
      if (!dt || Number.isNaN(dt.getTime())) return;
      years.add(dt.getFullYear());
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [applications]);

  useEffect(() => {
    if (!availableApplicationYears.length) return;
    const selected = Number(monthlyReportYear);
    if (!monthlyReportYear || Number.isNaN(selected) || !availableApplicationYears.includes(selected)) {
      setMonthlyReportYear(String(availableApplicationYears[availableApplicationYears.length - 1]));
    }
  }, [availableApplicationYears, monthlyReportYear]);

  // --- UNIQUE COURSE TYPES (for dropdown) ---
  const existingCourseTypes = useMemo(() => {
    const types = [...new Set(courses.map((c) => c.courseType).filter(Boolean))];
    const defaults = ['Airline & Aviation Programs', 'Pilot Training Programs'];
    defaults.forEach((d) => { if (!types.includes(d)) types.push(d); });
    return types.sort();
  }, [courses]);

  // --- CALENDAR LOGIC ---
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  const prevMonth = () => setCurrentMonth(new Date(year, currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, currentMonth.getMonth() + 1, 1));

  // --- HELPER: SAFE TEXT ---
  const safeText = (value) => {
    if (value === null || value === undefined) return '-';
    return String(value).trim() || '-';
  };

  // --- COURSES: EDIT/DELETE ---
  const openEditCourse = (course) => {
    if (!course?._id) return;
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title || '',
      duration: course.duration || '',
      courseType: course.courseType || '',
      shortDescription: course.shortDescription || '',
      totalCourseFee: course.totalCourseFee || '',
      branchPrices: {
        iaacCity: course.branchPrices?.iaacCity || '',
        airportAcademy: course.branchPrices?.airportAcademy || '',
        iaacCenter: course.branchPrices?.iaacCenter || '',
      },
      minimumEntryRequirements: course.minimumEntryRequirements || '',
      evaluationCriteria: course.evaluationCriteria || '',
      examinationFormat: course.examinationFormat || '',
      additionalNotes: course.additionalNotes || '',
      sessionDetails: course.sessionDetails || '',
      imageUrl: course.imageUrl || '',
      imageData: '',
      imagePreview: course.imageUrl || '',
      imageUrlsInput: Array.isArray(course.imageUrls) ? course.imageUrls.join('\n') : '',
      galleryImages: Array.isArray(course.imageUrls) ? course.imageUrls : [],
    });
  };

  const closeEditCourse = () => {
    setEditingCourseId(null);
    setCourseForm({});
  };

  const updateCourseForm = (patch) => {
    setCourseForm((prev) => ({ ...prev, ...patch }));
  };

  const updateBranchPrice = (key, value) => {
    setCourseForm((prev) => ({
      ...prev,
      branchPrices: { ...(prev.branchPrices || {}), [key]: value },
    }));
  };

  const updateNewCourseForm = (patch) => {
    setNewCourseForm((prev) => ({ ...prev, ...patch }));
  };

  const updateNewBranchPrice = (key, value) => {
    setNewCourseForm((prev) => ({
      ...prev,
      branchPrices: { ...(prev.branchPrices || {}), [key]: value },
    }));
  };

  const resetNewCourseForm = () => {
    setNewCourseForm(createEmptyCourseForm());
    setCourseCreateStatus({ submitting: false, success: false, error: '' });
  };

  const resetNewPracticalForm = () => {
    setNewPracticalForm(createEmptyCourseForm({ courseType: 'Practical Training' }));
    setPracticalCreateStatus({ submitting: false, success: false, error: '' });
  };

  const parseImageUrls = (input) => {
    if (!input) return undefined;
    const parts = String(input)
      .split(/\n|,/) // allow newline or comma
      .map((x) => x.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  };

  const buildCoursePayload = (form) => {
    const payload = {
      title: (form.title || '').trim(),
      duration: (form.duration || '').trim(),
      courseType: (form.courseType || '').trim(),
      shortDescription: (form.shortDescription || '').trim() || undefined,
      totalCourseFee: (form.totalCourseFee || '').trim() || undefined,
      branchPrices: {
        iaacCity: (form.branchPrices?.iaacCity || '').trim() || undefined,
        airportAcademy: (form.branchPrices?.airportAcademy || '').trim() || undefined,
        iaacCenter: (form.branchPrices?.iaacCenter || '').trim() || undefined,
      },
      minimumEntryRequirements: (form.minimumEntryRequirements || '').trim() || undefined,
      evaluationCriteria: (form.evaluationCriteria || '').trim() || undefined,
      examinationFormat: (form.examinationFormat || '').trim() || undefined,
      additionalNotes: (form.additionalNotes || '').trim() || undefined,
      sessionDetails: (form.sessionDetails || '').trim() || undefined,
      imageData: form.imageData || undefined,
      imageUrl: (!form.imageData && form.imageUrl) ? (form.imageUrl || '').trim() || undefined : undefined,
      imageUrls: (form.galleryImages && form.galleryImages.length > 0) ? form.galleryImages : parseImageUrls(form.imageUrlsInput),
    };

    const bp = payload.branchPrices;
    if (!bp.iaacCity && !bp.airportAcademy && !bp.iaacCenter) {
      delete payload.branchPrices;
    }

    return payload;
  };

  const saveCourseEdits = async () => {
    if (!editingCourseId) return;
    const payload = buildCoursePayload(courseForm);

    const res = await apiClient.put(`/api/courses/${editingCourseId}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setCourses((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    }
    closeEditCourse();
  };

  const createCourse = async () => {
    const payload = buildCoursePayload(newCourseForm);
    if (!payload.title || !payload.duration || !payload.courseType) {
      setCourseCreateStatus({ submitting: false, success: false, error: 'Title, course type, and duration are required.' });
      return;
    }

    setCourseCreateStatus({ submitting: true, success: false, error: '' });
    try {
      const res = await apiClient.post('/api/courses', payload);
      const created = res?.data;
      if (created?._id) {
        setCourses((prev) => [created, ...prev]);
        setCourseCreateStatus({ submitting: false, success: true, error: '' });
        resetNewCourseForm();
        setShowNewCourseForm(false);
      } else {
        setCourseCreateStatus({ submitting: false, success: false, error: 'Course was not created.' });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Failed to create course';
      setCourseCreateStatus({ submitting: false, success: false, error: errorMessage });
    }
  };

  const createPractical = async () => {
    const description = (newPracticalForm.shortDescription || '').trim();
    if (!description && (!newPracticalForm.galleryImages || newPracticalForm.galleryImages.length === 0)) {
      setPracticalCreateStatus({ submitting: false, success: false, error: 'Please add a description or at least one image.' });
      return;
    }

    setPracticalCreateStatus({ submitting: true, success: false, error: '' });
    try {
      const payload = {
        title: (newPracticalForm.title || '').trim() || 'Practical Session',
        duration: '-',
        courseType: 'Practical Training',
        shortDescription: description || undefined,
        imageData: newPracticalForm.imageData || undefined,
        imageUrls: (newPracticalForm.galleryImages && newPracticalForm.galleryImages.length > 0) ? newPracticalForm.galleryImages : undefined,
      };
      const res = await apiClient.post('/api/training-programs', payload);
      const created = res?.data;
      if (created?._id) {
        setTrainingPrograms((prev) => [created, ...prev]);
        setPracticalCreateStatus({ submitting: false, success: true, error: '' });
        resetNewPracticalForm();
        setShowNewPracticalForm(false);
      } else {
        setPracticalCreateStatus({ submitting: false, success: false, error: 'Practical was not created.' });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Failed to create practical';
      setPracticalCreateStatus({ submitting: false, success: false, error: errorMessage });
    }
  };

  const deleteCourseById = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this course?')) return;
    await apiClient.delete(`/api/courses/${id}`);
    setCourses((prev) => prev.filter((c) => String(c._id) !== String(id)));
    if (String(editingCourseId) === String(id)) {
      closeEditCourse();
    }
  };

  // --- TRAINING PROGRAMS: EDIT/DELETE ---
  const [editingTrainingId, setEditingTrainingId] = useState(null);

  const openEditTraining = (training) => {
    if (!training?._id) return;
    setEditingTrainingId(training._id);
    setPracticalForm({
      title: training.title || '',
      duration: training.duration || '-',
      courseType: 'Practical Training',
      shortDescription: training.shortDescription || '',
      sessionDetails: training.sessionDetails || '',
      imageUrl: training.imageUrl || '',
      imageData: '',
      imagePreview: training.imageUrl || '',
      galleryImages: Array.isArray(training.imageUrls) ? training.imageUrls : [],
    });
  };

  const closeEditTraining = () => {
    setEditingTrainingId(null);
    setPracticalForm(createEmptyCourseForm({ courseType: 'Practical Training' }));
  };

  const saveTrainingEdits = async () => {
    if (!editingTrainingId) return;
    const payload = {
      title: (practicalForm.title || '').trim() || 'Practical Session',
      duration: (practicalForm.duration || '').trim() || '-',
      shortDescription: (practicalForm.shortDescription || '').trim() || undefined,
      sessionDetails: (practicalForm.sessionDetails || '').trim() || undefined,
      imageData: practicalForm.imageData || undefined,
      imageUrl: (!practicalForm.imageData && practicalForm.imageUrl) ? practicalForm.imageUrl : undefined,
      imageUrls: (practicalForm.galleryImages && practicalForm.galleryImages.length > 0) ? practicalForm.galleryImages : undefined,
    };
    const res = await apiClient.put(`/api/training-programs/${editingTrainingId}`, payload);
    const updated = res?.data;
    if (updated?._id) {
      setTrainingPrograms((prev) => prev.map((t) => (String(t._id) === String(updated._id) ? updated : t)));
    }
    closeEditTraining();
  };

  const deleteTrainingById = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this training program?')) return;
    await apiClient.delete(`/api/training-programs/${id}`);
    setTrainingPrograms((prev) => prev.filter((t) => String(t._id) !== String(id)));
    if (String(editingTrainingId) === String(id)) {
      closeEditTraining();
    }
  };

  // --- EVENTS: EDIT/DELETE ---
  const openEditEvent = (event) => {
    if (!event?._id) return;
    setEditingEventId(event._id);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      imageUrl: event.imageUrl || '',
      imageData: '',
      imagePreview: event.imageUrl || '',
    });
  };

  const closeEditEvent = () => {
    setEditingEventId(null);
    setEventForm({});
  };

  const updateEventForm = (patch) => {
    setEventForm((prev) => ({ ...prev, ...patch }));
  };

  const saveEventEdits = async () => {
    if (!editingEventId) return;
    const payload = {
      title: (eventForm.title || '').trim(),
      description: (eventForm.description || '').trim() || undefined,
      eventDate: eventForm.eventDate || undefined,
      imageData: eventForm.imageData || undefined,
      imageUrl: (!eventForm.imageData && eventForm.imageUrl) ? eventForm.imageUrl : undefined,
    };
    try {
      const res = await apiClient.put(`/api/events/${editingEventId}`, payload);
      const updated = res?.data;
      if (updated?._id) {
        setEvents((prev) => prev.map((ev) => (String(ev._id) === String(updated._id) ? updated : ev)));
      }
      closeEditEvent();
    } catch (err) {
      console.error('Failed to update event', err);
    }
  };

  const deleteEventById = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this event?')) return;
    try {
      await apiClient.delete(`/api/events/${id}`);
      setEvents((prev) => prev.filter((ev) => String(ev._id) !== String(id)));
      if (String(editingEventId) === String(id)) {
        closeEditEvent();
      }
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  // --- EVENTS: CREATE ---
  const resetNewEventForm = () => {
    setNewEventForm({ title: '', description: '', eventDate: '', galleryImages: [] });
    setEventCreateStatus({ submitting: false, success: false, error: '' });
  };

  // ===========================================================================
  // --- FILE TO BASE64 HELPER (UPDATED WITH COMPRESSION) ---
  // ===========================================================================
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Set maximum width to 800px to keep file sizes tiny
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as a JPEG with 70% quality 
          // This turns a 5MB image into an ~80KB string!
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

  // --- IMAGE UPLOAD HANDLERS ---
  const handleEventImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      setEventCreateStatus({ submitting: false, success: false, error: 'Some images were skipped (over 5 MB each).' });
    }
    const base64Arr = await Promise.all(validFiles.map(fileToBase64));
    setNewEventForm((p) => {
      const existing = p.galleryImages || [];
      const combined = [...existing, ...base64Arr].slice(0, 30); 
      return { ...p, galleryImages: combined };
    });
  };

  const handleEventEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await fileToBase64(file);
    setEventForm((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  const handleNoticeImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNoticeCreateStatus({ submitting: false, success: false, error: 'Image must be under 5 MB.' });
      return;
    }
    const base64 = await fileToBase64(file);
    setNewNoticeForm((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  const handleNoticeEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await fileToBase64(file);
    setNoticeForm((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  const handleCourseImageUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await fileToBase64(file);
    setter((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  const handleCourseGalleryUpload = async (e, setter) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const base64Arr = await Promise.all(files.filter(f => f.size <= 5 * 1024 * 1024).map(fileToBase64));
    setter((p) => {
      const existing = p.galleryImages || [];
      return { ...p, galleryImages: [...existing, ...base64Arr] };
    });
  };

  const handleStaffImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStaffCreateStatus({ submitting: false, success: false, error: 'Image must be under 5 MB.' });
      return;
    }
    const base64 = await fileToBase64(file);
    setNewStaffForm((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  // --- STAFF: CREATE ---
  const resetNewStaffForm = () => {
    setNewStaffForm({ name: '', subject: '', description: '', imageData: '', imagePreview: '' });
    setStaffCreateStatus({ submitting: false, success: false, error: '' });
  };

  const createStaff = async () => {
    const name = (newStaffForm.name || '').trim();
    if (!name) {
      setStaffCreateStatus({ submitting: false, success: false, error: 'Lecturer name is required.' });
      return;
    }
    setStaffCreateStatus({ submitting: true, success: false, error: '' });
    try {
      const payload = {
        name,
        subject: (newStaffForm.subject || '').trim() || undefined,
        description: (newStaffForm.description || '').trim() || undefined,
        imageData: newStaffForm.imageData || undefined,
      };
      const res = await apiClient.post('/api/staff', payload);
      const created = res?.data;
      if (created?._id) {
        setStaffMembers((prev) => [created, ...prev]);
        setStaffCreateStatus({ submitting: false, success: true, error: '' });
        resetNewStaffForm();
        setShowNewStaffForm(false);
      } else {
        setStaffCreateStatus({ submitting: false, success: false, error: 'Staff was not created.' });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to create staff member';
      setStaffCreateStatus({ submitting: false, success: false, error: errorMessage });
    }
  };

  // --- STAFF: EDIT/DELETE ---
  const openEditStaff = (staff) => {
    if (!staff?._id) return;
    setEditingStaffId(staff._id);
    setStaffForm({
      name: staff.name || '',
      subject: staff.subject || '',
      description: staff.description || '',
      imageUrl: staff.imageUrl || '',
      imageData: '',
      imagePreview: staff.imageUrl || '',
    });
  };

  const closeEditStaff = () => {
    setEditingStaffId(null);
    setStaffForm({});
  };

  const handleStaffEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const base64 = await fileToBase64(file);
    setStaffForm((p) => ({ ...p, imageData: base64, imagePreview: base64 }));
  };

  const saveStaffEdits = async () => {
    if (!editingStaffId) return;
    const payload = {
      name: (staffForm.name || '').trim(),
      subject: (staffForm.subject || '').trim() || undefined,
      description: (staffForm.description || '').trim() || undefined,
      imageData: staffForm.imageData || undefined,
      imageUrl: staffForm.imageUrl || undefined,
    };
    try {
      const res = await apiClient.put(`/api/staff/${editingStaffId}`, payload);
      const updated = res?.data;
      if (updated?._id) {
        setStaffMembers((prev) => prev.map((s) => (String(s._id) === String(updated._id) ? updated : s)));
      }
      closeEditStaff();
    } catch (err) {
      console.error('Failed to update staff', err);
    }
  };

  const deleteStaffById = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await apiClient.delete(`/api/staff/${id}`);
      setStaffMembers((prev) => prev.filter((s) => String(s._id) !== String(id)));
      if (String(editingStaffId) === String(id)) closeEditStaff();
    } catch (err) {
      console.error('Failed to delete staff', err);
    }
  };

  // --- NOTICE CRUD ---
  const resetNewNoticeForm = () => setNewNoticeForm({ title: '', description: '', imageData: '', imagePreview: '' });

  const createNotice = async () => {
    const title = (newNoticeForm.title || '').trim();
    if (!title) {
      setNoticeCreateStatus({ submitting: false, success: false, error: 'Title is required.' });
      return;
    }
    setNoticeCreateStatus({ submitting: true, success: false, error: '' });
    try {
      const payload = {
        title,
        description: (newNoticeForm.description || '').trim() || undefined,
        imageData: newNoticeForm.imageData || undefined,
      };
      const res = await apiClient.post('/api/notices', payload);
      const created = res?.data;
      if (created?._id) {
        setNotices((prev) => [created, ...prev]);
        setNoticeCreateStatus({ submitting: false, success: true, error: '' });
        resetNewNoticeForm();
        setShowNewNoticeForm(false);
      } else {
        setNoticeCreateStatus({ submitting: false, success: false, error: 'Notice was not created.' });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to create notice';
      setNoticeCreateStatus({ submitting: false, success: false, error: errorMessage });
    }
  };

  const openEditNotice = (notice) => {
    setEditingNoticeId(notice._id);
    setNoticeForm({ title: notice.title || '', description: notice.description || '', imageUrl: notice.imageUrl || '', imageData: '', imagePreview: notice.imageUrl || '' });
  };
  const closeEditNotice = () => { setEditingNoticeId(null); setNoticeForm({}); };

  const saveNoticeEdits = async () => {
    if (!editingNoticeId) return;
    try {
      const payload = {
        title: (noticeForm.title || '').trim(),
        description: (noticeForm.description || '').trim(),
        imageData: noticeForm.imageData || undefined,
        imageUrl: (!noticeForm.imageData && noticeForm.imageUrl) ? noticeForm.imageUrl : undefined,
      };
      const res = await apiClient.put(`/api/notices/${editingNoticeId}`, payload);
      const updated = res?.data;
      if (updated?._id) {
        setNotices((prev) => prev.map((n) => (String(n._id) === String(editingNoticeId) ? updated : n)));
      }
      closeEditNotice();
    } catch (err) {
      console.error('Failed to save notice edits', err);
    }
  };

  const deleteNoticeById = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this notice?')) return;
    try {
      await apiClient.delete(`/api/notices/${id}`);
      setNotices((prev) => prev.filter((n) => String(n._id) !== String(id)));
      if (String(editingNoticeId) === String(id)) closeEditNotice();
    } catch (err) {
      console.error('Failed to delete notice', err);
    }
  };

  const createEvent = async () => {
    const title = (newEventForm.title || '').trim();
    if (!title) {
      setEventCreateStatus({ submitting: false, success: false, error: 'Title is required.' });
      return;
    }
    setEventCreateStatus({ submitting: true, success: false, error: '' });
    try {
      const payload = {
        title,
        description: (newEventForm.description || '').trim() || undefined,
        eventDate: newEventForm.eventDate || undefined,
        imageData: (newEventForm.galleryImages && newEventForm.galleryImages.length > 0) ? newEventForm.galleryImages[0] : undefined,
        imageUrls: (newEventForm.galleryImages && newEventForm.galleryImages.length > 0) ? newEventForm.galleryImages : undefined,
      };
      const res = await apiClient.post('/api/events', payload);
      const created = res?.data;
      if (created?._id) {
        setEvents((prev) => [created, ...prev]);
        setEventCreateStatus({ submitting: false, success: true, error: '' });
        resetNewEventForm();
        setShowNewEventForm(false);
      } else {
        setEventCreateStatus({ submitting: false, success: false, error: 'Event was not created.' });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to create event';
      setEventCreateStatus({ submitting: false, success: false, error: errorMessage });
    }
  };

  // --- HELPER: APPLICATION FIELD NORMALIZATION ---
  const getApplicationName = (app) => safeText(app?.fullName || app?.name);
  const getApplicationCourse = (app) => safeText(app?.course || app?.courseApplied || app?.program);
  const getApplicationPhone = (app) => safeText(app?.mobile || app?.contact || app?.phone);
  const getApplicationWhatsapp = (app) => safeText(app?.whatsapp);
  const getApplicationEmail = (app) => safeText(app?.email);
  const getApplicationAddress = (app) => safeText(app?.homeAddress || app?.address);

  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) return null;
    return applications.find((a) => String(a.id) === String(selectedApplicationId)) || null;
  }, [applications, selectedApplicationId]);

  // --- IMPROVED PDF DOWNLOAD ---
  const downloadApplicationPdf = (app) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 60; // reserve space for footer
    let y = 40;

    // --- Page break helper ---
    const checkPageBreak = (neededSpace = 40) => {
      if (y + neededSpace > pageHeight - marginBottom) {
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
    doc.setTextColor(30, 58, 138); // Dark Blue
    doc.text('IAAC', 40, 50);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139); // Slate
    doc.text('Student Admission Application', 40, 75);

    doc.setFontSize(10);
    doc.text(`Ref ID: ${app.id || 'N/A'}`, pageWidth - 40, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 40, 75, { align: 'right' });

    y = 130;

    // --- Prominent Diploma Badge ---
    const diplomaText = safeText(app?.course || app?.courseApplied || app?.program || 'N/A');
    doc.setFillColor(30, 58, 138); // Dark blue badge
    doc.rect(40, y, pageWidth - 80, 45, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 210, 255);
    doc.text('DIPLOMA PROGRAMME', 55, y + 16);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(diplomaText, 55, y + 34);
    y += 65;

    // Helper to draw sections
    const drawSection = (title, data) => {
      // Check if we need a new page for the section header
      checkPageBreak(70);

      // Section Header
      doc.setFillColor(239, 246, 255); // Light Blue
      doc.rect(40, y, pageWidth - 80, 25, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text(title.toUpperCase(), 50, y + 17);
      
      y += 40;

      // Fields
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      data.forEach(([label, value]) => {
        const textValue = safeText(value);
        const splitText = doc.splitTextToSize(textValue, 350);
        const fieldHeight = (splitText.length * 14) + 6;

        // Check page break before each field
        checkPageBreak(fieldHeight + 10);

        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 50, y);
        
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, 180, y);
        
        // Add spacing based on number of lines
        y += fieldHeight; 
      });

      y += 15; // Spacer after section
    };

    // 1. Personal Info
    drawSection('Personal Information', [
      ['Title', app.title],
      ['Full Name', getApplicationName(app)],
      ['Date of Birth', app.dob ? new Date(app.dob).toLocaleDateString() : '-'],
      ['Gender', app.gender],
      ['NIC / Passport', app.nic],
      ['Address', getApplicationAddress(app)],
    ]);

    // 2. Contact Info
    drawSection('Contact Details', [
      ['Email Address', getApplicationEmail(app)],
      ['Mobile Number', getApplicationPhone(app)],
      ['WhatsApp Number', getApplicationWhatsapp(app)],
    ]);

    // 3. Education
    drawSection('Education', [
      ['School Attended', app.school],
      ['O/L Year', app.olYear],
    ]);

    // O/L Results special table if exists
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

    // 4. Guardian Info (separate section so it's clearly visible)
    drawSection('Parent / Guardian', [
      ['Guardian Name', app.parentName],
      ['Guardian Contact', app.parentPhone || app.parentMobile],
    ]);

    // 5. Program Details
    drawSection('Program Details', [
      ['Diploma Chosen', getApplicationCourse(app)],
      ['Academy / Campus', app.academy],
      ['Referred By', app.referral || 'General Office'],
      ['Application Date', app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'],
      ['Status', app.isDone ? 'Processed' : 'Pending'],
    ]);

    // Footer (on the last page)
    const lastPageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(40, lastPageHeight - 50, pageWidth - 40, lastPageHeight - 50);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This document is electronically generated by the IAAC Administration System.', pageWidth / 2, lastPageHeight - 30, { align: 'center' });

    const fileSafeName = String(getApplicationName(app) || 'Student').replace(/[^a-z0-9]+/gi, '_');
    doc.save(`IAAC_Application_${fileSafeName}.pdf`);
  };

  // --- IMPROVED PRINT LAYOUT ---
  const printApplication = (app) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application - ${getApplicationName(app)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .header h1 { color: #1e3a8a; margin: 0; font-size: 28px; text-transform: uppercase; }
            .header p { color: #64748b; margin: 5px 0 0; font-size: 14px; }
            
            .section { margin-bottom: 30px; }
            .section-title { background: #f1f5f9; padding: 8px 12px; font-weight: bold; color: #1e40af; border-left: 4px solid #2563eb; margin-bottom: 15px; text-transform: uppercase; font-size: 14px; }
            
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 10px; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
            .value { font-size: 15px; font-weight: 500; color: #0f172a; border-bottom: 1px dotted #cbd5e1; padding-bottom: 2px; }
            
            .ol-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .ol-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 14px; }
            .ol-table td.subj { background: #f8fafc; font-weight: 600; width: 60%; }
            
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            
            @media print {
              body { padding: 0; }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>International Airline & Aviation College</h1>
            <p>Student Admission Application Form</p>
          </div>

          <div style="background:#1e3a8a;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:24px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#93c5fd;margin-bottom:4px;">Diploma Programme</div>
            <div style="font-size:18px;font-weight:700;">${getApplicationCourse(app)}</div>
          </div>

          <div class="section">
            <div class="section-title">Program Details</div>
            <div class="grid">
              <div class="field"><span class="label">Diploma Chosen</span><div class="value">${getApplicationCourse(app)}</div></div>
              <div class="field"><span class="label">Academy / Campus</span><div class="value">${safeText(app.academy)}</div></div>
              <div class="field"><span class="label">Referred By</span><div class="value">${safeText(app.referral || 'General Office')}</div></div>
              <div class="field"><span class="label">Application Date</span><div class="value">${app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}</div></div>
              <div class="field"><span class="label">Status</span><div class="value">${app.isDone ? 'Processed' : 'Pending'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="grid">
              <div class="field"><span class="label">Title</span><div class="value">${safeText(app.title)}</div></div>
              <div class="field"><span class="label">Full Name</span><div class="value">${getApplicationName(app)}</div></div>
              <div class="field"><span class="label">NIC / Passport</span><div class="value">${safeText(app.nic)}</div></div>
              <div class="field"><span class="label">Date of Birth</span><div class="value">${app.dob ? new Date(app.dob).toLocaleDateString() : '-'}</div></div>
              <div class="field"><span class="label">Gender</span><div class="value">${safeText(app.gender)}</div></div>
              <div class="field"><span class="label">Mobile</span><div class="value">${getApplicationPhone(app)}</div></div>
              <div class="field"><span class="label">Email</span><div class="value">${getApplicationEmail(app)}</div></div>
              <div class="field"><span class="label">WhatsApp</span><div class="value">${getApplicationWhatsapp(app)}</div></div>
            </div>
            <div class="field" style="margin-top: 10px;">
              <span class="label">Home Address</span>
              <div class="value">${getApplicationAddress(app)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Education</div>
            <div class="grid">
              <div class="field"><span class="label">School Attended</span><div class="value">${safeText(app.school)}</div></div>
              <div class="field"><span class="label">O/L Year</span><div class="value">${safeText(app.olYear)}</div></div>
            </div>
          </div>

          ${app.olResults ? `
          <div class="section">
            <div class="section-title">G.C.E. O/L Results</div>
            <table class="ol-table">
              ${Object.entries(app.olResults).map(([k, v]) => `<tr><td class="subj">${k.charAt(0).toUpperCase() + k.slice(1)}</td><td>${v || '-'}</td></tr>`).join('')}
            </table>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Parent / Guardian</div>
            <div class="grid">
              <div class="field"><span class="label">Guardian Name</span><div class="value">${safeText(app.parentName)}</div></div>
              <div class="field"><span class="label">Guardian Contact</span><div class="value">${safeText(app.parentPhone || app.parentMobile)}</div></div>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleString()} by IAAC Admin Portal.<br/>
            This is a computer-generated document and requires no signature.
          </div>

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;

    const w = window.open('', '_blank', 'width=900,height=800');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // --- DOWNLOAD PENDING APPLICATIONS REPORT (PDF) ---
  const downloadPendingReport = () => {
    const pending = applications.filter((a) => !a.isDone);
    if (pending.length === 0) {
      alert('No pending applications to export.');
      return;
    }

    const groupedByBranch = pending.reduce((acc, app) => {
      const branchName = String(app.academy || app.branch || app.campus || 'Unassigned').trim() || 'Unassigned';
      if (!acc[branchName]) acc[branchName] = [];
      acc[branchName].push(app);
      return acc;
    }, {});

    const sortedBranches = Object.keys(groupedByBranch).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginTop = 40;
    const marginBottom = 40;

    // --- Title ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('Pending Student Applications Report', marginX, marginTop);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Total Pending: ${pending.length}`, marginX, marginTop + 18);

    // --- Table Config ---
    const headers = ['#', 'Student Name', 'Diploma', 'Mobile Number', 'WhatsApp Number', 'O/L Maths', 'O/L English'];
    const colWidths = [30, 190, 180, 110, 110, 65, 65];
    const rowHeight = 24;
    const headerHeight = 26;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = marginTop + 38;
    let currentBranch = '';
    let currentBranchCount = 0;

    const drawBranchHeading = (branchName, count, continued = false) => {
      const label = continued ? `${branchName} (continued)` : branchName;
      doc.setFillColor(239, 246, 255);
      doc.rect(marginX, y, tableWidth, 24, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text(`Branch: ${label}`, marginX + 8, y + 16);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Pending: ${count}`, marginX + tableWidth - 8, y + 16, { align: 'right' });
      y += 30;
    };

    const drawTableHeader = () => {
      doc.setFillColor(30, 58, 138);
      doc.rect(marginX, y, tableWidth, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let x = marginX;
      headers.forEach((h, i) => {
        doc.text(h, x + 6, y + 17);
        x += colWidths[i];
      });
      y += headerHeight;
    };

    const drawRow = (cells, isEven) => {
      if (y + rowHeight > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
        drawBranchHeading(currentBranch, currentBranchCount, true);
        drawTableHeader();
      }
      if (isEven) {
        doc.setFillColor(245, 247, 250);
        doc.rect(marginX, y, tableWidth, rowHeight, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      let x = marginX;
      cells.forEach((cell, i) => {
        const maxW = colWidths[i] - 12;
        let text = String(cell ?? '-');
        // Truncate with ellipsis if too long
        if (doc.getTextWidth(text) > maxW) {
          while (doc.getTextWidth(text + '...') > maxW && text.length > 1) {
            text = text.slice(0, -1);
          }
          text = text.trim() + '...';
        }
        doc.text(text, x + 6, y + 16);
        x += colWidths[i];
      });
      // row border bottom
      doc.setDrawColor(220, 220, 220);
      doc.line(marginX, y + rowHeight, marginX + tableWidth, y + rowHeight);
      y += rowHeight;
    };

    sortedBranches.forEach((branchName, branchIdx) => {
      const branchItems = groupedByBranch[branchName] || [];
      if (!branchItems.length) return;

      if (y + 54 > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
      }

      currentBranch = branchName;
      currentBranchCount = branchItems.length;
      drawBranchHeading(branchName, branchItems.length);
      drawTableHeader();

      branchItems.forEach((app, idx) => {
        const name = (app.fullName || app.name || `${app.firstName || ''} ${app.lastName || ''}`.trim() || '-').trim();
        const diploma = app.course || app.courseApplied || app.program || '-';
        const mobile = app.mobile || app.contact || app.phone || '-';
        const whatsapp = app.whatsapp || '-';
        const mathResult = app.olResults?.math || app.olResults?.mathematics || '-';
        const engResult = app.olResults?.english || '-';
        drawRow([idx + 1, name, diploma, mobile, whatsapp, mathResult, engResult], idx % 2 === 0);
      });

      if (branchIdx < sortedBranches.length - 1) {
        y += 14;
      }
    });

    // --- Footer on each page ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
      doc.setPage(pageNum);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text('IAAC - Confidential', marginX, pageH - 20);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageW - marginX, pageH - 20, { align: 'right' });
    }

    doc.save(`Pending_Applications_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // --- DOWNLOAD MONTHLY APPLICATIONS TRACKING REPORT (PDF) ---
  const downloadMonthlyApplicationsReport = () => {
    if (applications.length === 0) {
      alert('No applications available to export.');
      return;
    }

    if (monthlyReportMonth && !monthlyReportYear) {
      alert('Please select a year before selecting a month.');
      return;
    }

    const yearFilter = monthlyReportYear ? Number(monthlyReportYear) : null;
    const monthFilter = monthlyReportMonth ? Number(monthlyReportMonth) : null; // 1-12

    const filteredApps = applications.filter((app) => {
      const createdAt = app?.createdAt ? new Date(app.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      if (yearFilter !== null && createdAt.getFullYear() !== yearFilter) return false;
      if (monthFilter !== null && (createdAt.getMonth() + 1) !== monthFilter) return false;
      return true;
    });

    const monthlyMap = filteredApps.reduce((acc, app) => {
      const createdAt = app?.createdAt ? new Date(app.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return acc;
      }

      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          monthLabel: createdAt.toLocaleString('default', { month: 'long', year: 'numeric' }),
          total: 0,
          pending: 0,
          processed: 0,
          branches: {},
        };
      }

      acc[monthKey].total += 1;
      if (app.isDone) {
        acc[monthKey].processed += 1;
      } else {
        acc[monthKey].pending += 1;
      }

      const branchName = String(app.academy || app.branch || app.campus || 'Unassigned').trim() || 'Unassigned';
      acc[monthKey].branches[branchName] = (acc[monthKey].branches[branchName] || 0) + 1;

      return acc;
    }, {});

    const monthlyRows = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    if (monthlyRows.length === 0) {
      alert('No valid application dates found to build monthly report.');
      return;
    }

    const totalApplications = monthlyRows.reduce((sum, row) => sum + row.total, 0);
    const totalPending = monthlyRows.reduce((sum, row) => sum + row.pending, 0);
    const totalProcessed = monthlyRows.reduce((sum, row) => sum + row.processed, 0);

    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginTop = 40;
    const marginBottom = 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('Monthly Applications Tracking Report', marginX, marginTop);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const scopeParts = [];
    if (yearFilter !== null) scopeParts.push(`Year: ${yearFilter}`);
    if (monthFilter !== null) {
      const monthLabel = new Date(2000, monthFilter - 1, 1).toLocaleString('default', { month: 'long' });
      scopeParts.push(`Month: ${monthLabel}`);
    }
    const scopeText = scopeParts.length ? `Scope: ${scopeParts.join('  |  ')}` : 'Scope: All time';
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  ${scopeText}`, marginX, marginTop + 18);
    doc.text(`Months: ${monthlyRows.length} | Total: ${totalApplications} | Pending: ${totalPending} | Processed: ${totalProcessed}`, marginX, marginTop + 32);

    const headers = ['Month', 'Total', 'Pending', 'Processed', 'Branch Breakdown'];
    const colWidths = [120, 70, 70, 80, 415];
    const headerHeight = 26;
    const minRowHeight = 24;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = marginTop + 52;

    const drawTableHeader = () => {
      doc.setFillColor(30, 58, 138);
      doc.rect(marginX, y, tableWidth, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      let x = marginX;
      headers.forEach((header, index) => {
        doc.text(header, x + 6, y + 17);
        x += colWidths[index];
      });
      y += headerHeight;
    };

    const drawRow = (cells, isEven) => {
      const splitCells = cells.map((cell, index) => doc.splitTextToSize(String(cell ?? '-'), colWidths[index] - 12));
      const maxLines = Math.max(...splitCells.map((lines) => lines.length));
      const rowHeight = Math.max(minRowHeight, (maxLines * 12) + 8);

      if (y + rowHeight > pageH - marginBottom) {
        doc.addPage();
        y = marginTop;
        drawTableHeader();
      }

      if (isEven) {
        doc.setFillColor(245, 247, 250);
        doc.rect(marginX, y, tableWidth, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);

      let x = marginX;
      splitCells.forEach((lines, index) => {
        doc.text(lines, x + 6, y + 14);
        x += colWidths[index];
      });

      doc.setDrawColor(220, 220, 220);
      doc.line(marginX, y + rowHeight, marginX + tableWidth, y + rowHeight);
      y += rowHeight;
    };

    drawTableHeader();

    monthlyRows.forEach((row, index) => {
      const branchSummary = Object.entries(row.branches)
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return a[0].localeCompare(b[0]);
        })
        .map(([branch, count]) => `${branch} (${count})`)
        .join(', ');

      drawRow([
        row.monthLabel,
        row.total,
        row.pending,
        row.processed,
        branchSummary || '-',
      ], index % 2 === 0);
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
      doc.setPage(pageNum);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text('IAAC - Monthly Intake Tracking', marginX, pageH - 20);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageW - marginX, pageH - 20, { align: 'right' });
    }

    const fileParts = ['Monthly_Applications_Report'];
    if (yearFilter !== null) fileParts.push(String(yearFilter));
    if (monthFilter !== null) fileParts.push(String(monthFilter).padStart(2, '0'));
    fileParts.push(new Date().toISOString().slice(0, 10));
    doc.save(`${fileParts.join('_')}.pdf`);
  };

  // --- VIEW: APPLICATIONS (CARD GRID) ---
  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center px-1 sm:px-2 gap-3">
        <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Student Applications</h3>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={monthlyReportYear}
              onChange={(e) => setMonthlyReportYear(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none"
              title="Select year for monthly report"
            >
              {availableApplicationYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <select
              value={monthlyReportMonth}
              onChange={(e) => setMonthlyReportMonth(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none"
              title="Select month (optional)"
            >
              <option value="">All months</option>
              {Array.from({ length: 12 }).map((_, i) => {
                const value = String(i + 1);
                const label = new Date(2000, i, 1).toLocaleString('default', { month: 'short' });
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
          </div>
          <button
            onClick={downloadMonthlyApplicationsReport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-colors"
            title="Download monthly applications tracking report as PDF"
          >
            <Download size={14} /> Monthly Report
          </button>
          <button
            onClick={downloadPendingReport}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-colors"
            title="Download pending applications report as PDF"
          >
            <Download size={14} /> Download Report
          </button>
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200 shrink-0">
            {applications.filter((a) => !a.isDone).length} Pending
          </span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          No applications received yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {applications.map((app) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={app.id} 
              className={`group relative p-6 rounded-3xl border transition-all duration-300 ${
                app.isDone 
                  ? 'bg-slate-50 border-slate-200 opacity-75' 
                  : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                  app.isDone ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'
                }`}>
                  {(app.fullName || app.name || '?').charAt(0)}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  app.isDone ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'
                }`}>
                  {app.course || 'General'}
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h4 className={`font-bold text-lg mb-1 truncate ${app.isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {getApplicationName(app)}
                </h4>
                <p className="text-xs text-slate-400 mb-4">{app.nic || 'No NIC'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400" /> {getApplicationPhone(app)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-slate-400" /> {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button 
                  onClick={() => setSelectedApplicationId(app.id)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <Eye size={14} /> View Details
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (!window.confirm('Approve this application and send acceptance email to the student?')) return;
                      try {
                        const res = await apiClient.post(`/api/admin/applications/${app.id}/approve`, {}, { timeout: 30000 });
                        if (res?.data?.approved) {
                          setApplications((prev) => prev.map((x) => (x.id === app.id ? { ...x, isDone: true } : x)));
                          alert(res.data.message || 'Application approved!');
                        }
                      } catch (e) {
                        const msg = e?.response?.data?.details || e?.response?.data?.message || 'Failed to approve. Please check your connection and try again.';
                        alert(msg);
                      }
                    }}
                    disabled={app.isDone}
                    className={`p-2 rounded-full transition-colors ${
                      app.isDone ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    title="Approve & Send Email"
                  >
                    <Award size={16} />
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await apiClient.patch(`/api/admin/applications/${app.id}/done`);
                        const isDone = !!res?.data?.isDone;
                        setApplications((prev) => prev.map((x) => (x.id === app.id ? { ...x, isDone } : x)));
                      } catch (e) {}
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      app.isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                    title={app.isDone ? "Mark Pending" : "Mark Done"}
                  >
                    <CheckCircle size={16} />
                  </button>
                  
                  <button 
                    onClick={async () => {
                      if(window.confirm('Delete application?')) {
                        await apiClient.delete(`/api/admin/applications/${app.id}`);
                        setApplications(prev => prev.filter(x => x.id !== app.id));
                      }
                    }}
                    disabled={app.isDone}
                    className={`p-2 rounded-full transition-colors ${
                      app.isDone ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VIEW: MESSAGES (CLEAN LIST) ---
  const renderMessages = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">Inbox</h3>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{messages.length} Messages</div>
      </div>
      <div className="divide-y divide-slate-100">
        {messages.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400">No new messages.</div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`p-4 sm:p-6 transition-all hover:bg-slate-50 ${msg.isDone ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">{msg.name}</h4>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-blue-100">
                    {msg.subject || 'Inquiry'}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto md:ml-0">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {msg.message || 'No content provided.'}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  {msg.email && (
                    <a href={`mailto:${msg.email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail size={12} /> {msg.email}
                    </a>
                  )}
                  {msg.phone && (
                    <a href={`tel:${msg.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Phone size={12} /> {msg.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Message Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await apiClient.patch(`/api/admin/messages/${msg.id}/done`);
                      const isDone = !!res?.data?.isDone;
                      setMessages((prev) => prev.map((x) => (x.id === msg.id ? { ...x, isDone } : x)));
                    } catch (e) {}
                  }}
                  className={`p-2 rounded-lg transition-colors ${msg.isDone ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                  title="Mark as Read"
                >
                  <CheckCircle size={18} />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete message?')) {
                      await apiClient.delete(`/api/admin/messages/${msg.id}`);
                      setMessages(prev => prev.filter(x => x.id !== msg.id));
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- VIEW: COURSES ---
  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1 sm:px-2 gap-3">
        <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Courses</h3>
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200">
          {courses.length} Total
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add New Course</p>
            <p className="text-sm text-slate-500">Publish instantly to the Programs page once saved.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCourseForm((prev) => !prev)}
            className="px-4 py-2 rounded-xl font-bold text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            {showNewCourseForm ? 'Hide form' : 'Add course'}
          </button>
        </div>

        {showNewCourseForm && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  value={newCourseForm.title}
                  onChange={(e) => updateNewCourseForm({ title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Diploma in Airline Ticketing"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Type</label>
                <select
                  value={newCourseForm.courseType}
                  onChange={(e) => updateNewCourseForm({ courseType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">Select Course Type</option>
                  {existingCourseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration</label>
                <input
                  value={newCourseForm.duration}
                  onChange={(e) => updateNewCourseForm({ duration: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="06 to 08 Months (Part Time)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Course Fee</label>
                <input
                  value={newCourseForm.totalCourseFee}
                  onChange={(e) => updateNewCourseForm({ totalCourseFee: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="LKR 100,000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Short Description</label>
              <textarea
                value={newCourseForm.shortDescription}
                onChange={(e) => updateNewCourseForm({ shortDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                placeholder="Brief summary shown on cards"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="text-sm font-bold text-slate-800 mb-3">Branch Prices (optional)</div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">City Campus</label>
                  <input
                    value={newCourseForm.branchPrices?.iaacCity}
                    onChange={(e) => updateNewBranchPrice('iaacCity', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                    placeholder="LKR 80,000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Airport Academy</label>
                  <input
                    value={newCourseForm.branchPrices?.airportAcademy}
                    onChange={(e) => updateNewBranchPrice('airportAcademy', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                    placeholder="LKR 90,000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">IAAC Center</label>
                  <input
                    value={newCourseForm.branchPrices?.iaacCenter}
                    onChange={(e) => updateNewBranchPrice('iaacCenter', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                    placeholder="LKR 80,000"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Minimum Entry Requirements</label>
                <textarea
                  value={newCourseForm.minimumEntryRequirements}
                  onChange={(e) => updateNewCourseForm({ minimumEntryRequirements: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Evaluation Criteria</label>
                <textarea
                  value={newCourseForm.evaluationCriteria}
                  onChange={(e) => updateNewCourseForm({ evaluationCriteria: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Examination Format</label>
                <textarea
                  value={newCourseForm.examinationFormat}
                  onChange={(e) => updateNewCourseForm({ examinationFormat: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Additional Notes</label>
                <textarea
                  value={newCourseForm.additionalNotes}
                  onChange={(e) => updateNewCourseForm({ additionalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Details</label>
                <textarea
                  value={newCourseForm.sessionDetails}
                  onChange={(e) => updateNewCourseForm({ sessionDetails: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                  placeholder="e.g. Weekend batches, simulator hours, on-site visits"
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-medium text-red-600">{courseCreateStatus.error}</div>
              {courseCreateStatus.success && (
                <div className="text-sm font-medium text-emerald-600">Course saved and visible on Programs.</div>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={resetNewCourseForm}
                  className="px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={createCourse}
                  disabled={courseCreateStatus.submitting}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {courseCreateStatus.submitting ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          No courses available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div key={c._id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-lg text-slate-900 leading-snug whitespace-normal break-words">
                    {c.title}
                  </h4>
                  <div className="mt-2">
                    <span className="inline-flex text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-indigo-100">
                      {c.courseType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditCourse(c)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Edit course"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCourseById(c._id)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete course"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">Duration: <span className="font-bold text-slate-800">{c.duration}</span></p>
              {c.shortDescription && <p className="text-sm text-slate-600 mb-3 line-clamp-3">{c.shortDescription}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {c.totalCourseFee && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">Total Fee</span><div className="font-bold text-slate-800">{c.totalCourseFee}</div></div>}
                {c.branchPrices?.iaacCity && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">City Campus</span><div className="font-bold text-slate-800">{c.branchPrices.iaacCity}</div></div>}
                {c.branchPrices?.airportAcademy && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">Airport Academy</span><div className="font-bold text-slate-800">{c.branchPrices.airportAcademy}</div></div>}
                {c.branchPrices?.iaacCenter && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">IAAC Center</span><div className="font-bold text-slate-800">{c.branchPrices.iaacCenter}</div></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VIEW: PRACTICAL TRAININGS ---
  const renderPractical = () => {
    const trainings = trainingPrograms;
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Practical Trainings</h3>
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200">
            {trainings.length} Total
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Practical Session</p>
              <p className="text-sm text-slate-500">Create hands-on sessions with gallery and session notes.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewPracticalForm((prev) => !prev)}
              className="px-4 py-2 rounded-xl font-bold text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showNewPracticalForm ? 'Hide form' : 'Add practical'}
            </button>
          </div>

          {showNewPracticalForm && (
            <div className="space-y-5">

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Name</label>
                <input
                  type="text"
                  value={newPracticalForm.title}
                  onChange={(e) => setNewPracticalForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="e.g. Fire Safety Training"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleCourseGalleryUpload(e, setNewPracticalForm)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {newPracticalForm.galleryImages && newPracticalForm.galleryImages.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {newPracticalForm.galleryImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt={`Session ${i+1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => setNewPracticalForm(p => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={newPracticalForm.shortDescription}
                  onChange={(e) => setNewPracticalForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[120px]"
                  placeholder="Describe this practical session..."
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm font-medium text-red-600">{practicalCreateStatus.error}</div>
                {practicalCreateStatus.success && (
                  <div className="text-sm font-medium text-emerald-600">Practical session saved!</div>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={resetNewPracticalForm}
                    className="px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={createPractical}
                    disabled={practicalCreateStatus.submitting}
                    className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {practicalCreateStatus.submitting ? 'Saving...' : 'Add Session'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {trainings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            No practical trainings available.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((t) => (
              <div key={t._id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-lg text-slate-900 leading-snug whitespace-normal break-words">
                      {t.title}
                    </h4>
                    <div className="mt-2">
                      <span className="inline-flex text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-emerald-100">
                        Practical
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTraining(t)}
                      className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit training"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTrainingById(t._id)}
                      className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete training"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">Duration: <span className="font-bold text-slate-800">{t.duration}</span></p>
                {t.shortDescription && <p className="text-sm text-slate-600 mb-3 line-clamp-3">{t.shortDescription}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {t.totalCourseFee && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">Total Fee</span><div className="font-bold text-slate-800">{t.totalCourseFee}</div></div>}
                  {t.branchPrices?.airportAcademy && <div className="bg-slate-50 border border-slate-200 rounded-lg p-2"><span className="text-slate-500">Airport Academy</span><div className="font-bold text-slate-800">{t.branchPrices.airportAcademy}</div></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- VIEW: EVENTS ---
  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Events</h3>
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200">
          {events.length} Total
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add New Event</p>
            <p className="text-sm text-slate-500">Create an event that appears on the Events page.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewEventForm((prev) => !prev)}
            className="px-4 py-2 rounded-xl font-bold text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            {showNewEventForm ? 'Hide form' : 'Add event'}
          </button>
        </div>

        {showNewEventForm && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Graduation Ceremony 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event Date</label>
                <input
                  type="date"
                  value={newEventForm.eventDate}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, eventDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Images <span className="text-slate-400 normal-case font-normal">(up to 30)</span></label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEventImageUpload}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {newEventForm.galleryImages && newEventForm.galleryImages.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">{newEventForm.galleryImages.length} Image{newEventForm.galleryImages.length > 1 ? 's' : ''} selected</p>
                <div className="flex gap-2 flex-wrap">
                  {newEventForm.galleryImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt={`Event ${i+1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                      <button type="button" onClick={() => setNewEventForm(p => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                value={newEventForm.description}
                onChange={(e) => setNewEventForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[120px]"
                placeholder="Event details..."
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-medium text-red-600">{eventCreateStatus.error}</div>
              {eventCreateStatus.success && (
                <div className="text-sm font-medium text-emerald-600">Event created successfully.</div>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={resetNewEventForm}
                  className="px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={createEvent}
                  disabled={eventCreateStatus.submitting}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {eventCreateStatus.submitting ? 'Saving...' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          No events available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <div key={e._id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
              {e.imageUrl && (
                <img src={e.imageUrl} alt={e.title} className="w-full h-40 object-cover rounded-2xl mb-3 border border-slate-100" />
              )}
              <div className="flex items-start justify-between mb-2 gap-2">
                <h4 className="font-bold text-lg text-slate-900 truncate flex-1">{e.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  {e.eventDate && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-blue-100">
                      {new Date(e.eventDate).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditEvent(e)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Edit event"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEventById(e._id)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete event"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {e.description && <p className="text-sm text-slate-600 line-clamp-3">{e.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VIEW: STAFF ---
  const renderStaff = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Staff</h3>
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200">
          {staffMembers.length} Total
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Staff Member</p>
            <p className="text-sm text-slate-500">Upload a photo and add lecturer details.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewStaffForm((prev) => !prev)}
            className="px-4 py-2 rounded-xl font-bold text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            {showNewStaffForm ? 'Hide form' : 'Add staff'}
          </button>
        </div>

        {showNewStaffForm && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lecturer Name</label>
                <input
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Mr. John Perera"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject / Role</label>
                <input
                  value={newStaffForm.subject}
                  onChange={(e) => setNewStaffForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Aviation Safety & Regulations"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Photo (upload from device)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStaffImageUpload}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {newStaffForm.imagePreview && (
              <div className="flex items-center gap-4">
                <img src={newStaffForm.imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setNewStaffForm((p) => ({ ...p, imageData: '', imagePreview: '' }))}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                value={newStaffForm.description}
                onChange={(e) => setNewStaffForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                placeholder="Brief bio or qualifications..."
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-medium text-red-600">{staffCreateStatus.error}</div>
              {staffCreateStatus.success && (
                <div className="text-sm font-medium text-emerald-600">Staff member added.</div>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={resetNewStaffForm}
                  className="px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={createStaff}
                  disabled={staffCreateStatus.submitting}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {staffCreateStatus.submitting ? 'Saving...' : 'Add Staff'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {staffMembers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          No staff members available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffMembers.map((s) => (
            <div key={s._id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4">
                {s.imageUrl && (
                  <img src={s.imageUrl} alt={s.name} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-slate-900 truncate">{s.name}</h4>
                  {s.subject && <div className="text-xs text-blue-600 font-bold mt-0.5">{s.subject}</div>}
                  <div className="text-xs text-slate-500">{s.role || s.category || 'Staff'}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditStaff(s)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStaffById(s._id)}
                    className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {s.description && <p className="text-sm text-slate-600 mt-3 line-clamp-3">{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VIEW: NOTICES ---
  const renderNotices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-slate-800 text-lg sm:text-2xl">Notices</h3>
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-blue-200">
            {notices.length} Total
          </span>
          <button
            onClick={() => { setShowNewNoticeForm((p) => !p); setNoticeCreateStatus({ submitting: false, success: false, error: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            {showNewNoticeForm ? <X size={16} /> : <Plus size={16} />}
            {showNewNoticeForm ? 'Cancel' : 'Add Notice'}
          </button>
        </div>
      </div>

      {/* Add Notice Form */}
      <AnimatePresence>
        {showNewNoticeForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-lg text-slate-800">New Notice</h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  value={newNoticeForm.title}
                  onChange={(e) => setNewNoticeForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Notice title"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNoticeImageUpload}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {newNoticeForm.imagePreview && (
                  <img src={newNoticeForm.imagePreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-100" />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={newNoticeForm.description}
                  onChange={(e) => setNewNoticeForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Notice description..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                />
              </div>
              {noticeCreateStatus.error && <p className="text-red-500 text-sm font-medium">{noticeCreateStatus.error}</p>}
              {noticeCreateStatus.success && <p className="text-green-500 text-sm font-medium">Notice created!</p>}
              <div className="flex justify-end">
                <button
                  onClick={createNotice}
                  disabled={noticeCreateStatus.submitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {noticeCreateStatus.submitting ? 'Saving...' : 'Create Notice'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {notices.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          No notices available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((n) => (
            <div key={n._id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-lg text-slate-900 truncate flex-1">{n.title}</h4>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => openEditNotice(n)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteNoticeById(n._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <span className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-slate-200 mb-2 inline-block">
                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
              </span>
              {n.imageUrl && (
                <img src={n.imageUrl} alt={n.title} className="w-full h-32 object-cover rounded-2xl mb-3 border border-slate-100" />
              )}
              {n.description && <p className="text-sm text-slate-600 line-clamp-3">{n.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 pt-24 pb-6 flex flex-col transition-transform duration-300 z-50 md:z-30 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <nav className="flex-1 space-y-2 px-3 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => { setActiveTab(item.value); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.value 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.value === 'application' && applications.length > 0 && (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'application' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  {applications.filter(a => !a.isDone).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 pt-20 px-3 sm:px-6 pb-12 overflow-x-hidden min-w-0">
        <div className="max-w-7xl mx-auto">
          
          <header className="mb-6 sm:mb-8 flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 capitalize flex items-center gap-2 sm:gap-3">
                {navItems.find(n => n.value === activeTab)?.icon && React.createElement(navItems.find(n => n.value === activeTab).icon, { size: 22, className: "text-blue-600 hidden sm:block" })}
                {navItems.find(n => n.value === activeTab)?.label}
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm sm:text-base">Manage your academy's {activeTab}s.</p>
            </div>
          </header>

          {/* CONTENT SWITCHER */}
          {activeTab === 'application' && renderApplications()}
          {activeTab === 'message' && renderMessages()}
          
          {activeTab === 'course' && renderCourses()}
          {activeTab === 'practical' && renderPractical()}
          {activeTab === 'event' && renderEvents()}
          {activeTab === 'staff' && renderStaff()}
          {activeTab === 'notice' && renderNotices()}

        </div>
      </main>

      {/* --- APPLICATION DETAILS MODAL (POPUP) --- */}
      <AnimatePresence>
        {selectedApplication && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedApplicationId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center z-10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Application Details</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 truncate">ID: {selectedApplication.id}</p>
                </div>
                <button onClick={() => setSelectedApplicationId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"><X size={24} className="text-slate-400"/></button>
              </div>
              
              <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                {/* Header Info */}
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg shadow-blue-200 shrink-0">
                    {(selectedApplication.fullName || selectedApplication.name || '?').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{getApplicationName(selectedApplication)}</h3>
                    <p className="text-slate-500 text-sm sm:text-base truncate">{getApplicationEmail(selectedApplication)}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">{getApplicationCourse(selectedApplication)}</span>
                      {selectedApplication.isDone && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Processed</span>}
                    </div>
                  </div>
                </div>

                {/* Personal Info Grid */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-blue-500"/> Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-8">
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Title</label><p className="font-medium text-slate-800">{selectedApplication.title || '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><p className="font-medium text-slate-800">{getApplicationName(selectedApplication)}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">NIC / Passport</label><p className="font-medium text-slate-800">{selectedApplication.nic || '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Date of Birth</label><p className="font-medium text-slate-800">{selectedApplication.dob ? new Date(selectedApplication.dob).toLocaleDateString() : '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Gender</label><p className="font-medium text-slate-800">{selectedApplication.gender || '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Applied On</label><p className="font-medium text-slate-800">{selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleDateString() : '-'}</p></div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Phone size={18} className="text-blue-500"/> Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-8">
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Mobile</label><p className="font-medium text-slate-800">{getApplicationPhone(selectedApplication)}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">WhatsApp</label><p className="font-medium text-slate-800">{getApplicationWhatsapp(selectedApplication)}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Email</label><p className="font-medium text-slate-800">{getApplicationEmail(selectedApplication)}</p></div>
                    <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">Home Address</label><p className="font-medium text-slate-800">{getApplicationAddress(selectedApplication)}</p></div>
                  </div>
                </div>

                {/* Education */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-blue-500"/> Education History</h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <p className="text-sm"><span className="font-bold text-slate-600">School:</span> {selectedApplication.school || '-'}</p>
                      <p className="text-sm"><span className="font-bold text-slate-600">O/L Year:</span> {selectedApplication.olYear || '-'}</p>
                    </div>
                    
                    {selectedApplication.olResults && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(selectedApplication.olResults).map(([subj, grade]) => (
                          <div key={subj} className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex justify-between text-xs">
                            <span className="capitalize text-slate-500">{subj}</span>
                            <span className="font-bold text-slate-900">{grade || '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent / Guardian */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500"/> Guardian Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Guardian Name</label><p className="font-medium text-slate-800">{selectedApplication.parentName || '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Guardian Contact</label><p className="font-medium text-slate-800">{selectedApplication.parentPhone || '-'}</p></div>
                  </div>
                </div>

                {/* Program Details */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> Program Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Course Applied</label><p className="font-medium text-slate-800">{getApplicationCourse(selectedApplication)}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Academy / Campus</label><p className="font-medium text-slate-800">{selectedApplication.academy || '-'}</p></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase">Referred By</label><p className="font-medium text-slate-800">{selectedApplication.referral || 'General Office'}</p></div>
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-auto flex-wrap">
                {!selectedApplication.isDone && (
                  <button 
                    onClick={async () => {
                      if (!window.confirm('Approve this application and send acceptance email?')) return;
                      try {
                        const res = await apiClient.post(`/api/admin/applications/${selectedApplication.id}/approve`, {}, { timeout: 30000 });
                        if (res?.data?.approved) {
                          setApplications((prev) => prev.map((x) => (x.id === selectedApplication.id ? { ...x, isDone: true } : x)));
                          alert(res.data.message || 'Application approved!');
                        }
                      } catch (e) {
                        const msg = e?.response?.data?.details || e?.response?.data?.message || 'Failed to approve. Please check your connection and try again.';
                        alert(msg);
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Award size={16}/> Approve & Send Email
                  </button>
                )}
                <button 
                  onClick={() => downloadApplicationPdf(selectedApplication)}
                  className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <FileText size={16}/> Save as PDF
                </button>
                <button 
                  onClick={() => printApplication(selectedApplication)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FileText size={16}/> Print Application
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- COURSE EDIT MODAL --- */}
      <AnimatePresence>
        {editingCourseId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeEditCourse}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center z-10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Edit Course</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 truncate">ID: {editingCourseId}</p>
                </div>
                <button onClick={closeEditCourse} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4 sm:p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                    <input
                      value={courseForm.title || ''}
                      onChange={(e) => updateCourseForm({ title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder="Course title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Type</label>
                    <select
                      value={courseForm.courseType || ''}
                      onChange={(e) => updateCourseForm({ courseType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm bg-white"
                    >
                      <option value="">Select Course Type</option>
                      {existingCourseTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration</label>
                    <input
                      value={courseForm.duration || ''}
                      onChange={(e) => updateCourseForm({ duration: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder="06 to 08 Months (Part Time)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Course Fee</label>
                    <input
                      value={courseForm.totalCourseFee || ''}
                      onChange={(e) => updateCourseForm({ totalCourseFee: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder="LKR 100,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Short Description</label>
                  <textarea
                    value={courseForm.shortDescription || ''}
                    onChange={(e) => updateCourseForm({ shortDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    placeholder="A short summary shown on cards"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="text-sm font-bold text-slate-800 mb-3">Branch Prices (optional)</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">City Campus</label>
                      <input
                        value={courseForm.branchPrices?.iaacCity || ''}
                        onChange={(e) => updateBranchPrice('iaacCity', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                        placeholder="LKR 80,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Airport Academy</label>
                      <input
                        value={courseForm.branchPrices?.airportAcademy || ''}
                        onChange={(e) => updateBranchPrice('airportAcademy', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                        placeholder="LKR 90,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">IAAC Center</label>
                      <input
                        value={courseForm.branchPrices?.iaacCenter || ''}
                        onChange={(e) => updateBranchPrice('iaacCenter', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm"
                        placeholder="LKR 80,000"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Minimum Entry Requirements</label>
                    <textarea
                      value={courseForm.minimumEntryRequirements || ''}
                      onChange={(e) => updateCourseForm({ minimumEntryRequirements: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Evaluation Criteria</label>
                    <textarea
                      value={courseForm.evaluationCriteria || ''}
                      onChange={(e) => updateCourseForm({ evaluationCriteria: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Examination Format</label>
                    <textarea
                      value={courseForm.examinationFormat || ''}
                      onChange={(e) => updateCourseForm({ examinationFormat: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Additional Notes</label>
                    <textarea
                      value={courseForm.additionalNotes || ''}
                      onChange={(e) => updateCourseForm({ additionalNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Details</label>
                    <textarea
                      value={courseForm.sessionDetails || ''}
                      onChange={(e) => updateCourseForm({ sessionDetails: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[90px]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => deleteCourseById(editingCourseId)}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={saveCourseEdits}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TRAINING PROGRAM EDIT MODAL --- */}
      <AnimatePresence>
        {editingTrainingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeEditTraining}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center z-10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Edit Training Program</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 truncate">ID: {editingTrainingId}</p>
                </div>
                <button onClick={closeEditTraining} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4 sm:p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Name</label>
                  <input
                    value={practicalForm.title || ''}
                    onChange={(e) => setPracticalForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g. Fire Safety Training"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleCourseGalleryUpload(e, setPracticalForm)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {practicalForm.galleryImages && practicalForm.galleryImages.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {practicalForm.galleryImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={img} alt={`Session ${i+1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                          <button type="button" onClick={() => setPracticalForm(p => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={practicalForm.shortDescription || ''}
                    onChange={(e) => setPracticalForm((p) => ({ ...p, shortDescription: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[120px]"
                    placeholder="Describe this practical session..."
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => deleteTrainingById(editingTrainingId)}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={saveTrainingEdits}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- EVENT EDIT MODAL --- */}
      <AnimatePresence>
        {editingEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeEditEvent}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center z-10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Edit Event</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 truncate">ID: {editingEventId}</p>
                </div>
                <button onClick={closeEditEvent} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4 sm:p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                    <input
                      value={eventForm.title || ''}
                      onChange={(ev) => updateEventForm({ title: ev.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder="Event title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event Date</label>
                    <input
                      type="date"
                      value={eventForm.eventDate || ''}
                      onChange={(ev) => updateEventForm({ eventDate: ev.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEventEditImageUpload}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {eventForm.imagePreview && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200">
                    <img src={eventForm.imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={eventForm.description || ''}
                    onChange={(ev) => updateEventForm({ description: ev.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[120px]"
                    placeholder="Event details"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => deleteEventById(editingEventId)}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={saveEventEdits}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STAFF EDIT MODAL --- */}
      <AnimatePresence>
        {editingStaffId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeEditStaff}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center z-10">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Edit Staff</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 truncate">ID: {editingStaffId}</p>
                </div>
                <button onClick={closeEditStaff} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4 sm:p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lecturer Name</label>
                    <input
                      value={staffForm.name || ''}
                      onChange={(ev) => setStaffForm((p) => ({ ...p, name: ev.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject / Role</label>
                    <input
                      value={staffForm.subject || ''}
                      onChange={(ev) => setStaffForm((p) => ({ ...p, subject: ev.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload New Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffEditImageUpload}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {staffForm.imagePreview && (
                  <div className="flex items-center gap-4">
                    <img src={staffForm.imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={staffForm.description || ''}
                    onChange={(ev) => setStaffForm((p) => ({ ...p, description: ev.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => deleteStaffById(editingStaffId)}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={saveStaffEdits}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NOTICE EDIT MODAL --- */}
      <AnimatePresence>
        {editingNoticeId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeEditNotice}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">Edit Notice</h3>
                <button onClick={closeEditNotice} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-4 sm:p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                  <input
                    value={noticeForm.title || ''}
                    onChange={(ev) => setNoticeForm((p) => ({ ...p, title: ev.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNoticeEditImageUpload}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {noticeForm.imagePreview && (
                    <img src={noticeForm.imagePreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-100" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={noticeForm.description || ''}
                    onChange={(ev) => setNoticeForm((p) => ({ ...p, description: ev.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => deleteNoticeById(editingNoticeId)}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={saveNoticeEdits}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Dashboard;