import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Loader2, X } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import apiClient from '../services/apiClient.js';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  const [currentDate, setCurrentDate] = useState(new Date()); 

  // --- 1. FETCH DATA ---
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await apiClient.get('/api/events');
        const data = res.data;
        const items = Array.isArray(data) ? data : data?.items;

        const formattedData = (Array.isArray(items) ? items : []).map((event) => {
          const rawDate = event.eventDate || event.date;
          const parsed = rawDate ? new Date(rawDate) : null;
          const date = parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
          return { ...event, date };
        });

        if (isMounted) setEvents(formattedData);
      } catch (err) {
        console.error("Failed to fetch events", err);
        if (isMounted) {
          setEvents([]);
          setError(err?.response?.data?.message || 'Failed to load events');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!selectedEvent) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEvent]);

  const closeModal = () => {
    setSelectedEvent(null);
    setPreviewIndex(0);
  };

  // --- CALENDAR LOGIC (Yearly Navigation) ---
  const year = currentDate.getFullYear();
  const prevYear = () => setCurrentDate(new Date(year - 1, 0, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, 0, 1));

  // Events for the CURRENTLY SELECTED YEAR
  const yearEvents = events
    .filter((event) => {
      if (!event.date) return false;
      return event.date.getFullYear() === year;
    })
    .sort((a, b) => a.date - b.date);

  // Extract images for the currently selected event
  let modalImages = [];
  if (selectedEvent) {
    const candidates = [selectedEvent.imageUrl, ...(Array.isArray(selectedEvent.imageUrls) ? selectedEvent.imageUrls : [])].filter(Boolean);
    modalImages = Array.from(new Set(candidates));
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Upcoming Events"
        description="Stay updated with IAAC events, workshops, and seminars. Discover upcoming aviation industry events at International Airline and Aviation College."
        path="/events/upcoming"
        keywords="IAAC events, aviation workshops, airline seminars, aviation college events Sri Lanka"
      />

      {/* --- SPLIT-PANEL EVENT MODAL (Shows Full Details & Images) --- */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            key="event-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 md:p-12 flex items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-w-7xl w-full flex flex-col md:flex-row h-[90vh] md:h-[80vh]"
              onClick={(e) => e.stopPropagation()} 
            >
              
              {/* LEFT SIDE: Image Viewer */}
              <div className="bg-black w-full md:w-3/5 lg:w-2/3 h-[45vh] md:h-full flex flex-col shrink-0">
                <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 min-h-0 group overflow-hidden">
                  {modalImages.length > 0 ? (
                    <>
                      <img
                        src={modalImages[Math.min(previewIndex, modalImages.length - 1)]}
                        alt={selectedEvent.title}
                        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                      />
                      
                      {modalImages.length > 1 && (
                        <>
                          <button 
                            onClick={() => setPreviewIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1))}
                            className="absolute left-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button 
                            onClick={() => setPreviewIndex(prev => (prev === modalImages.length - 1 ? 0 : prev + 1))}
                            className="absolute right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                      <CalendarIcon size={48} className="mb-2 opacity-50" />
                      <p>No images available</p>
                    </div>
                  )}
                </div>

                {modalImages.length > 1 && (
                  <div className="h-20 sm:h-24 bg-slate-950 p-2 sm:p-4 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
                    {modalImages.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewIndex(idx)}
                        className={`shrink-0 w-16 sm:w-20 h-full rounded-md overflow-hidden transition-all duration-200 ${
                          idx === previewIndex ? 'border-2 border-blue-500 opacity-100 scale-105' : 'opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Scrollable Full Information Panel */}
              <div className="bg-white w-full md:w-2/5 lg:w-1/3 flex flex-col flex-1 border-l border-slate-100 min-h-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Details</span>
                  <button
                    onClick={closeModal}
                    className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                    {selectedEvent.title}
                  </h2>
                  
                  <div className="flex items-center gap-2.5 text-sm font-bold text-blue-700 bg-blue-50 w-fit px-4 py-2 rounded-xl mb-6 border border-blue-100">
                    <CalendarIcon size={18} />
                    {new Date(selectedEvent.date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  {/* Full description shown here */}
                  <div className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap break-words pb-8">
                    {selectedEvent.description ? selectedEvent.description : <span className="italic text-slate-400">No description provided for this event.</span>}
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 md:pt-[160px] pb-24 bg-[#0f172a] overflow-hidden text-center px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Gallery</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Keep track of our workshops, guest lectures, and student activities happening throughout the year.
          </motion.p>
        </div>
      </section>

      {/* Main Container */}
      <div className="container mx-auto px-6 relative z-20">
        
        {/* --- FLOATING YEAR NAV --- */}
        <div className="flex justify-center -mt-12 mb-12">
          <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 rounded-full shadow-xl shadow-slate-200/50 border border-slate-100">
            <button onClick={prevYear} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col items-center justify-center min-w-[130px] sm:min-w-[160px]">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Timeline</span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-800 leading-none">
                {year}
              </span>
            </div>
            <button onClick={nextYear} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* --- EVENT GRID GALLERY --- */}
        <div className="min-h-[400px]">
          {error && (
            <div className="text-center py-4 text-red-600 bg-red-50 rounded-xl border border-red-100 mb-6">
              {error}
            </div>
          )}

          <AnimatePresence mode='popLayout'>
            {yearEvents.length > 0 ? (
              <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {yearEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onOpenModal={(clickedEvent) => {
                      setSelectedEvent(clickedEvent);
                      setPreviewIndex(0);
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">No events scheduled</h3>
                <p className="text-slate-500 mt-2">There are no events listed for {year}.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

// --- SINGLE EVENT CARD (Gallery Style) ---
function EventCard({ event, onOpenModal }) {
  const dateObj = event.date;
  if (!dateObj) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isUpcoming = dateObj.getTime() >= todayStart.getTime();
  
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('default', { month: 'short' });
  const weekday = dateObj.toLocaleString('default', { weekday: 'long' });

  const imageCandidates = [event.imageUrl, ...(Array.isArray(event.imageUrls) ? event.imageUrls : [])].filter(Boolean);
  const images = Array.from(new Set(imageCandidates));
  const coverImage = images[0] || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col h-full cursor-pointer"
      onClick={() => onOpenModal?.(event)} 
    >
      {/* Date Header Strip */}
      <div className={`${isUpcoming ? 'bg-emerald-600' : 'bg-blue-600'} px-6 py-3 flex justify-between items-center text-white`}>
        <span className="text-xs font-bold uppercase tracking-wider">{weekday}</span>
      </div>

      {/* Cover Image (Clickable) */}
      <div className="relative h-48 overflow-hidden bg-slate-200 text-left shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <CalendarIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
      </div>

      <div className="p-6 flex flex-col flex-grow relative">
        {/* Date Box (Floating) */}
        <div className={`absolute top-4 right-6 ${isUpcoming ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'} rounded-xl w-14 h-14 flex flex-col items-center justify-center border shadow-sm`}>
          <span className="text-[10px] font-bold uppercase">{month}</span>
          <span className="text-xl font-extrabold leading-none">{day}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-6 pr-14 group-hover:text-blue-600 transition-colors flex-grow">
          {event.title}
        </h3>

        {/* View Details Button (Clickable) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal?.(event);
          }}
          className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 mt-auto hover:text-blue-800 transition-colors w-full"
        >
          View Event Details
          <div className="bg-blue-50 group-hover:bg-blue-100 p-1.5 rounded-full transition-colors">
            <ChevronRight size={14} />
          </div>
        </button>
      </div>
    </motion.div>
  );
}

export default Events;