const mongoose = require('mongoose');

const PastStudentApplicationSchema = new mongoose.Schema(
  {
    applicationRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Section A - Personal Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    certificateName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    identificationType: {
      type: String,
      enum: ['NIC', 'Passport'],
      required: true,
    },
    nicPassportNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    residentialAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Section B - Contact Information
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappSameAsMobile: {
      type: Boolean,
      default: false,
    },

    // Section C - Educational Qualifications
    schoolAttended: {
      type: String,
      required: true,
      trim: true,
    },
    olYear: {
      type: Number,
      required: true,
    },
    olMathResult: {
      type: String,
      enum: ['A', 'B', 'C', 'S', 'W'],
      required: true,
    },
    olEnglishResult: {
      type: String,
      enum: ['A', 'B', 'C', 'S', 'W'],
      required: true,
    },

    // Section D - Overall O/L Results
    olGradeCounts: {
      aCount: { type: Number, default: 0, min: 0 },
      bCount: { type: Number, default: 0, min: 0 },
      cCount: { type: Number, default: 0, min: 0 },
      sCount: { type: Number, default: 0, min: 0 },
      wCount: { type: Number, default: 0, min: 0 },
    },
    totalSubjects: {
      type: Number,
      required: true,
      min: 1,
    },

    // Section E - IAAC Registration Information
    diplomaProgramme: {
      type: String,
      required: true,
      trim: true,
    },
    diplomaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    applicationLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PastStudentApplicationLink',
      index: true,
    },

    // Section F - Declaration
    declarationAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Administrative Workflow State
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: String,
      default: null,
    },
    auditLogs: [
      {
        action: String,
        performedBy: String,
        timestamp: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'pastStudentApplications',
  }
);

// Helpful compound indexes for administrative search and query performance
PastStudentApplicationSchema.index({ status: 1, createdAt: -1 });
PastStudentApplicationSchema.index({ studentId: 1, applicationLinkId: 1 });
PastStudentApplicationSchema.index({ fullName: 'text', studentId: 'text', nicPassportNumber: 'text', applicationRef: 'text' });

module.exports = mongoose.model(
  'PastStudentApplication',
  PastStudentApplicationSchema
);
