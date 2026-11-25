const mongoose = require('mongoose');

const PastStudentApplicationLinkSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    linkName: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    diplomaProgramme: {
      type: String,
      trim: true,
      default: '',
    },
    diplomaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
    collection: 'pastStudentApplicationLinks',
  }
);

module.exports = mongoose.model(
  'PastStudentApplicationLink',
  PastStudentApplicationLinkSchema
);
