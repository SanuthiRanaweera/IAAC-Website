const mongoose = require('mongoose');

const PastStudentApplicationAuditLogSchema = new mongoose.Schema(
  {
    applicationRef: {
      type: String,
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PastStudentApplication',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['SUBMITTED', 'STATUS_CHANGE', 'EDITED', 'PERMANENT_DELETED', 'REOPENED'],
    },
    performedBy: {
      type: String,
      default: 'System',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'pastStudentApplicationAuditLogs',
  }
);

module.exports = mongoose.model(
  'PastStudentApplicationAuditLog',
  PastStudentApplicationAuditLogSchema
);
