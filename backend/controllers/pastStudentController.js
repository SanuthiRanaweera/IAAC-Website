const crypto = require('crypto');
const PastStudentApplication = require('../models/PastStudentApplication');
const PastStudentApplicationLink = require('../models/PastStudentApplicationLink');
const PastStudentApplicationAuditLog = require('../models/PastStudentApplicationAuditLog');
const Course = require('../models/Course');

// --- HELPER VALIDATORS ---

// Normalize Sri Lankan phone numbers to international +94 format; or validate international format
function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().replace(/[\s\-()]/g, '');

  // Sri Lankan local format: 07XXXXXXXX (10 digits starting with 0)
  if (/^0\d{9}$/.test(cleaned)) {
    return `+94${cleaned.slice(1)}`;
  }
  // Sri Lankan 947XXXXXXXX (11 digits starting with 94)
  if (/^94\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  // Sri Lankan +947XXXXXXXX
  if (/^\+94\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  // General E.164 international format (+ followed by 7-15 digits)
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

// Sri Lankan NIC or International Passport validation
function validateNICorPassport(type, value) {
  if (!value) return false;
  const clean = String(value).trim();

  if (type === 'NIC') {
    // Old NIC: 9 digits followed by V or X
    const oldNic = /^\d{9}[vVxX]$/;
    // New NIC: 12 digits
    const newNic = /^\d{12}$/;
    return oldNic.test(clean) || newNic.test(clean);
  }

  if (type === 'Passport') {
    // Alphanumeric passport: 6-15 characters, no spaces or special symbols
    const passportRegex = /^[A-Za-z0-9]{6,15}$/;
    return passportRegex.test(clean);
  }

  return false;
}

// Name validation: 3-150 characters, letters, spaces, initials, periods, apostrophes, hyphens, Sinhala & Tamil Unicode
function validateStudentName(name) {
  if (!name) return false;
  const trimmed = String(name).trim();
  if (trimmed.length < 3 || trimmed.length > 150) return false;
  // English, Sinhala (\u0D80-\u0DFF), Tamil (\u0B80-\u0BFF), spaces, dots, apostrophes, hyphens
  const nameRegex = /^[A-Za-z\u0D80-\u0DFF\u0B80-\u0BFF\s.'-]+$/;
  return nameRegex.test(trimmed);
}

// Email RFC-compliant regex
function validateEmail(email) {
  if (!email) return false;
  const trimmed = String(email).trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

// Address validation: 10-500 characters, no whitespace-only, Unicode support
function validateAddress(address) {
  if (!address) return false;
  const trimmed = String(address).trim();
  return trimmed.length >= 10 && trimmed.length <= 500;
}

// Generate unique, institutional application reference: IAAC-PS-YYYYMMDD-XXXX
function generateApplicationRef() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `IAAC-PS-${year}${month}${day}-${randomChars}`;
}

// --- PUBLIC APIS ---

// 1. Validate application link and get configuration
exports.getLinkByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const link = await PastStudentApplicationLink.findOne({ token }).lean();
    if (!link) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid application link. The requested link does not exist.',
      });
    }

    // Check if link is deactivated
    if (!link.isActive) {
      return res.status(403).json({
        valid: false,
        expired: true,
        reason: 'This application link has been deactivated by the administration.',
        linkName: link.linkName,
      });
    }

    // Check if link has expired
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).json({
        valid: false,
        expired: true,
        reason: 'This application link has expired and is no longer accepting submissions.',
        linkName: link.linkName,
        expiredAt: link.expiresAt,
      });
    }

    // Fetch available dynamic diploma programmes from DB
    const courses = await Course.find({}, 'title courseType duration').sort({ title: 1 }).lean();
    const diplomaOptions = courses.map((c) => ({
      id: c._id,
      title: c.title,
      type: c.courseType,
      duration: c.duration,
    }));

    // If no courses found in DB, provide comprehensive fallback list of IAAC programmes
    const defaultDiplomas = [
      'Diploma in Airline Cabin Crew Training',
      'Diploma in Airport Ground Operations',
      'Diploma in Airline Ticketing & Reservations (GDS)',
      'Diploma in Air Cargo Handling & Operations',
      'Diploma in Aviation Security & Passenger Ground Services',
      'Diploma in Flight Dispatch & Operations Control',
      'Certificate in Aviation Hospitality Management',
    ];

    return res.status(200).json({
      valid: true,
      link: {
        id: link._id,
        linkName: link.linkName,
        branch: link.branch || '',
        diplomaProgramme: link.diplomaProgramme || '',
        diplomaId: link.diplomaId || null,
        batch: link.batch || '',
        expiresAt: link.expiresAt || null,
      },
      availableDiplomas: diplomaOptions.length > 0 ? diplomaOptions.map((d) => d.title) : defaultDiplomas,
      availableDiplomaObjects: diplomaOptions,
    });
  } catch (err) {
    console.error('getLinkByToken error:', err);
    return res.status(500).json({ message: 'Error retrieving application link' });
  }
};

// 2. Fetch available diplomas list
exports.getAvailableDiplomas = async (req, res) => {
  try {
    const courses = await Course.find({}, 'title courseType duration').sort({ title: 1 }).lean();
    return res.status(200).json({ items: courses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve diplomas' });
  }
};

// 3. Submit Public Past Student Application
exports.submitApplication = async (req, res) => {
  try {
    const { token } = req.params;
    const body = req.body || {};

    // Verify application link
    const link = await PastStudentApplicationLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ message: 'Application link not found or invalid' });
    }

    if (!link.isActive) {
      return res.status(403).json({ message: 'This application link has been deactivated' });
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).json({ message: 'This application link has expired' });
    }

    // --- FORM VALIDATION ---
    const errors = {};

    // Full Name
    if (!validateStudentName(body.fullName)) {
      errors.fullName = 'Full name must be between 3 and 150 characters and contain valid letters.';
    }

    // Certificate Name
    if (!body.certificateName || String(body.certificateName).trim().length < 2) {
      errors.certificateName = 'Please enter the exact name to appear on your certificate.';
    }

    // Date of Birth
    if (!body.dob) {
      errors.dob = 'Date of birth is required.';
    } else {
      const birthDate = new Date(body.dob);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate >= today) {
        errors.dob = 'Please provide a valid past date of birth.';
      } else {
        // Age check: student must be at least 14 years old
        const ageDifMs = today.getTime() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 14) {
          errors.dob = 'Student must be at least 14 years old.';
        }
      }
    }

    // Identification Type & Number
    const idType = body.identificationType === 'Passport' ? 'Passport' : 'NIC';
    let idNumber = String(body.nicPassportNumber || '').trim();
    if (idType === 'NIC') {
      idNumber = idNumber.toUpperCase();
    }
    if (!validateNICorPassport(idType, idNumber)) {
      errors.nicPassportNumber =
        idType === 'NIC'
          ? 'Invalid Sri Lankan NIC. Old format: 9 digits followed by V/X. New format: 12 digits.'
          : 'Invalid Passport number. Must be 6-15 alphanumeric characters.';
    }

    // Gender
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(body.gender)) {
      errors.gender = 'Please select a valid gender option.';
    }

    // Residential Address
    if (!validateAddress(body.residentialAddress)) {
      errors.residentialAddress = 'Residential address must be between 10 and 500 characters.';
    }

    // Email Address
    if (!validateEmail(body.email)) {
      errors.email = 'Please provide a valid email address.';
    }

    // Mobile Number
    const normMobile = normalizePhoneNumber(body.mobileNumber);
    if (!normMobile) {
      errors.mobileNumber = 'Please provide a valid mobile number (e.g. 0771234567 or +94771234567).';
    }

    // WhatsApp Number
    let normWhatsApp = null;
    if (body.whatsappSameAsMobile) {
      normWhatsApp = normMobile;
    } else {
      normWhatsApp = normalizePhoneNumber(body.whatsappNumber);
      if (!normWhatsApp) {
        errors.whatsappNumber = 'Please provide a valid WhatsApp number (e.g. 0771234567 or +94771234567).';
      }
    }

    // School Attended
    if (!body.schoolAttended || String(body.schoolAttended).trim().length < 2) {
      errors.schoolAttended = 'Please specify the school attended.';
    }

    // O/L Exam Year
    const currentYear = new Date().getFullYear();
    const olYearNum = parseInt(body.olYear, 10);
    if (isNaN(olYearNum) || olYearNum < 1970 || olYearNum > currentYear) {
      errors.olYear = `O/L Examination Year must be a valid year between 1970 and ${currentYear}.`;
    }

    // Math & English Results
    const validGrades = ['A', 'B', 'C', 'S', 'W'];
    if (!validGrades.includes(body.olMathResult)) {
      errors.olMathResult = 'Please select a valid O/L Mathematics grade.';
    }
    if (!validGrades.includes(body.olEnglishResult)) {
      errors.olEnglishResult = 'Please select a valid O/L English grade.';
    }

    // Overall Grade Counts
    const aCount = parseInt(body.olGradeCounts?.aCount, 10) || 0;
    const bCount = parseInt(body.olGradeCounts?.bCount, 10) || 0;
    const cCount = parseInt(body.olGradeCounts?.cCount, 10) || 0;
    const sCount = parseInt(body.olGradeCounts?.sCount, 10) || 0;
    const wCount = parseInt(body.olGradeCounts?.wCount, 10) || 0;

    if (aCount < 0 || bCount < 0 || cCount < 0 || sCount < 0 || wCount < 0) {
      errors.olGradeCounts = 'Grade counts cannot be negative numbers.';
    }

    const calculatedTotalSubjects = aCount + bCount + cCount + sCount + wCount;
    if (calculatedTotalSubjects < 1 || calculatedTotalSubjects > 15) {
      errors.olGradeCounts = 'Total O/L subjects must be between 1 and 15.';
    }

    // Consistency Check: Ensure Math and English grades are accounted for in the overall counts
    const requiredGradeCounts = { A: 0, B: 0, C: 0, S: 0, W: 0 };
    if (body.olMathResult) requiredGradeCounts[body.olMathResult] += 1;
    if (body.olEnglishResult) requiredGradeCounts[body.olEnglishResult] += 1;

    if (aCount < requiredGradeCounts.A) {
      errors.olGradeCounts = `You selected ${requiredGradeCounts.A} 'A' grade(s) in Math/English, but your total A count is only ${aCount}.`;
    } else if (bCount < requiredGradeCounts.B) {
      errors.olGradeCounts = `You selected ${requiredGradeCounts.B} 'B' grade(s) in Math/English, but your total B count is only ${bCount}.`;
    } else if (cCount < requiredGradeCounts.C) {
      errors.olGradeCounts = `You selected ${requiredGradeCounts.C} 'C' grade(s) in Math/English, but your total C count is only ${cCount}.`;
    } else if (sCount < requiredGradeCounts.S) {
      errors.olGradeCounts = `You selected ${requiredGradeCounts.S} 'S' grade(s) in Math/English, but your total S count is only ${sCount}.`;
    } else if (wCount < requiredGradeCounts.W) {
      errors.olGradeCounts = `You selected ${requiredGradeCounts.W} 'W' grade(s) in Math/English, but your total W count is only ${wCount}.`;
    }

    // Student ID
    const studentIdClean = String(body.studentId || '').trim();
    if (!studentIdClean || studentIdClean.length < 2 || studentIdClean.length > 50) {
      errors.studentId = 'Please enter your valid IAAC Student ID.';
    }

    // Duplicate Check: Check if this student ID has already submitted a past student application
    const existingSubmission = await PastStudentApplication.findOne({
      studentId: new RegExp(`^${studentIdClean}$`, 'i'),
    }).lean();

    if (existingSubmission) {
      return res.status(409).json({
        message: `An application has already been submitted for Student ID ${studentIdClean}. (Ref: ${existingSubmission.applicationRef}). Duplicate submissions are not allowed. If you need to make changes, please contact the IAAC administration.`,
        applicationRef: existingSubmission.applicationRef,
      });
    }

    // Registered Diploma Programme
    const diplomaProg = String(body.diplomaProgramme || link.diplomaProgramme || '').trim();
    if (!diplomaProg) {
      errors.diplomaProgramme = 'Please select your registered diploma programme.';
    }

    // Declaration Checkbox
    if (!body.declarationAccepted) {
      errors.declarationAccepted = 'You must confirm and accept the declaration before submitting.';
    }

    // If validation fails, return structured errors
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: 'Validation failed. Please correct the highlighted errors.',
        errors,
      });
    }

    // Create unique Application Reference
    let applicationRef = generateApplicationRef();
    // Safety loop to ensure uniqueness
    let exists = await PastStudentApplication.exists({ applicationRef });
    while (exists) {
      applicationRef = generateApplicationRef();
      exists = await PastStudentApplication.exists({ applicationRef });
    }

    // Create Application Document
    const newApp = new PastStudentApplication({
      applicationRef,
      studentId: studentIdClean,
      fullName: String(body.fullName).trim(),
      certificateName: String(body.certificateName).trim(),
      dob: new Date(body.dob),
      identificationType: idType,
      nicPassportNumber: idNumber,
      gender: body.gender,
      residentialAddress: String(body.residentialAddress).trim(),
      email: String(body.email).trim().toLowerCase(),
      mobileNumber: normMobile,
      whatsappNumber: normWhatsApp,
      whatsappSameAsMobile: Boolean(body.whatsappSameAsMobile),
      schoolAttended: String(body.schoolAttended).trim(),
      olYear: olYearNum,
      olMathResult: body.olMathResult,
      olEnglishResult: body.olEnglishResult,
      olGradeCounts: {
        aCount,
        bCount,
        cCount,
        sCount,
        wCount,
      },
      totalSubjects: calculatedTotalSubjects,
      diplomaProgramme: diplomaProg,
      diplomaId: body.diplomaId || link.diplomaId || null,
      branch: body.branch || link.branch || '',
      batch: body.batch || link.batch || '',
      applicationLinkId: link._id,
      declarationAccepted: true,
      status: 'Pending',
      auditLogs: [
        {
          action: 'SUBMITTED',
          performedBy: 'Student',
          timestamp: new Date(),
          details: { linkName: link.linkName, ip: req.ip },
        },
      ],
    });

    await newApp.save();

    // Increment Link Submission Counter
    await PastStudentApplicationLink.findByIdAndUpdate(link._id, {
      $inc: { submissionCount: 1 },
    });

    // Create independent audit record
    await PastStudentApplicationAuditLog.create({
      applicationRef: newApp.applicationRef,
      applicationId: newApp._id,
      action: 'SUBMITTED',
      performedBy: 'Student',
      details: {
        studentId: newApp.studentId,
        diplomaProgramme: newApp.diplomaProgramme,
        linkToken: link.token,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Application Submitted Successfully!',
      applicationRef: newApp.applicationRef,
      studentId: newApp.studentId,
      submittedAt: newApp.createdAt,
    });
  } catch (err) {
    console.error('submitApplication error:', err);
    return res.status(500).json({ message: 'Internal server error while processing your application' });
  }
};

// --- ADMIN APIS (AUTHENTICATED) ---

// 4. Past Students Summary KPI Stats
exports.getStats = async (req, res) => {
  try {
    const totalApplications = await PastStudentApplication.countDocuments();
    const pendingApplications = await PastStudentApplication.countDocuments({ status: 'Pending' });
    const completedApplications = await PastStudentApplication.countDocuments({ status: 'Completed' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const applicationsToday = await PastStudentApplication.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const totalLinks = await PastStudentApplicationLink.countDocuments();
    const activeLinks = await PastStudentApplicationLink.countDocuments({ isActive: true });

    return res.status(200).json({
      totalApplications,
      pendingApplications,
      completedApplications,
      applicationsToday,
      totalLinks,
      activeLinks,
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Failed to retrieve past student statistics' });
  }
};

// 5. Paginated & Filterable Applications Table
exports.getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      diploma = 'all',
      branch = 'all',
      batch = 'all',
      linkId = 'all',
      startDate,
      endDate,
      sort = 'newest',
    } = req.query;

    const filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Diploma filter
    if (diploma && diploma !== 'all') {
      filter.diplomaProgramme = diploma;
    }

    // Branch filter
    if (branch && branch !== 'all') {
      filter.branch = branch;
    }

    // Batch filter
    if (batch && batch !== 'all') {
      filter.batch = batch;
    }

    // Link ID filter
    if (linkId && linkId !== 'all') {
      filter.applicationLinkId = linkId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Search query (Student Name, Student ID, NIC/Passport, Reference)
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { nicPassportNumber: { $regex: q, $options: 'i' } },
        { applicationRef: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { mobileNumber: { $regex: q, $options: 'i' } },
      ];
    }

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'nameAsc') sortObj = { fullName: 1 };
    else if (sort === 'nameDesc') sortObj = { fullName: -1 };
    else if (sort === 'studentId') sortObj = { studentId: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      PastStudentApplication.find(filter)
        .populate('applicationLinkId', 'linkName token')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PastStudentApplication.countDocuments(filter),
    ]);

    // Mask NIC/Passport in list view for privacy
    const maskedItems = items.map((app) => {
      let maskedNic = app.nicPassportNumber || '';
      if (maskedNic.length > 4) {
        maskedNic = '*'.repeat(maskedNic.length - 4) + maskedNic.slice(-4);
      }
      return {
        ...app,
        maskedNicPassport: maskedNic,
      };
    });

    return res.status(200).json({
      items: maskedItems,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ message: 'Failed to retrieve applications' });
  }
};

// 6. Get Single Application Details
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await PastStudentApplication.findById(id)
      .populate('applicationLinkId', 'linkName token branch batch')
      .lean();

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(app);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve application details' });
  }
};

// 7. Update / Correct Application Data
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const adminUser = req.user?.email || 'Admin';

    const app = await PastStudentApplication.findById(id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const changes = {};

    // Allowable editable fields
    if (body.fullName && validateStudentName(body.fullName)) {
      changes.fullName = { from: app.fullName, to: body.fullName.trim() };
      app.fullName = body.fullName.trim();
    }
    if (body.certificateName) {
      changes.certificateName = { from: app.certificateName, to: body.certificateName.trim() };
      app.certificateName = body.certificateName.trim();
    }
    if (body.dob) {
      changes.dob = { from: app.dob, to: new Date(body.dob) };
      app.dob = new Date(body.dob);
    }
    if (body.gender) {
      changes.gender = { from: app.gender, to: body.gender };
      app.gender = body.gender;
    }
    if (body.residentialAddress && validateAddress(body.residentialAddress)) {
      changes.residentialAddress = { from: app.residentialAddress, to: body.residentialAddress.trim() };
      app.residentialAddress = body.residentialAddress.trim();
    }
    if (body.email && validateEmail(body.email)) {
      changes.email = { from: app.email, to: body.email.trim().toLowerCase() };
      app.email = body.email.trim().toLowerCase();
    }
    if (body.mobileNumber) {
      const normMob = normalizePhoneNumber(body.mobileNumber);
      if (normMob) {
        changes.mobileNumber = { from: app.mobileNumber, to: normMob };
        app.mobileNumber = normMob;
      }
    }
    if (body.whatsappNumber) {
      const normWa = normalizePhoneNumber(body.whatsappNumber);
      if (normWa) {
        changes.whatsappNumber = { from: app.whatsappNumber, to: normWa };
        app.whatsappNumber = normWa;
      }
    }
    if (body.diplomaProgramme) {
      changes.diplomaProgramme = { from: app.diplomaProgramme, to: body.diplomaProgramme.trim() };
      app.diplomaProgramme = body.diplomaProgramme.trim();
    }
    if (body.branch !== undefined) app.branch = body.branch;
    if (body.batch !== undefined) app.batch = body.batch;

    // Record audit log
    app.auditLogs.push({
      action: 'EDITED',
      performedBy: adminUser,
      timestamp: new Date(),
      details: { changes, reason: body.editReason || 'Administrative correction' },
    });

    await app.save();

    await PastStudentApplicationAuditLog.create({
      applicationRef: app.applicationRef,
      applicationId: app._id,
      action: 'EDITED',
      performedBy: adminUser,
      details: { changes, reason: body.editReason || 'Administrative correction' },
    });

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      application: app,
    });
  } catch (err) {
    console.error('updateApplication error:', err);
    return res.status(500).json({ message: 'Failed to update application' });
  }
};

// 8. Update Application Status (Mark Completed or Reopen)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const adminUser = req.user?.email || 'Admin';

    if (!['Pending', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either Pending or Completed' });
    }

    const app = await PastStudentApplication.findById(id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const prevStatus = app.status;
    app.status = status;

    if (status === 'Completed') {
      app.completedAt = new Date();
      app.completedBy = adminUser;
    } else {
      app.completedAt = null;
      app.completedBy = null;
    }

    const actionName = status === 'Completed' ? 'STATUS_CHANGE' : 'REOPENED';
    app.auditLogs.push({
      action: actionName,
      performedBy: adminUser,
      timestamp: new Date(),
      details: { from: prevStatus, to: status, remarks: remarks || '' },
    });

    await app.save();

    await PastStudentApplicationAuditLog.create({
      applicationRef: app.applicationRef,
      applicationId: app._id,
      action: actionName,
      performedBy: adminUser,
      details: { from: prevStatus, to: status, remarks: remarks || '' },
    });

    return res.status(200).json({
      success: true,
      message: status === 'Completed' ? 'Application marked as Completed' : 'Application reopened to Pending',
      application: app,
    });
  } catch (err) {
    console.error('updateApplicationStatus error:', err);
    return res.status(500).json({ message: 'Failed to update application status' });
  }
};

// 9. Permanent Deletion of Completed Application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user?.email || 'Admin';

    const app = await PastStudentApplication.findById(id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Security Constraint: Only completed applications should be eligible for permanent deletion
    if (app.status !== 'Completed') {
      return res.status(400).json({
        message: 'Only completed applications can be permanently deleted. Mark the application as Completed first.',
      });
    }

    // Maintain minimal administrative deletion audit record before deleting
    await PastStudentApplicationAuditLog.create({
      applicationRef: app.applicationRef,
      applicationId: app._id,
      action: 'PERMANENT_DELETED',
      performedBy: adminUser,
      details: {
        studentId: app.studentId,
        diplomaProgramme: app.diplomaProgramme,
        deletedAt: new Date(),
      },
    });

    // Decrement submission count on link if link exists
    if (app.applicationLinkId) {
      await PastStudentApplicationLink.findByIdAndUpdate(app.applicationLinkId, {
        $inc: { submissionCount: -1 },
      });
    }

    await PastStudentApplication.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Application permanently deleted from database.',
      deletedRef: app.applicationRef,
    });
  } catch (err) {
    console.error('deleteApplication error:', err);
    return res.status(500).json({ message: 'Failed to delete application' });
  }
};

// --- LINK MANAGEMENT APIS (AUTHENTICATED) ---

// 10. List All Application Links
exports.getLinks = async (req, res) => {
  try {
    const links = await PastStudentApplicationLink.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items: links });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve application links' });
  }
};

// 11. Generate New Application Link
exports.createLink = async (req, res) => {
  try {
    const {
      linkName,
      branch,
      diplomaProgramme,
      diplomaId,
      batch,
      expiresAt,
      isActive = true,
    } = req.body;

    if (!linkName || !String(linkName).trim()) {
      return res.status(400).json({ message: 'Link name is required' });
    }

    // Generate secure unpredictable random token (32 hex characters)
    const token = crypto.randomBytes(16).toString('hex');
    const adminUser = req.user?.email || 'Admin';

    const newLink = new PastStudentApplicationLink({
      token,
      linkName: String(linkName).trim(),
      branch: branch ? String(branch).trim() : '',
      diplomaProgramme: diplomaProgramme ? String(diplomaProgramme).trim() : '',
      diplomaId: diplomaId || null,
      batch: batch ? String(batch).trim() : '',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: Boolean(isActive),
      createdBy: adminUser,
      submissionCount: 0,
    });

    await newLink.save();

    return res.status(201).json({
      success: true,
      message: 'Application link created successfully',
      link: newLink,
    });
  } catch (err) {
    console.error('createLink error:', err);
    return res.status(500).json({ message: 'Failed to create application link' });
  }
};

// 12. Update / Toggle Link
exports.updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { linkName, branch, diplomaProgramme, batch, expiresAt, isActive } = req.body;

    const link = await PastStudentApplicationLink.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    if (linkName !== undefined) link.linkName = String(linkName).trim();
    if (branch !== undefined) link.branch = String(branch).trim();
    if (diplomaProgramme !== undefined) link.diplomaProgramme = String(diplomaProgramme).trim();
    if (batch !== undefined) link.batch = String(batch).trim();
    if (expiresAt !== undefined) link.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) link.isActive = Boolean(isActive);

    await link.save();

    return res.status(200).json({
      success: true,
      message: 'Link updated successfully',
      link,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update link' });
  }
};

// 13. Delete Link
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await PastStudentApplicationLink.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // If link has submissions, check if admin explicitly confirms or prevent accidental cascade
    if (link.submissionCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        message: `This link has ${link.submissionCount} submitted application(s). Deleting it will unlink existing applications. Pass force=true to proceed, or deactivate the link instead.`,
        hasSubmissions: true,
      });
    }

    await PastStudentApplicationLink.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Application link deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete link' });
  }
};
