import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Menu, X, ChevronDown } from 'lucide-react';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { user } = useAuth();

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between min-h-[4.5rem]">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="IAAC"
              className="h-9 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-6">
            <NavLink to="/" text="Home" />
            <NavLink to="/about" text="About Us" />
            <NavLink to="/student-life" text="Student Life" />
            <NavLink to="/hall-of-frames" text="Hall of Fame" />

            {/* PROGRAMS DROPDOWN */}
            <div className="relative group">
              <Link
                to="/programs"
                className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 py-2"
              >
                Programs <ChevronDown size={16} />
              </Link>

              <div className="absolute left-0 top-full pt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#2a2a2a] text-white rounded-lg shadow-xl py-1">
                  <DropdownItem to={{ pathname: '/programs' }} text="Programs" />
                  <DropdownItem to={{ pathname: '/programs/practical-trainings' }} text="Practical Trainings" />
                </div>
              </div>
            </div>
            <NavLink to="/events/upcoming" text="Events" />
            <NavLink to="/contact-us" text="Contact Us" />
          </div>

          {/* DESKTOP ACTION BUTTONS */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://iaaccampus.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-bold rounded-full hover:bg-blue-50 transition"
            >
              LMS Login
            </a>
            <Link
              to="/apply-now"
              className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition shadow"
            >
              Apply Now
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden p-2 text-slate-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-100">
          <div className="px-6 py-6 space-y-4">
            <MobileLink to="/" text="Home" close={() => setIsMobileMenuOpen(false)} />
            <MobileLink to="/about" text="About Us" close={() => setIsMobileMenuOpen(false)} />
            <MobileLink to="/student-life" text="Student Life" close={() => setIsMobileMenuOpen(false)} />
            <MobileLink to="/hall-of-frames" text="Hall of Fame" close={() => setIsMobileMenuOpen(false)} />

            {/* MOBILE DROPDOWN */}
            <div>
              <button
                onClick={() => toggleDropdown('programs')}
                className="flex justify-between items-center w-full py-3 text-lg font-medium text-slate-700 border-b"
              >
                Programs
                <ChevronDown
                  className={`transition ${activeDropdown === 'programs' ? 'rotate-180' : ''}`}
                />
              </button>

              {activeDropdown === 'programs' && (
                <div className="pl-4 py-2 space-y-2 bg-slate-50 rounded">
                  <MobileSubLink
                    to={{ pathname: '/programs' }}
                    text="Programs"
                    close={() => {
                      setIsMobileMenuOpen(false);
                      setActiveDropdown(null);
                    }}
                  />
                  <MobileSubLink
                    to={{ pathname: '/programs/practical-trainings' }}
                    text="Practical Trainings"
                    close={() => {
                      setIsMobileMenuOpen(false);
                      setActiveDropdown(null);
                    }}
                  />
                </div>
              )}
            </div>
            <MobileLink to="/events/upcoming" text="Events" close={() => setIsMobileMenuOpen(false)} />
            <MobileLink to="/contact-us" text="Contact Us" close={() => setIsMobileMenuOpen(false)} />

            {/* MOBILE BUTTONS */}
            <div className="pt-4 space-y-3">
              <a
                href="https://iaaccampus.com/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setActiveDropdown(null);
                }}
                className="block text-center py-3 border border-blue-600 text-blue-600 font-bold rounded-lg"
              >
                LMS Login
              </a>
              <Link
                to="/apply-now"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setActiveDropdown(null);
                }}
                className="block text-center py-3 bg-blue-600 text-white font-bold rounded-lg"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* -------- HELPERS -------- */

function NavLink({ to, text }) {
  return (
    <Link to={to} className="text-sm font-semibold text-slate-700 hover:text-blue-600">
      {text}
    </Link>
  );
}

function DropdownItem({ to, text }) {
  return (
    <Link
      to={to}
      className="block px-6 py-3 text-sm text-slate-300 hover:bg-[#333] hover:text-white transition"
    >
      {text}
    </Link>
  );
}

function MobileLink({ to, text, close }) {
  return (
    <Link
      to={to}
      onClick={close}
      className="block py-3 text-lg font-medium text-slate-700 border-b"
    >
      {text}
    </Link>
  );
}

function MobileSubLink({ to, text, close }) {
  return (
    <Link to={to} onClick={close} className="block py-2 text-slate-600 hover:text-blue-600">
      {text}
    </Link>
  );
}

export default Navbar;
