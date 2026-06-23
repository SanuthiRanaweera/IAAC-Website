import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient.js';
import { 
  User, MapPin, Phone, Mail, BookOpen, CheckCircle2, 
  ChevronRight, ChevronLeft, Send, GraduationCap, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

function ApplyNow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' });
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!status.success) return;
    const t = setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [status.success, navigate]);

  // --- FORM STATE ---
  const [form, setForm] = useState({
    // Step 1: Personal
    title: 'Mr',
    fullName: '',
    nic: '',
    dob: '',
    gender: '',
    address: '',
    mobile: '',
    whatsapp: '',
    email: '',
    
    // Step 2: Education & Parent
    school: '',
    olYear: '',
    olResults: { math: '', english: '', science: '', history: '', religion: '', language: '' },
    parentName: '',
    parentPhone: '',

    // Step 3: Course & Terms
    course: '',
    academy: '',
    referral: '',
    agreed: false
  });

  const [errors, setErrors] = useState({});

  // Track which fields the user has interacted with (for real-time validation on blur)
  const [touched, setTouched] = useState({});

  const update = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };
  const updateNested = (category, field) => (e) => {
    setForm((prev) => ({ ...prev, [category]: { ...prev[category], [field]: e.target.value } }));
    const key = `${category}.${field}`;
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  // Mark a field as touched on blur and run single-field validation
  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err; else delete next[field];
      return next;
    });
  };

  // --- HELPER VALIDATORS ---
  const isValidSriLankanNIC = (val) => {
    const v = val.trim();
    // Old NIC: 9 digits + V/X (case-insensitive)
    if (/^\d{9}[vVxX]$/.test(v)) return true;
    // New NIC: exactly 12 digits
    if (/^\d{12}$/.test(v)) return true;
    // Passport format: 1-2 letters followed by 5-9 digits
    if (/^[A-Za-z]{1,2}\d{5,9}$/.test(v)) return true;
    return false;
  };

  const isValidPhoneNumber = (val) => {
    const v = val.trim().replace(/[\s\-]/g, '');
    // Sri Lankan mobile: 07X followed by 7 digits (total 10)
    if (/^07\d{8}$/.test(v)) return true;
    // With country code: +947X... or 00947X...
    if (/^(\+94|0094)7\d{8}$/.test(v)) return true;
    // Landline: 0X1... (area code)
    if (/^0\d{9}$/.test(v)) return true;
    // International with +
    if (/^\+\d{7,15}$/.test(v)) return true;
    return false;
  };

  const isValidEmail = (val) => {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  const getAge = (dobStr) => {
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const hasOnlyLettersAndSpaces = (val) => /^[A-Za-z\s.'-]+$/.test(val.trim());

  // --- SINGLE-FIELD VALIDATION ---
  const validateField = (field, f) => {
    switch (field) {
      case 'fullName':
        if (!f.fullName.trim()) return 'Full name is required';
        if (f.fullName.trim().length < 3) return 'Name must be at least 3 characters';
        if (!hasOnlyLettersAndSpaces(f.fullName)) return 'Name should contain only letters and spaces';
        if (f.fullName.trim().split(/\s+/).length < 2) return 'Please enter your first and last name';
        return null;
      case 'nic':
        if (!f.nic.trim()) return 'NIC / Passport number is required';
        if (!isValidSriLankanNIC(f.nic)) return 'Enter a valid NIC (e.g. 200012345678 or 912345678V) or passport number';
        return null;
      case 'dob':
        if (!f.dob) return 'Date of birth is required';
        { const age = getAge(f.dob);
          if (age < 15) return 'You must be at least 15 years old to apply';
          if (age > 60) return 'Please check your date of birth';
          if (new Date(f.dob) > new Date()) return 'Date of birth cannot be in the future';
        }
        return null;
      case 'gender':
        if (!f.gender) return 'Please select your gender';
        return null;
      case 'mobile':
        if (!f.mobile.trim()) return 'Mobile number is required';
        if (!isValidPhoneNumber(f.mobile)) return 'Enter a valid mobile number (e.g. 077 123 4567)';
        return null;
      case 'whatsapp':
        if (f.whatsapp.trim() && !isValidPhoneNumber(f.whatsapp)) return 'Enter a valid WhatsApp number (e.g. 077 123 4567)';
        return null;
      case 'email':
        if (!f.email.trim()) return 'Email address is required';
        if (!isValidEmail(f.email)) return 'Enter a valid email address (e.g. name@example.com)';
        return null;
      case 'address':
        if (!f.address.trim()) return 'Home address is required';
        if (f.address.trim().length < 10) return 'Please enter a complete address (at least 10 characters)';
        return null;
      case 'school':
        if (!f.school.trim()) return 'School name is required';
        if (f.school.trim().length < 3) return 'School name must be at least 3 characters';
        return null;
      case 'olYear': {
        if (!f.olYear.trim()) return 'O/L year is required';
        if (!/^\d{4}$/.test(f.olYear.trim())) return 'Enter a valid 4-digit year (e.g. 2023)';
        const year = parseInt(f.olYear.trim(), 10);
        const currentYear = new Date().getFullYear();
        if (year > currentYear) return 'O/L year cannot be in the future';
        if (year < 1970) return 'Please enter a valid O/L year';
        return null;
      }
      case 'parentName':
        if (!f.parentName.trim()) return 'Guardian name is required';
        if (f.parentName.trim().length < 3) return 'Guardian name must be at least 3 characters';
        if (!hasOnlyLettersAndSpaces(f.parentName)) return 'Guardian name should contain only letters and spaces';
        return null;
      case 'parentPhone':
        if (!f.parentPhone.trim()) return 'Guardian contact number is required';
        if (!isValidPhoneNumber(f.parentPhone)) return 'Enter a valid phone number (e.g. 077 123 4567)';
        return null;
      case 'academy':
        if (!f.academy) return 'Please select an academy / campus';
        return null;
      case 'course':
        if (!f.course) return 'Please select a course';
        return null;
      case 'agreed':
        if (!f.agreed) return 'You must agree to the declaration';
        return null;
      default:
        return null;
    }
  };

  // --- STEP-LEVEL VALIDATION ---
  const validateStep1 = () => {
    const fields = ['fullName', 'nic', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'address'];
    const e = {};
    fields.forEach((f) => {
      const err = validateField(f, form);
      if (err) e[f] = err;
    });
    return e;
  };

  const validateStep2 = () => {
    const fields = ['school', 'olYear', 'parentName', 'parentPhone'];
    const e = {};
    fields.forEach((f) => {
      const err = validateField(f, form);
      if (err) e[f] = err;
    });
    // Check that at least 3 O/L results are filled
    const filledSubjects = Object.values(form.olResults).filter((v) => v && v.trim() !== '').length;
    if (filledSubjects < 3) {
      e.olResults = 'Please fill at least 3 O/L subject results';
    }
    return e;
  };

  const validateStep3 = () => {
    const fields = ['academy', 'course', 'agreed'];
    const e = {};
    fields.forEach((f) => {
      const err = validateField(f, form);
      if (err) e[f] = err;
    });
    return e;
  };

  const nextStep = () => {
    const stepErrors = currentStep === 1 ? validateStep1() : currentStep === 2 ? validateStep2() : {};
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };
  const prevStep = () => { setErrors({}); setCurrentStep((prev) => Math.max(prev - 1, 1)); };

  const submit = async () => {
    // Prevent duplicate submissions from rapid clicks
    if (submittingRef.current) return;

    const stepErrors = validateStep3();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStatus({ submitting: false, success: false, error: 'Please fix the highlighted errors.' });
      return;
    }
    setErrors({});
    submittingRef.current = true;
    setStatus({ submitting: true, success: false, error: '' });
    try {
      const fullName = (form.fullName || '').trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || '-';
      const lastName = parts.slice(1).join(' ') || '-';

      const payload = {
        // Personal
        title: form.title,
        fullName: form.fullName,
        firstName,
        lastName,
        dob: form.dob || undefined,
        nic: form.nic || undefined,
        gender: form.gender || undefined,
        email: form.email,
        phone: form.mobile,
        whatsapp: form.whatsapp || undefined,
        address: form.address || undefined,

        // Education & Guardian
        school: form.school || undefined,
        olYear: form.olYear || undefined,
        olResults: form.olResults || undefined,
        parentName: form.parentName || undefined,
        parentPhone: form.parentPhone || undefined,

        // Program
        program: form.course,
        academy: form.academy,
        referral: form.referral || undefined,
      };

      await apiClient.post('/api/applications', payload);
      setStatus({ submitting: false, success: true, error: '' });
    } catch (err) {
      submittingRef.current = false;
      const serverMessage = err?.response?.data?.message;
      const networkMessage = err?.message;
      setStatus({ submitting: false, success: false, error: serverMessage || networkMessage || 'Failed to submit application' });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <SEO
        title="Apply Now"
        description="Apply to IAAC - International Airline and Aviation College. Start your aviation career today. Submit your application for airline and aviation training programs."
        path="/apply-now"
        keywords="apply aviation college, aviation course application, enroll airline training, IAAC admission"
      />
      
      {/* --- HERO HEADER --- */}
      <section className="bg-[#0f172a] pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Student Application
          </h1>
          <p className="text-slate-400 text-lg">
            Start your journey with IAAC. Please fill in the details below.
          </p>
        </div>
      </section>

      {/* --- MAIN FORM CONTAINER --- */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* PROGRESS BAR */}
          <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative">
              {/* Line Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-0 rounded-full"></div>
              
              {/* Line Fill */}
              <motion.div 
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-0 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                transition={{ duration: 0.5 }}
              />

              {/* Step 1 Bubble */}
              <StepBubble step={1} current={currentStep} label="Personal" icon={User} />
              {/* Step 2 Bubble */}
              <StepBubble step={2} current={currentStep} label="Education" icon={GraduationCap} />
              {/* Step 3 Bubble */}
              <StepBubble step={3} current={currentStep} label="Finish" icon={CheckCircle2} />
            </div>
          </div>

          {/* FORM CONTENT AREA */}
          <div className="p-6 md:p-10 min-h-[400px]">
            <AnimatePresence mode='wait'>
              
              {/* --- STEP 1: PERSONAL INFO --- */}
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-3xl mx-auto"
                >
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Personal Information</h3>
                  
                  <div className="grid md:grid-cols-4 gap-5">
                    <div className="md:col-span-1">
                      <Label text="Title" />
                      <select value={form.title} onChange={update('title')} className="input-field">
                        <option>Mr</option><option>Ms</option><option>Mrs</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <Label text="Full Name" required />
                      <input type="text" placeholder="Your Full Name" value={form.fullName} onChange={update('fullName')} onBlur={handleBlur('fullName')} className={`input-field ${errors.fullName ? 'input-error' : ''}`} />
                      {errors.fullName && <FieldError msg={errors.fullName} />}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <Label text="NIC / Passport" required />
                      <input type="text" placeholder="e.g. 200012345678 or 912345678V" value={form.nic} onChange={update('nic')} onBlur={handleBlur('nic')} className={`input-field ${errors.nic ? 'input-error' : ''}`} />
                      {errors.nic && <FieldError msg={errors.nic} />}
                    </div>
                    <div>
                      <Label text="Date of Birth" required />
                      <input type="date" value={form.dob} onChange={update('dob')} onBlur={handleBlur('dob')} className={`input-field ${errors.dob ? 'input-error' : ''}`} />
                      {errors.dob && <FieldError msg={errors.dob} />}
                    </div>
                    <div>
                      <Label text="Gender" required />
                      <select value={form.gender} onChange={update('gender')} onBlur={handleBlur('gender')} className={`input-field ${errors.gender ? 'input-error' : ''}`}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <FieldError msg={errors.gender} />}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label text="Mobile Number" required />
                      <input type="tel" placeholder="077 123 4567" value={form.mobile} onChange={update('mobile')} onBlur={handleBlur('mobile')} className={`input-field ${errors.mobile ? 'input-error' : ''}`} />
                      {errors.mobile && <FieldError msg={errors.mobile} />}
                    </div>
                    <div>
                      <Label text="Email Address" required />
                      <input type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} onBlur={handleBlur('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} />
                      {errors.email && <FieldError msg={errors.email} />}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label text="WhatsApp Number" />
                      <input type="tel" placeholder="077 123 4567" value={form.whatsapp} onChange={update('whatsapp')} onBlur={handleBlur('whatsapp')} className={`input-field ${errors.whatsapp ? 'input-error' : ''}`} />
                      {errors.whatsapp && <FieldError msg={errors.whatsapp} />}
                    </div>
                    <div />
                  </div>

                  <div>
                    <Label text="Home Address" required />
                    <textarea rows="2" placeholder="Your permanent address" value={form.address} onChange={update('address')} onBlur={handleBlur('address')} className={`input-field ${errors.address ? 'input-error' : ''}`}></textarea>
                    {errors.address && <FieldError msg={errors.address} />}
                  </div>
                </motion.div>
              )}

              {/* --- STEP 2: EDUCATION & PARENT --- */}
              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 max-w-3xl mx-auto"
                >
                  {/* Education Section */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <GraduationCap className="text-blue-600" size={24}/> Educational Background
                    </h3>
                    <div className="grid md:grid-cols-3 gap-5 mb-5">
                      <div className="md:col-span-2">
                        <Label text="School Attended" required />
                        <input type="text" placeholder="School Name" value={form.school} onChange={update('school')} onBlur={handleBlur('school')} className={`input-field ${errors.school ? 'input-error' : ''}`} />
                        {errors.school && <FieldError msg={errors.school} />}
                      </div>
                      <div>
                        <Label text="O/L Year" required />
                        <input type="text" placeholder="2023" value={form.olYear} onChange={update('olYear')} onBlur={handleBlur('olYear')} className={`input-field ${errors.olYear ? 'input-error' : ''}`} />
                        {errors.olYear && <FieldError msg={errors.olYear} />}
                      </div>
                    </div>

                    {/* O/L Grid */}
                    <div className={`bg-slate-50 p-5 rounded-2xl border ${errors.olResults ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">G.C.E O/L Results</p>
                      <p className="text-[11px] text-slate-400 mb-4">Please fill at least 3 subjects</p>
                      {errors.olResults && <FieldError msg={errors.olResults} />}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                        <ResultSelect subject="Mathematics" value={form.olResults.math} onChange={updateNested('olResults', 'math')} />
                        <ResultSelect subject="English" value={form.olResults.english} onChange={updateNested('olResults', 'english')} />
                        <ResultSelect subject="Science" value={form.olResults.science} onChange={updateNested('olResults', 'science')} />
                        <ResultSelect subject="History" value={form.olResults.history} onChange={updateNested('olResults', 'history')} />
                        <ResultSelect subject="Religion" value={form.olResults.religion} onChange={updateNested('olResults', 'religion')} />
                        <ResultSelect subject="Language" value={form.olResults.language} onChange={updateNested('olResults', 'language')} />
                      </div>
                    </div>
                  </div>

                  {/* Parent Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <User className="text-blue-600" size={24}/> Parent / Guardian
                    </h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <Label text="Guardian Name" required />
                        <input type="text" placeholder="Parent's Name" value={form.parentName} onChange={update('parentName')} onBlur={handleBlur('parentName')} className={`input-field ${errors.parentName ? 'input-error' : ''}`} />
                        {errors.parentName && <FieldError msg={errors.parentName} />}
                      </div>
                      <div>
                        <Label text="Contact Number" required />
                        <input type="tel" placeholder="Parent's Mobile" value={form.parentPhone} onChange={update('parentPhone')} onBlur={handleBlur('parentPhone')} className={`input-field ${errors.parentPhone ? 'input-error' : ''}`} />
                        {errors.parentPhone && <FieldError msg={errors.parentPhone} />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 3: COURSE & FINISH --- */}
              {currentStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 max-w-3xl mx-auto"
                >
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Select Your Course</h3>

                    <div className="mb-6">
                      <Label text="Select Academy / Campus" required />
                      <select value={form.academy} onChange={update('academy')} className={`input-field ${errors.academy ? 'input-error' : ''}`}>
                        <option value="">Select</option>
                        <option value="IAAC City Academy">IAAC City Academy - Colombo 10</option>
                        <option value="IAAC Airport Academy">IAAC Airport Academy - Rathmalana Airport</option>
                        <option value="IAAC Central Academy">IAAC Central Academy - Kurunegala</option>
                      </select>
                      {errors.academy && <FieldError msg={errors.academy} />}
                    </div>

                    {errors.course && <div className="mb-2"><FieldError msg={errors.course} /></div>}
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        'Diploma in Airline Cabin Crew',
                        'Diploma in Airport Ground Ops',
                        'Diploma in Ticketing & Reservations',
                        'Diploma in Air Cargo & Logistics',
                      ].map((c) => (
                        <CourseCard 
                          key={c} 
                          label={c} 
                          selected={form.course === c} 
                          onClick={() => setForm({...form, course: c})} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <Label text="Student Counselor Code (Optional)" />
                    <select value={form.referral} onChange={update('referral')} className="input-field">
                      <option value="">General Office (No counselor)</option>
                      <option value="C001">Rochini</option>
                      <option value="C002">Dimath</option>
                      <option value="C003">Abhishek</option>
                      <option value="C004">Jiwaka</option>
                      <option value="C005">Michelle</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      If a counselor guided you, select their name. Otherwise keep “General Office”.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={form.agreed} onChange={(e) => { setForm({...form, agreed: e.target.checked}); if (errors.agreed) setErrors((prev) => { const next = { ...prev }; delete next.agreed; return next; }); }} className="peer sr-only" />
                        <div className="w-6 h-6 border-2 border-slate-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                        <CheckCircle2 size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 left-1 top-1 transition-all" />
                      </div>
                      <div className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                        <span className="font-bold block mb-1">Declaration</span>
                        I certify that the information provided is true and correct.
                      </div>
                    </label>
                    {errors.agreed && <FieldError msg={errors.agreed} />}
                  </div>

                  {status.success && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-bold border border-green-200">
                      🎉 Application Submitted Successfully! We will contact you soon.
                    </motion.div>
                  )}
                  {status.error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center text-sm border border-red-200">
                      {status.error}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            {currentStep > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-2">
                <ChevronLeft size={20} /> Back
              </button>
            ) : (
              <div></div> // Spacer
            )}

            {currentStep < 3 ? (
              <button onClick={nextStep} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2">
                Continue <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={submit} 
                disabled={status.submitting || status.success}
                className={`px-10 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
                  ${status.success ? 'bg-green-600 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30'}
                  ${status.submitting ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {status.submitting ? 'Sending...' : status.success ? 'Sent' : 'Submit Application'} 
                {!status.success && <Send size={20} />}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function Label({ text, required }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }) {
  return <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{msg}</p>;
}

function StepBubble({ step, current, label, icon: Icon }) {
  const active = step === current;
  const completed = step < current;
  
  return (
    <div className="relative z-10 flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
        ${active ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 
          completed ? 'bg-blue-600 border-blue-600 text-white' : 
          'bg-white border-slate-200 text-slate-300'}
      `}>
        {completed ? <CheckCircle2 size={20} /> : <Icon size={18} />}
      </div>
      <span className={`text-xs font-bold transition-colors duration-300 ${active || completed ? 'text-slate-800' : 'text-slate-300'}`}>
        {label}
      </span>
    </div>
  );
}

function ResultSelect({ subject, value, onChange }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{subject}</label>
      <select 
        value={value} 
        onChange={onChange} 
        className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
      >
        <option value="">Grade</option>
        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="S">S</option><option value="W">W</option>
      </select>
    </div>
  );
}

function CourseCard({ label, selected, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden
      ${selected ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-200'}`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-blue-600' : 'border-slate-300'}`}>
        {selected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
      </div>
      <span className={`font-bold text-sm ${selected ? 'text-blue-800' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}

// Global CSS via style tag for inputs (keeps JSX clean)
const styles = `
  .input-field {
    width: 100%;
    padding: 12px 16px;
    background-color: #f8fafc; /* slate-50 */
    border: 1px solid #e2e8f0; /* slate-200 */
    border-radius: 12px;
    color: #1e293b; /* slate-800 */
    font-weight: 500;
    transition: all 0.2s;
    outline: none;
  }
  .input-field:focus {
    border-color: #3b82f6; /* blue-500 */
    background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  .input-field.input-error {
    border-color: #ef4444; /* red-500 */
    background-color: #fef2f2;
  }
  .input-field.input-error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
`;

export default function ApplyNowWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <ApplyNow />
    </>
  );
}