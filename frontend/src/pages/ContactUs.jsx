import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Linkedin, Youtube, Building2, Plane } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import apiClient from '../services/apiClient.js';

// --- BRANCH DATA CONFIGURATION ---
const BRANCHES = [
  {
    id: 'city',
    name: 'IAAC City Academy (Head Office)',
    icon: <Building2 size={20} />,
    address: '49A Siri Dhamma Mawatha, Colombo 01000',
    hotline: '076 676 3777',
    mapLink: 'https://maps.google.com/?q=IAAC+City+Campus+Colombo'
  },
  {
    id: 'airport',
    name: 'IAAC Airport Academy (Ratmalana)',
    icon: <Plane size={20} />,
    address: 'Ratmalana International Airport, Colombo',
    hotline: '076 678 2781', // Update if specific number exists
    mapLink: 'https://maps.google.com/?q=Ratmalana+Airport'
  },
  {
    id: 'kurunegala',
    name: 'IAAC Central Academy (Kurunegala)',
    icon: <MapPin size={20} />,
    address: 'The traveller global  (Pvt)Ltd, No.100, Colombo Road, Kurunegala',
    hotline: '077 558 7888', // Update if specific number exists
    mapLink: 'https://maps.app.goo.gl/TS9KEPvNWdwwBxzW7'
  }
];

function ContactUs() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    academy: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setStatus({ submitting: false, success: false, error: 'Please enter your email.' });
      return;
    }
    if (!form.academy) {
      setStatus({ submitting: false, success: false, error: 'Please select the academy/campus.' });
      return;
    }
    setStatus({ submitting: true, success: false, error: '' });
    try {
      await apiClient.post('/api/messages', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        academy: form.academy,
        subject: form.subject,
        message: form.message,
        source: 'contact',
      });
      setStatus({ submitting: false, success: true, error: '' });
      setForm({ firstName: '', lastName: '', email: '', phone: '', academy: '', subject: 'General Inquiry', message: '' });
    } catch (err) {
      setStatus({
        submitting: false,
        success: false,
        error: err?.response?.data?.message || 'Failed to send message',
      });
    }
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Contact IAAC - International Airline and Aviation College. Reach our City Campus (Colombo), Airport Academy (Ratmalana), or Kurunegala Center. Call 076 676 3777."
        path="/contact-us"
        keywords="contact IAAC, aviation college contact, Colombo aviation academy, Ratmalana airport academy, Kurunegala aviation center"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact IAAC",
          "url": "https://iaacasia.com/contact-us"
        }}
      />
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 md:pt-[160px] pb-24 bg-[#0f172a] overflow-hidden text-center px-6">
        {/* Background Glow Effects */}
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
            Let's Start a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Conversation</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Have questions about admissions, campus life, or academics? We are here to help you find the answers you need.
          </motion.p>
        </div>
      </section>

      {/* --- MAIN CONTENT (Split Layout) --- */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">

            {/* --- LEFT COLUMN: CAMPUS INFO & HOURS (Span 5) --- */}
            <motion.div 
              className="lg:col-span-5 space-y-10"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              
              {/* 1. Branch/Campus Cards (NEW SEPARATE SECTIONS) */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Campuses</h3>
                <div className="space-y-4">
                  {BRANCHES.map((branch) => (
                    <div key={branch.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          {branch.icon}
                        </div>
                        <h4 className="font-bold text-slate-800">{branch.name}</h4>
                      </div>
                      
                      <div className="space-y-2 pl-2 border-l-2 border-slate-100 ml-4">
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="text-slate-400 mt-1 shrink-0" />
                          <p className="text-sm text-slate-600 leading-snug">{branch.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-slate-400 shrink-0" />
                          <a href={`tel:${branch.hotline}`} className="text-sm font-semibold text-blue-600 hover:underline">
                            {branch.hotline}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. General Email */}
              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-600/20">
                 <div className="flex items-center gap-3 mb-2">
                    <Mail size={24} className="text-blue-200" />
                    <h4 className="font-bold text-lg">General Inquiries</h4>
                 </div>
                 <p className="text-blue-100 text-sm mb-3">For all general questions and email correspondence.</p>
                 <a href="mailto:info@iaac.lk" className="text-xl font-bold hover:text-white hover:underline">info@iaac.lk</a>
              </div>

              {/* 3. Opening Hours */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4 text-slate-900">
                  <Clock size={20} className="text-blue-600" />
                  <h4 className="font-bold text-lg">Opening Hours</h4>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <HourItem day="Mon - Fri" hours="8:30 AM – 5:00 PM" />
                  <HourItem day="Saturday" hours="8:30 AM – 5:00 PM" />
                  <HourItem day="Sunday" hours="8:30 AM – 1:00 PM" />
                </ul>
              </div>

              {/* 4. Social Links */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  <SocialBtn icon={<Facebook size={20} />} href="https://www.facebook.com/iaacsl" label="Facebook" />
                  <SocialBtn icon={<Youtube size={20} />} href="https://www.youtube.com/@internationalairlineaviati4986" label="YouTube" />
                  <SocialBtn icon={<Linkedin size={20} />} href="https://www.linkedin.com/company/international-airline-aviation-college/posts/?feedView=all" label="LinkedIn" />
                  <SocialBtn icon={<Instagram size={20} />} href="https://www.instagram.com/iaac_aviation/" label="Instagram" />
                </div>
              </div>

            </motion.div>

            {/* --- RIGHT COLUMN: FORM (Span 7) --- */}
            <motion.div 
              className="lg:col-span-7"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 sticky top-24">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Send a Message</h2>
                <p className="text-slate-500 mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>
                
                <form className="space-y-6" onSubmit={submit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputGroup label="First Name" type="text" placeholder="Ashini" value={form.firstName} onChange={update('firstName')} />
                    <InputGroup label="Last Name" type="text" placeholder="Perera" value={form.lastName} onChange={update('lastName')} />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputGroup label="Email Address" type="email" placeholder="ashini@example.com" value={form.email} onChange={update('email')} />
                    <InputGroup label="Phone Number" type="tel" placeholder="+94 7X XXX XXXX" value={form.phone} onChange={update('phone')} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Academy / Campus</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-600"
                      value={form.academy}
                      onChange={update('academy')}
                      required
                    >
                      <option value="">Select</option>
                      <option value="IAAC City Academy">IAAC City Academy</option>
                      <option value="IAAC Airport Academy">IAAC Airport Academy</option>
                      <option value="IAAC Center Academy">IAAC Center Academy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-600"
                      value={form.subject}
                      onChange={update('subject')}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Admissions">Admissions</option>
                      <option value="Course Details">Course Details</option>
                      <option value="Student Support">Student Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                    <textarea
                      rows="4"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={update('message')}
                    ></textarea>
                  </div>

                  {status.error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                      {status.error}
                    </div>
                  )}
                  {status.success && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                      Message sent successfully.
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={status.submitting}
                    className="w-full py-4 bg-blue-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {status.submitting ? 'Sending...' : 'Send Message'} <Send size={18} />
                  </motion.button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- MAP SECTION (Main City Campus) --- */}
      <section className="h-[400px] w-full bg-slate-200 relative grayscale hover:grayscale-0 transition-all duration-700">
        <iframe 
          src="https://www.google.com/maps?q=International+Airline+%26+Aviation+College+-+IAAC+Sri+Lanka&z=17&output=embed" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="International Airline & Aviation College - IAAC Sri Lanka Map"
         ></iframe>
         
         <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 bg-white p-4 rounded-xl shadow-xl max-w-xs hidden md:block">
           <p className="font-bold text-slate-900 text-sm">Main Campus (City)</p>
           <p className="text-xs text-slate-500 mt-1">49A Siri Dhamma Mawatha, Colombo 10</p>
           <a
             href="https://www.google.com/maps?q=International+Airline+%26+Aviation+College+-+IAAC+Sri+Lanka&z=17&output=embed"
             target="_blank"
             rel="noreferrer"
             className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
           >
             Open in Google Maps
           </a>
         </div>
      </section>
    </>
  );
}

// --- SUBCOMPONENTS ---

function HourItem({ day, hours }) {
  return (
    <li className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="font-medium text-slate-700">{day}</span>
      <span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded">{hours}</span>
    </li>
  );
}

function InputGroup({ label, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" 
      />
    </div>
  );
}

function SocialBtn({ icon, href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
    >
      {icon}
    </a>
  );
}

export default ContactUs;