import React from 'react';
import { 
  LayoutDashboard, FileText, MessageSquare, BookOpen, Compass, 
  Calendar, Bell, BarChart3, FileSpreadsheet, Settings, LogOut,
  ChevronLeft, ChevronRight, X, ExternalLink
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'ADMISSIONS',
    items: [
      { id: 'applications', label: 'Applications', icon: FileText, badgeKey: 'pendingApplications' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, badgeKey: 'unreadMessages' },
    ],
  },
  {
    group: 'WEBSITE MANAGEMENT',
    items: [
      { id: 'courses', label: 'Courses', icon: BookOpen, countKey: 'coursesCount' },
      { id: 'practical', label: 'Practical Training', icon: Compass, countKey: 'practicalsCount' },
      { id: 'events', label: 'Events', icon: Calendar, countKey: 'eventsCount' },
      { id: 'notices', label: 'Notices', icon: Bell, badgeKey: 'activePopups' },
    ],
  },
  {
    group: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  stats = {},
  onLogout,
}) {
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0B1528] text-slate-300 select-none overflow-hidden">
      {/* SECTION A — BRANDING HEADER */}
      <div className="sidebar-header h-[70px] px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Original IAAC Logo - sleek, unpadded white background pill for high contrast */}
          <div className="bg-white p-1 rounded-xl shadow-xs flex items-center justify-center shrink-0 border border-white/20">
            <img
              src="/logo.png"
              alt="IAAC Logo"
              className="h-7 w-auto object-contain"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-bold text-base text-white tracking-tight leading-tight">
                IAAC
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-tight">
                Smart Admin Portal
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 ml-1"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* SECTION B — SCROLLABLE NAVIGATION AREA */}
      <div className="sidebar-navigation flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 custom-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.group} className="space-y-0.5">
            {!collapsed ? (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/75 mb-1.5">
                {section.group}
              </div>
            ) : (
              <div className="h-px bg-slate-800/60 my-2 mx-1" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeVal = item.badgeKey ? stats[item.badgeKey] : null;
                const countVal = item.countKey ? stats[item.countKey] : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!collapsed && badgeVal > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeKey === 'activePopups'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.badgeKey === 'activePopups' ? '★ Popup' : badgeVal}
                      </span>
                    )}

                    {!collapsed && countVal !== null && countVal !== undefined && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-800/50'
                        }`}
                      >
                        {countVal}
                      </span>
                    )}

                    {collapsed && badgeVal > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B1528]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION C — FIXED FOOTER */}
      <div className="sidebar-footer p-3 border-t border-slate-800/80 space-y-1 shrink-0 bg-slate-950/40 mt-auto">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Public Website' : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <ExternalLink size={15} className="shrink-0 text-slate-500" />
          {!collapsed && <span className="truncate">Public Website</span>}
        </a>

        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
        >
          <LogOut size={16} className="shrink-0 text-rose-400" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Fixed to Full Viewport Height (100dvh) */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 h-screen h-[100dvh] bg-[#0B1528] text-slate-300 select-none border-r border-slate-800/80 z-30 transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[250px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[280px] max-w-[85vw] h-screen h-[100dvh] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
