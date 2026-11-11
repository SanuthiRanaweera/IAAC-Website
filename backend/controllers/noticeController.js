const Notice = require('../models/Notice');

/**
 * Validates that an action URL uses safe protocols (http, https, or relative internal path)
 */
function isValidActionUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  // Allow internal relative paths
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Priority weighting for sorting active popups
 */
const PRIORITY_SCORES = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Public: List all notices for the Notice Board
 */
exports.list = async (_req, res) => {
  try {
    const items = await Notice.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items });
  } catch (err) {
    console.error('List notices error:', err);
    return res.status(500).json({ items: [] });
  }
};

/**
 * Public: Retrieve currently active, eligible homepage popup notices
 * Filtered by showAsPopup=true, popupStatus='active', and valid date range.
 * Sorted by priority (high > medium > low), then publishing date desc.
 */
exports.getActivePopups = async (_req, res) => {
  try {
    const now = new Date();

    const query = {
      $or: [{ showAsPopup: true }, { isPopup: true }],
      popupStatus: { $ne: 'inactive' },
      $and: [
        {
          $or: [
            { popupStartDate: null },
            { popupStartDate: { $exists: false } },
            { popupStartDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { popupEndDate: null },
            { popupEndDate: { $exists: false } },
            { popupEndDate: { $gte: now } },
          ],
        },
      ],
    };

    const notices = await Notice.find(query).lean();

    // Sort by priority (high > medium > low), then createdAt descending
    notices.sort((a, b) => {
      const pA = PRIORITY_SCORES[a.popupPriority] || PRIORITY_SCORES.medium;
      const pB = PRIORITY_SCORES[b.popupPriority] || PRIORITY_SCORES.medium;
      if (pB !== pA) {
        return pB - pA;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return res.status(200).json({ items: notices });
  } catch (err) {
    console.error('Get active popups error:', err);
    return res.status(500).json({ items: [] });
  }
};

/**
 * Protected: Create a notice with popup settings
 */
exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      imageData,
      category,
      showAsPopup,
      isPopup,
      popupPriority,
      popupStartDate,
      popupEndDate,
      popupStatus,
      popupButtonText,
      popupButtonUrl,
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Notice title is required' });
    }

    if (popupButtonUrl && !isValidActionUrl(popupButtonUrl)) {
      return res.status(400).json({ message: 'Invalid popup button URL. Only http, https, or internal links are allowed.' });
    }

    const startDate = popupStartDate ? new Date(popupStartDate) : null;
    const endDate = popupEndDate ? new Date(popupEndDate) : null;
    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({ message: 'Popup expiry date must be later than start date.' });
    }

    const popupEnabled = Boolean(showAsPopup ?? isPopup ?? false);

    // imageData is a base64 data-URI sent from dashboard file picker
    const finalImage = imageData || imageUrl || undefined;

    const notice = await Notice.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      imageUrl: finalImage,
      category: category && ['General', 'Academic', 'Examination', 'Events', 'Admissions', 'Career'].includes(category) ? category : 'General',
      showAsPopup: popupEnabled,
      isPopup: popupEnabled,
      popupPriority: ['high', 'medium', 'low'].includes(String(popupPriority).toLowerCase()) ? String(popupPriority).toLowerCase() : 'medium',
      popupStartDate: startDate,
      popupEndDate: endDate,
      popupStatus: String(popupStatus).toLowerCase() === 'inactive' ? 'inactive' : 'active',
      popupButtonText: popupButtonText ? popupButtonText.trim() : '',
      popupButtonUrl: popupButtonUrl ? popupButtonUrl.trim() : '',
      popupVersion: 1,
    });

    return res.status(201).json(notice);
  } catch (err) {
    console.error('Create notice error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create notice' });
  }
};

/**
 * Protected: Update a notice and its popup settings
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      imageUrl,
      imageData,
      category,
      showAsPopup,
      isPopup,
      popupPriority,
      popupStartDate,
      popupEndDate,
      popupStatus,
      popupButtonText,
      popupButtonUrl,
    } = req.body || {};

    const existing = await Notice.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    if (popupButtonUrl !== undefined && popupButtonUrl && !isValidActionUrl(popupButtonUrl)) {
      return res.status(400).json({ message: 'Invalid popup button URL. Only http, https, or internal links are allowed.' });
    }

    const startDate = popupStartDate !== undefined ? (popupStartDate ? new Date(popupStartDate) : null) : existing.popupStartDate;
    const endDate = popupEndDate !== undefined ? (popupEndDate ? new Date(popupEndDate) : null) : existing.popupEndDate;
    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({ message: 'Popup expiry date must be later than start date.' });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (imageData) {
      updatePayload.imageUrl = imageData;
    } else if (imageUrl !== undefined) {
      updatePayload.imageUrl = imageUrl;
    }

    if (category !== undefined) {
      updatePayload.category = ['General', 'Academic', 'Examination', 'Events', 'Admissions', 'Career'].includes(category) ? category : 'General';
    }

    if (showAsPopup !== undefined || isPopup !== undefined) {
      const enabled = Boolean(showAsPopup ?? isPopup);
      updatePayload.showAsPopup = enabled;
      updatePayload.isPopup = enabled;
    }

    if (popupPriority !== undefined) {
      updatePayload.popupPriority = ['high', 'medium', 'low'].includes(String(popupPriority).toLowerCase())
        ? String(popupPriority).toLowerCase()
        : 'medium';
    }

    if (popupStartDate !== undefined) updatePayload.popupStartDate = startDate;
    if (popupEndDate !== undefined) updatePayload.popupEndDate = endDate;
    if (popupStatus !== undefined) {
      updatePayload.popupStatus = String(popupStatus).toLowerCase() === 'inactive' ? 'inactive' : 'active';
    }
    if (popupButtonText !== undefined) updatePayload.popupButtonText = popupButtonText.trim();
    if (popupButtonUrl !== undefined) updatePayload.popupButtonUrl = popupButtonUrl.trim();

    // Increment version when popup-relevant fields are updated
    updatePayload.popupVersion = (existing.popupVersion || 1) + 1;

    const updated = await Notice.findByIdAndUpdate(id, updatePayload, { new: true });
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update notice error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update notice' });
  }
};

/**
 * Protected: Quick toggle for showAsPopup from the dashboard card
 */
exports.togglePopup = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const newShowAsPopup = !(notice.showAsPopup ?? notice.isPopup ?? false);
    notice.showAsPopup = newShowAsPopup;
    notice.isPopup = newShowAsPopup;
    if (newShowAsPopup) {
      notice.popupVersion = (notice.popupVersion || 1) + 1;
    }
    await notice.save();

    return res.status(200).json(notice);
  } catch (err) {
    console.error('Toggle popup notice error:', err);
    return res.status(500).json({ message: 'Failed to toggle notice popup state' });
  }
};

/**
 * Protected: Delete a notice
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    return res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete notice error:', err);
    return res.status(500).json({ message: 'Failed to delete notice' });
  }
};

