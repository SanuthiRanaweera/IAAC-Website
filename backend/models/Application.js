const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    // Personal
    title: { type: String, required: false },
    fullName: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: false },
    nic: { type: String, required: false },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: false },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: false },
    address: { type: String, required: false },

    // Education & Guardian
    school: { type: String, required: false },
    olYear: { type: String, required: false },
    olResults: { type: mongoose.Schema.Types.Mixed, required: false },
    parentName: { type: String, required: false },
    parentPhone: { type: String, required: false },

    // Program selection
    program: { type: String, required: true },
    academy: { type: String, required: true },
    referral: { type: String, required: false },

    // Admin processing & review workflow
    isDone: { type: Boolean, default: false },
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.Mixed },
    reviewReason: { type: String },
    reviewRemarks: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', ApplicationSchema);
