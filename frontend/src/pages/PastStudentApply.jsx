import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Mail, BookOpen, Award, CheckCircle2, 
  ChevronRight, ChevronLeft, Send, AlertTriangle, ShieldCheck, 
  Copy, Check, Clock, School, MapPin, Calendar, FileText
} from 'lucide-react';
import apiClient from '../services/apiClient';
import SEO from '../components/SEO';

const O_L_GRADES = [
  { value: 'A', label: 'A – Distinction' },
  { value: 'B', label: 'B – Very Good Pass' },
  { value: 'C', label: 'C – Credit Pass' },
  { value: 'S', label: 'S – Ordinary Pass' },
  { value: 'W', label: 'W – Fail' },
];

const GENDERS = ['Male', 'Female', 'Other'];

export default function PastStudentApply() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // Link & Verification State
  const [linkLoading, setLinkLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [availableDiplomas, setAvailableDiplomas] = useState([]);

  // Multi-step form step state (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedRef, setCopiedRef] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Section A - Personal
    fullName: '',
    certificateName: '',
    dob: '',
    identificationType: 'NIC',
    nicPassportNumber: '',
    gender: '',
    residentialAddress: '',

    // Section B - Contact
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    whatsappSameAsMobile: false,

    // Section C - Education
    schoolAttended: '',
    olYear: '',
    olMathResult: '',
    olEnglishResult: '',

    // Section D - Overall O/L Results
    aCount: 0,
    bCount: 0,
    cCount: 0,
    sCount: 0,
    wCount: 0,

    // Section E - IAAC Registration
    studentId: '',
    diplomaProgramme: '',

    // Section F - Declaration
    declarationAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Calculate total subjects automatically
  const totalSubjects = useMemo(() => {
    const a = parseInt(formData.aCount, 10) || 0;
    const b = parseInt(formData.bCount, 10) || 0;
    const c = parseInt(formData.cCount, 10) || 0;
    const s = parseInt(formData.sCount, 10) || 0;
    const w = parseInt(formData.wCount, 10) || 0;
    return a + b + c + s + w;
  }, [formData.aCount, formData.bCount, formData.cCount, formData.sCount, formData.wCount]);

  // Year options for O/L
  const currentYear = new Date().getFullYear();
  const olYearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Fetch link info and available diploma courses on mount
  useEffect(() => {
    let isMounted = true;

    async function loadLinkData() {
      // If preview mode without valid token, provide dummy preview config
      if (isPreview && (!token || token === 'preview')) {
        if (isMounted) {
          setLinkData({
            linkName: 'Official Past Student Update Form',
            branch: 'IAAC City Campus',
            batch: 'General',
            diplomaProgramme: '',
          });
          setAvailableDiplomas([
            'Diploma in Airline Cabin Crew Training',
            'Diploma in Airport Ground Operations',
            'Diploma in Airline Ticketing & Reservations (GDS)',
            'Diploma in Air Cargo Handling & Operations',
            'Diploma in Aviation Security & Passenger Ground Services',
          ]);
          setLinkLoading(false);
        }
        return;
      }

      try {
        setLinkLoading(true);
        const res = await apiClient.get(`/api/past-students/link/${token}`);
        if (isMounted) {
          setLinkData(res.data.link);
          setAvailableDiplomas(res.data.availableDiplomas || []);
          // If link has predefined diploma, set it
          if (res.data.link?.diplomaProgramme) {
            setFormData((prev) => ({
              ...prev,
              diplomaProgramme: res.data.link.diplomaProgramme,
            }));
          }
          setLinkLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const reason = err?.response?.data?.reason || err?.response?.data?.message || 'Invalid or expired application link.';
          setLinkError(reason);
          setLinkLoading(false);
        }
      }
    }

    loadLinkData();
    return () => {
      isMounted = false;
    };
  }, [token, isPreview]);

  // Synchronize WhatsApp number when checkbox is toggled
  const handleWhatsappSameChange = (e) => {
    const isChecked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      whatsappSameAsMobile: isChecked,
      whatsappNumber: isChecked ? prev.mobileNumber : prev.whatsappNumber,
    }));
    if (errors.whatsappNumber) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.whatsappNumber;
        return next;
      });
    }
  };

  // Generic field update
  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === 'mobileNumber' && prev.whatsappSameAsMobile) {
        updated.whatsappNumber = val;
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Field-level validation
  const validateField = (field) => {
    const newErrors = { ...errors };

    if (field === 'fullName') {
      const trimmed = formData.fullName.trim();
      if (!trimmed || trimmed.length < 3 || trimmed.length > 150) {
        newErrors.fullName = 'Full name must be between 3 and 150 characters.';
      } else if (!/^[A-Za-z\u0D80-\u0DFF\u0B80-\u0BFF\s.'-]+$/.test(trimmed)) {
        newErrors.fullName = 'Please enter a valid name using letters, spaces, or hyphens.';
      } else {
        delete newErrors.fullName;
      }
    }

    if (field === 'certificateName') {
      if (!formData.certificateName.trim()) {
        newErrors.certificateName = 'Certificate name is required.';
      } else {
        delete newErrors.certificateName;
      }
    }

    if (field === 'dob') {
      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required.';
      } else {
        const birthDate = new Date(formData.dob);
        const today = new Date();
        if (isNaN(birthDate.getTime()) || birthDate >= today) {
          newErrors.dob = 'Please select a valid past date of birth.';
        } else {
          const ageDifMs = today.getTime() - birthDate.getTime();
          const age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
          if (age < 14) {
            newErrors.dob = 'Student must be at least 14 years old.';
          } else {
            delete newErrors.dob;
          }
        }
      }
    }

    if (field === 'nicPassportNumber') {
      const clean = formData.nicPassportNumber.trim();
      if (!clean) {
        newErrors.nicPassportNumber = 'Identification number is required.';
      } else if (formData.identificationType === 'NIC') {
        const oldNic = /^\d{9}[vVxX]$/;
        const newNic = /^\d{12}$/;
        if (!oldNic.test(clean) && !newNic.test(clean)) {
          newErrors.nicPassportNumber = 'Invalid NIC. Old: 9 digits + V/X. New: 12 digits.';
        } else {
          delete newErrors.nicPassportNumber;
        }
      } else {
        if (!/^[A-Za-z0-9]{6,15}$/.test(clean)) {
          newErrors.nicPassportNumber = 'Passport must be 6-15 alphanumeric characters.';
        } else {
          delete newErrors.nicPassportNumber;
        }
      }
    }

    if (field === 'gender') {
      if (!formData.gender) newErrors.gender = 'Please select a gender.';
      else delete newErrors.gender;
    }

    if (field === 'residentialAddress') {
      const clean = formData.residentialAddress.trim();
      if (!clean || clean.length < 10 || clean.length > 500) {
        newErrors.residentialAddress = 'Address must be between 10 and 500 characters.';
      } else {
        delete newErrors.residentialAddress;
      }
    }

    if (field === 'email') {
      const clean = formData.email.trim();
      if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        newErrors.email = 'Please provide a valid email address.';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'mobileNumber') {
      const clean = formData.mobileNumber.trim().replace(/[\s\-()]/g, '');
      const isSriLankan = /^(?:0|94|\+94)?7\d{8}$/.test(clean);
      const isInternational = /^\+[1-9]\d{7,14}$/.test(clean);
      if (!isSriLankan && !isInternational) {
        newErrors.mobileNumber = 'Enter a valid mobile (e.g. 0771234567 or +94771234567).';
      } else {
        delete newErrors.mobileNumber;
      }
    }

    if (field === 'whatsappNumber' && !formData.whatsappSameAsMobile) {
      const clean = formData.whatsappNumber.trim().replace(/[\s\-()]/g, '');
      const isSriLankan = /^(?:0|94|\+94)?7\d{8}$/.test(clean);
      const isInternational = /^\+[1-9]\d{7,14}$/.test(clean);
      if (!isSriLankan && !isInternational) {
        newErrors.whatsappNumber = 'Enter a valid WhatsApp number (e.g. 0771234567).';
      } else {
        delete newErrors.whatsappNumber;
      }
    }

    if (field === 'schoolAttended') {
      if (!formData.schoolAttended.trim()) newErrors.schoolAttended = 'School attended is required.';
      else delete newErrors.schoolAttended;
    }

    if (field === 'olYear') {
      if (!formData.olYear) newErrors.olYear = 'O/L Examination Year is required.';
      else delete newErrors.olYear;
    }

    if (field === 'olMathResult') {
      if (!formData.olMathResult) newErrors.olMathResult = 'Mathematics result is required.';
      else delete newErrors.olMathResult;
    }

    if (field === 'olEnglishResult') {
      if (!formData.olEnglishResult) newErrors.olEnglishResult = 'English result is required.';
      else delete newErrors.olEnglishResult;
    }

    if (field === 'studentId') {
      if (!formData.studentId.trim()) newErrors.studentId = 'IAAC Student ID is required.';
      else delete newErrors.studentId;
    }

    if (field === 'diplomaProgramme') {
      if (!formData.diplomaProgramme) newErrors.diplomaProgramme = 'Please select your diploma programme.';
      else delete newErrors.diplomaProgramme;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step Validation before progressing
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      // Section A: Personal
      if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
        newErrors.fullName = 'Full name must be at least 3 characters.';
      }
      if (!formData.certificateName.trim()) {
        newErrors.certificateName = 'Certificate name is required.';
      }
      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required.';
      }
      if (!formData.nicPassportNumber.trim()) {
        newErrors.nicPassportNumber = 'Identification number is required.';
      } else {
        const clean = formData.nicPassportNumber.trim();
        if (formData.identificationType === 'NIC') {
          if (!/^\d{9}[vVxX]$/.test(clean) && !/^\d{12}$/.test(clean)) {
            newErrors.nicPassportNumber = 'Invalid NIC. Format: 9 digits + V/X, or 12 digits.';
          }
        } else if (!/^[A-Za-z0-9]{6,15}$/.test(clean)) {
          newErrors.nicPassportNumber = 'Passport must be 6-15 alphanumeric characters.';
        }
      }
      if (!formData.gender) {
        newErrors.gender = 'Gender is required.';
      }
      if (!formData.residentialAddress.trim() || formData.residentialAddress.trim().length < 10) {
        newErrors.residentialAddress = 'Residential address must be at least 10 characters.';
      }
    }

    if (stepNumber === 2) {
      // Section B: Contact
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Valid email address is required.';
      }
      const mobClean = formData.mobileNumber.trim().replace(/[\s\-()]/g, '');
      const isMobSriLankan = /^(?:0|94|\+94)?7\d{8}$/.test(mobClean);
      const isMobInternational = /^\+[1-9]\d{7,14}$/.test(mobClean);
      if (!isMobSriLankan && !isMobInternational) {
        newErrors.mobileNumber = 'Enter a valid mobile (e.g. 0771234567 or +94771234567).';
      }

      if (!formData.whatsappSameAsMobile) {
        const waClean = formData.whatsappNumber.trim().replace(/[\s\-()]/g, '');
        const isWaSriLankan = /^(?:0|94|\+94)?7\d{8}$/.test(waClean);
        const isWaInternational = /^\+[1-9]\d{7,14}$/.test(waClean);
        if (!isWaSriLankan && !isWaInternational) {
          newErrors.whatsappNumber = 'Enter a valid WhatsApp number.';
        }
      }
    }

    if (stepNumber === 3) {
      // Section C & D: Education & O/L Counts
      if (!formData.schoolAttended.trim()) {
        newErrors.schoolAttended = 'School attended is required.';
      }
      if (!formData.olYear) {
        newErrors.olYear = 'O/L Examination Year is required.';
      }
      if (!formData.olMathResult) {
        newErrors.olMathResult = 'Mathematics grade is required.';
      }
      if (!formData.olEnglishResult) {
        newErrors.olEnglishResult = 'English grade is required.';
      }

      const a = parseInt(formData.aCount, 10) || 0;
      const b = parseInt(formData.bCount, 10) || 0;
      const c = parseInt(formData.cCount, 10) || 0;
      const s = parseInt(formData.sCount, 10) || 0;
      const w = parseInt(formData.wCount, 10) || 0;
      const total = a + b + c + s + w;

      if (total < 1) {
        newErrors.olGradeCounts = 'Please enter your overall O/L grade counts (total cannot be zero).';
      }

      // Consistency validation
      const requiredGrades = { A: 0, B: 0, C: 0, S: 0, W: 0 };
      if (formData.olMathResult) requiredGrades[formData.olMathResult] += 1;
      if (formData.olEnglishResult) requiredGrades[formData.olEnglishResult] += 1;

      if (a < requiredGrades.A) {
        newErrors.olGradeCounts = `You selected ${requiredGrades.A} 'A' grade(s) in Math/English, but your total A count is only ${a}.`;
      } else if (b < requiredGrades.B) {
        newErrors.olGradeCounts = `You selected ${requiredGrades.B} 'B' grade(s) in Math/English, but your total B count is only ${b}.`;
      } else if (c < requiredGrades.C) {
        newErrors.olGradeCounts = `You selected ${requiredGrades.C} 'C' grade(s) in Math/English, but your total C count is only ${c}.`;
      } else if (s < requiredGrades.S) {
        newErrors.olGradeCounts = `You selected ${requiredGrades.S} 'S' grade(s) in Math/English, but your total S count is only ${s}.`;
      } else if (w < requiredGrades.W) {
        newErrors.olGradeCounts = `You selected ${requiredGrades.W} 'W' grade(s) in Math/English, but your total W count is only ${w}.`;
      }
    }

    if (stepNumber === 4) {
      // Section E: IAAC Registration
      if (!formData.studentId.trim()) {
        newErrors.studentId = 'IAAC Student ID is required.';
      }
      if (!formData.diplomaProgramme) {
        newErrors.diplomaProgramme = 'Please select your registered diploma programme.';
      }
    }

    if (stepNumber === 5) {
      // Section F: Declaration
      if (!formData.declarationAccepted) {
        newErrors.declarationAccepted = 'You must confirm and accept the declaration to submit.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Application Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    if (isPreview) {
      alert('Preview Mode: Application submission simulated successfully. (Token: preview)');
      setSubmissionResult({
        applicationRef: 'IAAC-PS-PREVIEW-DEMO',
        studentId: formData.studentId,
        submittedAt: new Date().toISOString(),
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        certificateName: formData.certificateName,
        dob: formData.dob,
        identificationType: formData.identificationType,
        nicPassportNumber: formData.nicPassportNumber,
        gender: formData.gender,
        residentialAddress: formData.residentialAddress,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        whatsappNumber: formData.whatsappNumber,
        whatsappSameAsMobile: formData.whatsappSameAsMobile,
        schoolAttended: formData.schoolAttended,
        olYear: parseInt(formData.olYear, 10),
        olMathResult: formData.olMathResult,
        olEnglishResult: formData.olEnglishResult,
        olGradeCounts: {
          aCount: parseInt(formData.aCount, 10) || 0,
          bCount: parseInt(formData.bCount, 10) || 0,
          cCount: parseInt(formData.cCount, 10) || 0,
          sCount: parseInt(formData.sCount, 10) || 0,
          wCount: parseInt(formData.wCount, 10) || 0,
        },
        studentId: formData.studentId,
        diplomaProgramme: formData.diplomaProgramme,
        declarationAccepted: true,
      };

      const res = await apiClient.post(`/api/past-students/submit/${token}`, payload);
      setSubmissionResult(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit application. Please check your inputs and try again.';
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submissionResult?.applicationRef) {
      navigator.clipboard.writeText(submissionResult.applicationRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // --- RENDER STATES ---

  // 1. Loading State
  if (linkLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Verifying Application Portal...</h2>
        <p className="text-xs text-slate-500 mt-1">International Airline and Aviation College</p>
      </div>
    );
  }

  // 2. Error / Expired Link State
  if (linkError && !isPreview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Application Link Inactive</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{linkError}</p>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <p>If you believe this is an error, please reach out to the college administration:</p>
            <p className="font-semibold text-slate-700">info@iaacasia.com | +94 11 250 8899</p>
          </div>
          <Link
            to="/"
            className="inline-block mt-4 px-6 py-2.5 bg-[#0B1528] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Visit IAAC Homepage
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success Screen
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Submission Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1528] tracking-tight">
              Application Submitted Successfully!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your information has been submitted to the IAAC administration successfully. Thank you for updating your student records.
            </p>
          </div>

          {/* Reference Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Application Reference Number
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg sm:text-xl font-mono font-bold text-[#0B1528] select-all">
                {submissionResult.applicationRef}
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs"
              >
                {copiedRef ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedRef ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Please save this reference number for all future academic and certificate inquiries with IAAC.
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0B1528] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Form Screen (Multi-Step)
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased py-8 sm:py-12 px-4 sm:px-6">
      <SEO
        title="Past Student Information Collection | IAAC"
        description="Official IAAC past student application form for updating academic records and certificate names."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Preview Mode Notification Pill */}
        {isPreview && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
            <span>Admin Preview Mode: Testing Application Layout & Navigation</span>
            <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[10px]">PREVIEW</span>
          </div>
        )}

        {/* Header Branding Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="p-2 bg-slate-900 rounded-2xl shadow-xs border border-slate-800 shrink-0">
              <img src="/logo.png" alt="IAAC Official Logo" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Official Student Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1528] tracking-tight mt-1">
                IAAC – Past Student Information Collection Form
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                International Airline and Aviation College
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            Please complete the following application with accurate information. This form is intended for previously registered IAAC students to update their academic and personal records.
          </p>

          {/* Step Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
              <span>Step {currentStep} of 5: {
                currentStep === 1 ? 'Personal Info' :
                currentStep === 2 ? 'Contact Details' :
                currentStep === 3 ? 'Educational Qualifications' :
                currentStep === 4 ? 'IAAC Registration' : 'Review & Submit'
              }</span>
              <span className="text-blue-600">{Math.round((currentStep / 5) * 100)}% Completed</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form Body Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0B1528] flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    <span>Section A – Personal Information</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide your legal personal information.</p>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange('fullName')}
                    onBlur={handleBlur('fullName')}
                    placeholder="e.g. Kasun Chamara Perera"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.fullName && <p className="text-[11px] text-rose-600 font-medium">{errors.fullName}</p>}
                </div>

                {/* Name to Appear on Certificate */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Name to Appear on Certificate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.certificateName}
                    onChange={handleChange('certificateName')}
                    onBlur={handleBlur('certificateName')}
                    placeholder="e.g. K. C. Perera"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.certificateName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <p className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    ⚠️ <strong>Notice:</strong> Please verify spelling and initials carefully. This name will be printed exactly on your official qualification certificate.
                  </p>
                  {errors.certificateName && <p className="text-[11px] text-rose-600 font-medium">{errors.certificateName}</p>}
                </div>

                {/* DOB & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={handleChange('dob')}
                      onBlur={handleBlur('dob')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                        errors.dob ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {errors.dob && <p className="text-[11px] text-rose-600 font-medium">{errors.dob}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={handleChange('gender')}
                      onBlur={handleBlur('gender')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                        errors.gender ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Select Gender --</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.gender && <p className="text-[11px] text-rose-600 font-medium">{errors.gender}</p>}
                  </div>
                </div>

                {/* ID Type & Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      ID Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.identificationType}
                      onChange={handleChange('identificationType')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
                    >
                      <option value="NIC">Sri Lankan NIC</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {formData.identificationType === 'NIC' ? 'NIC Number (Old or New)' : 'Passport Number'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nicPassportNumber}
                      onChange={handleChange('nicPassportNumber')}
                      onBlur={handleBlur('nicPassportNumber')}
                      placeholder={formData.identificationType === 'NIC' ? 'e.g. 200112345678 or 981234567V' : 'e.g. N1234567'}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition uppercase ${
                        errors.nicPassportNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {errors.nicPassportNumber && <p className="text-[11px] text-rose-600 font-medium">{errors.nicPassportNumber}</p>}
                  </div>
                </div>

                {/* Residential Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.residentialAddress}
                    onChange={handleChange('residentialAddress')}
                    onBlur={handleBlur('residentialAddress')}
                    placeholder="Enter your complete home address..."
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.residentialAddress ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.residentialAddress && <p className="text-[11px] text-rose-600 font-medium">{errors.residentialAddress}</p>}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Contact Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0B1528] flex items-center gap-2">
                    <Phone size={18} className="text-blue-600" />
                    <span>Section B – Contact Information</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide reliable contact numbers for academic correspondence.</p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    onBlur={handleBlur('email')}
                    placeholder="e.g. kasun@example.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={handleChange('mobileNumber')}
                    onBlur={handleBlur('mobileNumber')}
                    placeholder="e.g. 0771234567 or +94771234567"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.mobileNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.mobileNumber && <p className="text-[11px] text-rose-600 font-medium">{errors.mobileNumber}</p>}
                </div>

                {/* WhatsApp Same Checkbox */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="whatsappSame"
                    checked={formData.whatsappSameAsMobile}
                    onChange={handleWhatsappSameChange}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="whatsappSame" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    WhatsApp number is the same as mobile number.
                  </label>
                </div>

                {/* WhatsApp Number */}
                {!formData.whatsappSameAsMobile && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={handleChange('whatsappNumber')}
                      onBlur={handleBlur('whatsappNumber')}
                      placeholder="e.g. 0771234567 or +94771234567"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                        errors.whatsappNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {errors.whatsappNumber && <p className="text-[11px] text-rose-600 font-medium">{errors.whatsappNumber}</p>}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Educational Qualifications & O/L Results */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0B1528] flex items-center gap-2">
                    <School size={18} className="text-blue-600" />
                    <span>Section C & D – Educational Qualifications</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide your school and G.C.E. O/L Examination results.</p>
                </div>

                {/* School Attended */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    School Attended <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.schoolAttended}
                    onChange={handleChange('schoolAttended')}
                    onBlur={handleBlur('schoolAttended')}
                    placeholder="e.g. Ananda College, Colombo"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.schoolAttended ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.schoolAttended && <p className="text-[11px] text-rose-600 font-medium">{errors.schoolAttended}</p>}
                </div>

                {/* O/L Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    G.C.E. O/L Examination Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.olYear}
                    onChange={handleChange('olYear')}
                    onBlur={handleBlur('olYear')}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.olYear ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Select Year --</option>
                    {olYearOptions.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                  {errors.olYear && <p className="text-[11px] text-rose-600 font-medium">{errors.olYear}</p>}
                </div>

                {/* Math & English Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      O/L Mathematics Result <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.olMathResult}
                      onChange={handleChange('olMathResult')}
                      onBlur={handleBlur('olMathResult')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                        errors.olMathResult ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Select Math Grade --</option>
                      {O_L_GRADES.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                    {errors.olMathResult && <p className="text-[11px] text-rose-600 font-medium">{errors.olMathResult}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      O/L English Result <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.olEnglishResult}
                      onChange={handleChange('olEnglishResult')}
                      onBlur={handleBlur('olEnglishResult')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                        errors.olEnglishResult ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      <option value="">-- Select English Grade --</option>
                      {O_L_GRADES.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                    {errors.olEnglishResult && <p className="text-[11px] text-rose-600 font-medium">{errors.olEnglishResult}</p>}
                  </div>
                </div>

                {/* Section D: Overall O/L Results Grade Counts */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Section D – Overall O/L Results Summary
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Enter the total number of subjects achieved under each grade (including Math & English).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: 'A Grades', field: 'aCount' },
                      { label: 'B Grades', field: 'bCount' },
                      { label: 'C Grades', field: 'cCount' },
                      { label: 'S Grades', field: 'sCount' },
                      { label: 'W/F Grades', field: 'wCount' },
                    ].map((item) => (
                      <div key={item.field} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">{item.label}</label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={formData[item.field]}
                          onChange={handleChange(item.field)}
                          className="w-full text-center px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Auto-calculated Total Badge */}
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl text-xs">
                    <span className="font-semibold text-blue-900">Total Calculated Subjects:</span>
                    <span className="font-black text-sm text-blue-700 bg-white px-3 py-0.5 rounded-lg border border-blue-200">
                      {totalSubjects} Subjects
                    </span>
                  </div>

                  {errors.olGradeCounts && (
                    <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {errors.olGradeCounts}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: IAAC Registration Information */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0B1528] flex items-center gap-2">
                    <Award size={18} className="text-blue-600" />
                    <span>Section E – IAAC Registration Information</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide your original IAAC registration and diploma information.</p>
                </div>

                {/* Student ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    IAAC Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={handleChange('studentId')}
                    onBlur={handleBlur('studentId')}
                    placeholder="e.g. IAAC/CC/2023/1042 or Student ID number"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition uppercase ${
                      errors.studentId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400">
                    Enter the student registration ID issued to you by IAAC during your original enrolment.
                  </p>
                  {errors.studentId && <p className="text-[11px] text-rose-600 font-medium">{errors.studentId}</p>}
                </div>

                {/* Registered Diploma Programme */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Registered Diploma Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.diplomaProgramme}
                    onChange={handleChange('diplomaProgramme')}
                    onBlur={handleBlur('diplomaProgramme')}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition ${
                      errors.diplomaProgramme ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Select Diploma Programme --</option>
                    {availableDiplomas.map((prog, idx) => (
                      <option key={idx} value={prog}>{prog}</option>
                    ))}
                  </select>
                  {errors.diplomaProgramme && <p className="text-[11px] text-rose-600 font-medium">{errors.diplomaProgramme}</p>}
                </div>

                {/* Link metadata badge if preset */}
                {linkData?.branch && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Target Academy / Branch:</span>
                    <span className="font-bold text-slate-800">{linkData.branch}</span>
                  </div>
                )}
                {linkData?.batch && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Target Batch / Intake:</span>
                    <span className="font-bold text-slate-800">{linkData.batch}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: Review Screen & Declaration */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0B1528] flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <span>Review Application Details & Confirmation</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Please review all entered details carefully before final submission.
                  </p>
                </div>

                {/* Summary Grid */}
                <div className="space-y-4">
                  {/* Personal Review */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Personal & Identification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div><span className="text-slate-400">Full Name:</span> <span className="font-bold text-slate-800">{formData.fullName}</span></div>
                      <div><span className="text-slate-400">Certificate Name:</span> <span className="font-bold text-blue-700">{formData.certificateName}</span></div>
                      <div><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold text-slate-800">{formData.dob}</span></div>
                      <div><span className="text-slate-400">Gender:</span> <span className="font-semibold text-slate-800">{formData.gender}</span></div>
                      <div><span className="text-slate-400">{formData.identificationType}:</span> <span className="font-mono font-bold text-slate-800">{formData.nicPassportNumber}</span></div>
                      <div className="sm:col-span-2"><span className="text-slate-400">Address:</span> <span className="font-semibold text-slate-800">{formData.residentialAddress}</span></div>
                    </div>
                  </div>

                  {/* Contact Review */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div><span className="text-slate-400">Email:</span> <span className="font-semibold text-slate-800">{formData.email}</span></div>
                      <div><span className="text-slate-400">Mobile:</span> <span className="font-semibold text-slate-800">{formData.mobileNumber}</span></div>
                      <div><span className="text-slate-400">WhatsApp:</span> <span className="font-semibold text-slate-800">{formData.whatsappNumber}</span></div>
                    </div>
                  </div>

                  {/* Education Review */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Educational Qualifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div><span className="text-slate-400">School:</span> <span className="font-semibold text-slate-800">{formData.schoolAttended}</span></div>
                      <div><span className="text-slate-400">O/L Year:</span> <span className="font-semibold text-slate-800">{formData.olYear}</span></div>
                      <div><span className="text-slate-400">Math Grade:</span> <span className="font-bold text-blue-700">{formData.olMathResult}</span></div>
                      <div><span className="text-slate-400">English Grade:</span> <span className="font-bold text-blue-700">{formData.olEnglishResult}</span></div>
                      <div className="sm:col-span-2"><span className="text-slate-400">Overall O/L:</span> <span className="font-semibold text-slate-800">{formData.aCount}A, {formData.bCount}B, {formData.cCount}C, {formData.sCount}S, {formData.wCount}W ({totalSubjects} subjects)</span></div>
                    </div>
                  </div>

                  {/* IAAC Review */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      IAAC Registration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div><span className="text-slate-400">Student ID:</span> <span className="font-mono font-bold text-[#0B1528]">{formData.studentId}</span></div>
                      <div className="sm:col-span-2"><span className="text-slate-400">Programme:</span> <span className="font-bold text-blue-700">{formData.diplomaProgramme}</span></div>
                    </div>
                  </div>
                </div>

                {/* Section F: Declaration */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="declarationCheckbox"
                      checked={formData.declarationAccepted}
                      onChange={handleChange('declarationAccepted')}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded-md border-amber-300 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <label htmlFor="declarationCheckbox" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                      <strong>Section F – Student Declaration:</strong><br />
                      “I hereby confirm that all the information provided in this application is true and accurate to the best of my knowledge. I authorize IAAC to use this information for administrative and academic record-keeping purposes.”
                    </label>
                  </div>
                  {errors.declarationAccepted && (
                    <p className="text-[11px] text-rose-600 font-semibold pl-7">{errors.declarationAccepted}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Navigation Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <ChevronLeft size={16} />
                <span>Back and Edit</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !formData.declarationAccepted}
                className="flex items-center gap-2 px-7 py-3 text-xs font-bold text-white bg-[#0B1528] hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} International Airline & Aviation College (IAAC). All Rights Reserved.</p>
          <p>Official Institutional Record Collection Portal.</p>
        </div>
      </div>
    </div>
  );
}
