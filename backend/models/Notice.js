const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    category: {
      type: String,
      trim: true,
      default: 'General',
      enum: ['General', 'Academic', 'Examination', 'Events', 'Admissions', 'Career'],
    },

    // Homepage Popup Configuration
    showAsPopup: { type: Boolean, default: false },
    isPopup: { type: Boolean, default: false }, // Legacy alias maintained for backwards-compatibility
    popupPriority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      lowercase: true,
      trim: true,
    },
    popupStartDate: { type: Date, default: null },
    popupEndDate: { type: Date, default: null },
    popupStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      lowercase: true,
      trim: true,
    },
    popupButtonText: { type: String, trim: true, default: '' },
    popupButtonUrl: { type: String, trim: true, default: '' },
    popupVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Validate that expiry date is later than start date if both are provided
noticeSchema.pre('validate', function (next) {
  if (this.popupStartDate && this.popupEndDate && this.popupEndDate < this.popupStartDate) {
    return next(new Error('Popup expiry date must be later than start date.'));
  }
  next();
});

module.exports = mongoose.model('Notice', noticeSchema);

