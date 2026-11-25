import React from 'react';
import { Menu } from 'lucide-react';

export default function AdminTopbar({
  activeTab,
  setMobileOpen,
}) {
  // Title & Breadcrumb derivation
  const getTabMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return { group: 'Overview', title: 'Dashboard Overview' };
      case 'applications':
        return { group: 'Admissions', title: 'Applications' };
      case 'messages':
        return { group: 'Admissions', title: 'Messages & Inquiries' };
      case 'past-students':
        return { group: 'Student Records', title: 'Past Students Management' };
      case 'courses':
        return { group: 'Website Management', title: 'Courses' };
      case 'practical':
        return { group: 'Website Management', title: 'Practical Training' };
      case 'events':
        return { group: 'Website Management', title: 'Events' };
      case 'notices':
        return { group: 'Website Management', title: 'Notices & Smart Popup' };
      case 'analytics':
        return { group: 'Insights', title: 'Analytics' };
      case 'reports':
        return { group: 'Insights', title: 'Reports' };
      case 'settings':
        return { group: 'System', title: 'Settings' };
      default:
        return { group: 'Admin', title: 'Management' };
    }
  };

  const { group, title } = getTabMeta();

  return (
    <header className="h-[64px] sm:h-[70px] bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Hamburger Toggle + Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500 font-semibold">{group}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Clean & Minimal */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}
