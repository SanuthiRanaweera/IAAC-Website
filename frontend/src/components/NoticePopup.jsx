import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ExternalLink, Calendar, ChevronLeft, ChevronRight, Maximize2, Tag } from 'lucide-react';
import apiClient from '../services/apiClient.js';

function NoticePopup() {
  const [activeNotices, setActiveNotices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpandedDescription, setIsExpandedDescription] = useState(false);
  const [isFullImageViewerOpen, setIsFullImageViewerOpen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(null); // 'portrait' | 'landscape' | 'square'

  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // 1. Fetch active popups on mount and check sessionStorage
  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    async function loadActivePopups() {
      try {
        let items = [];
        try {
          const res = await apiClient.get('/api/notices/active-popups');
          items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
        } catch {
          // Fallback to general list if specific endpoint is unavailable
          const fallbackRes = await apiClient.get('/api/notices');
          const fallbackItems = Array.isArray(fallbackRes?.data?.items) ? fallbackRes.data.items : (Array.isArray(fallbackRes?.data) ? fallbackRes.data : []);
          const now = new Date();
          items = fallbackItems.filter((n) => {
            const enabled = Boolean(n.showAsPopup ?? n.isPopup);
            if (!enabled || n.popupStatus === 'inactive') return false;
            if (n.popupStartDate && new Date(n.popupStartDate) > now) return false;
            if (n.popupEndDate && new Date(n.popupEndDate) < now) return false;
            return true;
          });
        }

        // Filter out notices already dismissed during this browser session
        const eligible = items.filter((notice) => {
          if (!notice || !notice._id) return false;
          const storageKey = `iaac_dismissed_popup_${notice._id}_v${notice.popupVersion || 1}`;
          try {
            return !sessionStorage.getItem(storageKey);
          } catch {
            return true;
          }
        });

        if (eligible.length > 0 && isMounted) {
          setActiveNotices(eligible);
          setCurrentIndex(0);

          // Appear approximately 1 second after homepage loads
          timerId = setTimeout(() => {
            if (isMounted) {
              previousFocusRef.current = document.activeElement;
              setIsOpen(true);
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to load active homepage popups:', err);
      }
    }

    loadActivePopups();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const currentNotice = activeNotices[currentIndex] || null;

  // Detect image aspect ratio when notice changes
  useEffect(() => {
    setIsExpandedDescription(false);
    setIsFullImageViewerOpen(false);
    if (!currentNotice?.imageUrl) {
      setImageAspectRatio(null);
      return;
    }

    const img = new Image();
    img.src = currentNotice.imageUrl;
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth * 1.15) {
        setImageAspectRatio('portrait');
      } else if (img.naturalWidth > img.naturalHeight * 1.15) {
        setImageAspectRatio('landscape');
      } else {
        setImageAspectRatio('square');
      }
    };
    img.onerror = () => {
      setImageAspectRatio(null);
    };
  }, [currentNotice]);

  // Dismiss current notice and record in sessionStorage
  const dismissCurrentNotice = useCallback(() => {
    if (currentNotice?._id) {
      try {
        const storageKey = `iaac_dismissed_popup_${currentNotice._id}_v${currentNotice.popupVersion || 1}`;
        sessionStorage.setItem(storageKey, 'true');
      } catch (err) {
        console.error('Failed to save popup dismissal in sessionStorage:', err);
      }
    }

    const remaining = activeNotices.filter((_, idx) => idx !== currentIndex);
    if (remaining.length > 0) {
      setActiveNotices(remaining);
      setCurrentIndex((prev) => (prev >= remaining.length ? 0 : prev));
    } else {
      setIsOpen(false);
    }
  }, [currentNotice, activeNotices, currentIndex]);

  // Dismiss all remaining notices
  const dismissAll = useCallback(() => {
    activeNotices.forEach((n) => {
      if (n?._id) {
        try {
          sessionStorage.setItem(`iaac_dismissed_popup_${n._id}_v${n.popupVersion || 1}`, 'true');
        } catch {
          // ignore
        }
      }
    });
    setIsOpen(false);
  }, [activeNotices]);

  // Lock body scroll and handle Escape key + Accessible focus trap
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullImageViewerOpen) {
          setIsFullImageViewerOpen(false);
        } else {
          dismissCurrentNotice();
        }
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current && !isFullImageViewerOpen) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullImageViewerOpen, dismissCurrentNotice]);

  if (!isOpen || !currentNotice) {
    return null;
  }

  // Formatting date
  const displayDate = currentNotice.createdAt
    ? new Date(currentNotice.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Description truncation logic (long descriptions get a clean inline "Read More")
  const rawDescription = currentNotice.description || '';
  const isDescriptionLong = rawDescription.length > 220;
  const descriptionText =
    isDescriptionLong && !isExpandedDescription
      ? rawDescription.slice(0, 200).trim() + '...'
      : rawDescription;

  // Layout variant:
  // Variant B: Text notice (no image)
  // Variant C: Poster notice (portrait flyer)
  // Variant A: Standard image notice (landscape or square)
  const isTextNotice = !currentNotice.imageUrl;
  const isPosterNotice = Boolean(currentNotice.imageUrl && imageAspectRatio === 'portrait');

  return (
    <AnimatePresence>
      {isOpen && currentNotice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-popup-title"
        >
          {/* Subtle Layered Overlay: rgba(8, 15, 35, 0.65) with 6px blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#080F23]/65 backdrop-blur-[6px]"
            onClick={dismissCurrentNotice}
            aria-hidden="true"
          />

          {/* Floating Announcement Card: Max width 620px, height auto, max-height 85vh / 85dvh */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-[620px] bg-white/98 backdrop-blur-md rounded-[16px] sm:rounded-[20px] shadow-[0_20px_60px_-15px_rgba(8,15,35,0.3)] border border-slate-100 flex flex-col max-h-[85vh] max-h-[85dvh] focus:outline-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- COMPACT HEADER (~64px) --- */}
            <header className="h-16 px-5 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              {/* Left: IAAC Logo & Official Announcement Label */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="IAAC"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Official Announcement
                </span>
              </div>

              {/* Right: Multi-notice navigator (if >1) + Accessible 36x36 Close Button */}
              <div className="flex items-center gap-2">
                {activeNotices.length > 1 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-2 py-1 rounded-full mr-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeNotices.length - 1))
                      }
                      className="p-0.5 hover:text-slate-900 transition-colors"
                      aria-label="Previous notice"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span>
                      {currentIndex + 1} / {activeNotices.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev < activeNotices.length - 1 ? prev + 1 : 0))
                      }
                      className="p-0.5 hover:text-slate-900 transition-colors"
                      aria-label="Next notice"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {/* 36px x 36px Circular Close Button */}
                <button
                  type="button"
                  onClick={dismissCurrentNotice}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
                  aria-label="Close announcement"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* --- ADAPTIVE CONTENT BODY (Controlled vertical scrolling) --- */}
            <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-6 sm:py-6 space-y-4">
              {/* Category Badge & Date Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentNotice.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100 text-[11px] uppercase tracking-wider">
                    <Tag size={11} className="text-blue-500" />
                    {currentNotice.category}
                  </span>
                )}
                {displayDate && (
                  <span className="flex items-center gap-1 font-medium text-slate-400 text-xs">
                    <Calendar size={12} className="text-slate-400" />
                    {displayDate}
                  </span>
                )}
              </div>

              {/* Notice Title — Positioned Above Image */}
              <h2
                id="notice-popup-title"
                className="text-xl sm:text-[24px] font-bold text-[#0B1528] leading-[1.3] tracking-tight"
              >
                {currentNotice.title}
              </h2>

              {/* Smart Image Display */}
              {currentNotice.imageUrl && (
                <div className="relative group rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <img
                    src={currentNotice.imageUrl}
                    alt={currentNotice.title}
                    className={`w-full object-contain ${
                      isPosterNotice
                        ? 'max-h-[220px] sm:max-h-[260px]'
                        : 'max-h-[200px] sm:max-h-[240px]'
                    }`}
                    loading="eager"
                  />

                  {/* Accessible Zoom / View Full Notice Button overlay */}
                  <button
                    type="button"
                    onClick={() => setIsFullImageViewerOpen(true)}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080F23]/80 hover:bg-[#080F23] text-white text-xs font-medium backdrop-blur-sm shadow-md transition-all opacity-95 group-hover:opacity-100"
                    title="View full notice poster"
                  >
                    <Maximize2 size={13} />
                    <span>{isPosterNotice ? 'View Full Poster' : 'View Full Image'}</span>
                  </button>
                </div>
              )}

              {/* Text-Notice Special Icon Highlight (Variant B) */}
              {isTextNotice && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100/80 text-blue-900 text-xs font-medium">
                  <Bell size={15} className="text-blue-600 shrink-0" />
                  <span>Important official update from IAAC Academic & Student Affairs</span>
                </div>
              )}

              {/* Notice Description with Clean Expandable Handling */}
              {rawDescription && (
                <div className="text-[15px] sm:text-base text-slate-600 leading-[1.6] whitespace-pre-line">
                  {descriptionText}
                  {isDescriptionLong && (
                    <button
                      type="button"
                      onClick={() => setIsExpandedDescription((prev) => !prev)}
                      className="ml-1.5 text-blue-600 hover:text-blue-800 font-semibold underline text-sm focus:outline-none"
                    >
                      {isExpandedDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* --- INTEGRATED COMPACT FOOTER --- */}
            <footer className="px-5 py-4 sm:px-6 sm:py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Secondary Action: Continue to Website */}
              <button
                type="button"
                onClick={dismissCurrentNotice}
                className="order-2 sm:order-1 text-slate-500 hover:text-slate-800 text-sm font-medium px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-200/50 w-full sm:w-auto text-center"
              >
                Continue to Website
              </button>

              {/* Primary Action Buttons */}
              <div className="order-1 sm:order-2 flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Optional Poster Inspection button if poster exists */}
                {currentNotice.imageUrl && isPosterNotice && (
                  <button
                    type="button"
                    onClick={() => setIsFullImageViewerOpen(true)}
                    className="h-[44px] px-4 rounded-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-xs flex items-center gap-1.5"
                  >
                    <Maximize2 size={14} />
                    <span>View Full Poster</span>
                  </button>
                )}

                {/* Custom CTA Action Button (if provided by Admin) */}
                {currentNotice.popupButtonText && currentNotice.popupButtonUrl ? (
                  <a
                    href={currentNotice.popupButtonUrl}
                    target={currentNotice.popupButtonUrl.startsWith('http') ? '_blank' : '_self'}
                    rel={currentNotice.popupButtonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={dismissCurrentNotice}
                    className="h-[44px] px-5 rounded-[10px] bg-[#0B1528] hover:bg-[#152544] text-white text-sm font-medium transition shadow-sm hover:shadow flex items-center justify-center gap-2 w-full sm:w-auto text-center shrink-0"
                  >
                    <span>{currentNotice.popupButtonText}</span>
                    {currentNotice.popupButtonUrl.startsWith('http') && <ExternalLink size={14} />}
                  </a>
                ) : currentNotice.imageUrl && !isPosterNotice ? (
                  <button
                    type="button"
                    onClick={() => setIsFullImageViewerOpen(true)}
                    className="h-[44px] px-5 rounded-[10px] bg-[#0B1528] hover:bg-[#152544] text-white text-sm font-medium transition shadow-sm hover:shadow flex items-center justify-center gap-2 w-full sm:w-auto text-center shrink-0"
                  >
                    <span>View Full Notice</span>
                    <Maximize2 size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dismissCurrentNotice}
                    className="h-[44px] px-6 rounded-[10px] bg-[#0B1528] hover:bg-[#152544] text-white text-sm font-medium transition shadow-sm hover:shadow flex items-center justify-center w-full sm:w-auto text-center shrink-0"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </footer>
          </motion.div>

          {/* --- ACCESSIBLE FULL-SIZE POSTER / IMAGE VIEWER LIGHTBOX --- */}
          <AnimatePresence>
            {isFullImageViewerOpen && currentNotice.imageUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
                onClick={() => setIsFullImageViewerOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Full Notice Poster Viewer"
              >
                {/* Top Toolbar */}
                <div
                  className="w-full max-w-4xl flex items-center justify-between text-white pb-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate max-w-md">
                      {currentNotice.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullImageViewerOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition focus:ring-2 focus:ring-white outline-none"
                    aria-label="Close full size viewer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scaled Full Poster Image */}
                <div
                  className="relative max-w-4xl max-h-[85vh] overflow-auto flex items-center justify-center rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={currentNotice.imageUrl}
                    alt={currentNotice.title}
                    className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

export default NoticePopup;
