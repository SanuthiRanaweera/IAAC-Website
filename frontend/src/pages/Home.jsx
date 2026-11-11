import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowRight, CalendarDays } from 'lucide-react';

// --- IMPORT YOUR COMPONENTS ---
import SEO from '../components/SEO.jsx';
import HeroSection from '../components/HeroSection';
import WelcomeToIAAC from '../components/WelcomeToIAAC.jsx';
import NoticePopup from '../components/NoticePopup.jsx';
import apiClient from '../services/apiClient.js';

/* ---------------- ANIMATION VARIANTS ---------------- */
const cardVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

function Home() {
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [notices, setNotices] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeError, setNoticeError] = useState('');

  // --- FETCH NOTICES FROM BACKEND ---
  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        setNoticeLoading(true);
        // Ensure this matches your backend route exactly
        const res = await apiClient.get('/api/notices');
        
        // Handle different API response structures (array vs { items: [] })
        const items = Array.isArray(res.data) ? res.data : res.data?.items;
        
        if (isMounted) {
          setNotices(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading notices:", err);
          setNoticeError('Unable to load announcements.');
        }
      } finally {
        if (isMounted) setNoticeLoading(false);
      }
    }

    loadNotices();
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      <SEO
        title={null}
        description="International Airline and Aviation College (IAAC) - Sri Lanka's leading aviation training institute. Professional airline & aviation courses, practical training, and career support across Colombo, Ratmalana & Kurunegala."
        path="/"
        keywords="aviation college Sri Lanka, airline training, IATA courses, cabin crew training, airport management"
      />
      {/* HOMEPAGE POPUP ANNOUNCEMENT */}
      <NoticePopup />

      {/* 1. HERO SECTION */}
      <HeroSection />

      {/* 2. WELCOME TO IAAC */}
      <WelcomeToIAAC />

      {/* 3. NOTICE BOARD SECTION */}
      <section className="bg-slate-50 py-16 overflow-hidden min-h-[500px]">
        <div className="container mx-auto px-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center mb-12 gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 mb-4 border border-blue-200">
                <Bell size={14} className="fill-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Updates & News</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Notice Board
              </h2>
              <p className="mt-2 text-slate-500 max-w-lg mx-auto">
                Stay updated with the latest announcements, exam schedules, and upcoming events at IAAC.
              </p>
            </div>
            
            {/* Scroll Hint */}
            <div className="hidden md:flex text-sm text-slate-400 font-medium items-center gap-2">
              Scroll for more <ArrowRight size={16} />
            </div>
          </motion.div>

          {/* -------- NOTICES CAROUSEL -------- */}
          <div className="relative">
            {noticeLoading ? (
              // Loading State (Skeleton)
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-[300px] h-[350px] bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="h-40 bg-slate-200 rounded-xl mb-4 animate-pulse"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : noticeError ? (
              // Error State
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-2">{noticeError}</p>
              </div>
            ) : notices.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="text-slate-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No New Announcements</h3>
                <p className="text-slate-500 text-sm">Check back later for updates.</p>
              </div>
            ) : (
              // Active Notices List
              <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {notices.map((notice, index) => (
                  <motion.div
                    key={notice._id || index}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    onClick={() => setSelectedNotice(notice)}
                    className="min-w-[300px] max-w-[300px] md:min-w-[340px] md:max-w-[340px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 group flex flex-col h-full"
                  >
                    {/* Image (1:1 square) */}
                    <div className="relative w-full aspect-square overflow-hidden bg-white">
                      {notice.imageUrl ? (
                        <img
                          src={notice.imageUrl}
                          alt={notice.title}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <CalendarDays size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {notice.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-grow">
                        {notice.description}
                      </p>
                      <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Read More</span>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. MODAL POPUP (Details View) */}
      <AnimatePresence>
        {selectedNotice && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedNotice(null)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden"
            >
              <button
                onClick={() => setSelectedNotice(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-20"
              >
                <X size={20} />
              </button>

              {/* Modal Image (1:1 square) */}
              {selectedNotice.imageUrl && (
                <div className="w-full md:w-2/5 aspect-square relative shrink-0 bg-white">
                  <img
                    src={selectedNotice.imageUrl}
                    alt={selectedNotice.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Modal Content */}
              <div className="p-8 md:p-10 flex-grow bg-white">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-md mb-4">
                  Announcement
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 leading-tight">
                  {selectedNotice.title}
                </h3>
                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.description}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setSelectedNotice(null)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Home;