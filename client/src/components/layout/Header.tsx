import { UserCircleIcon, Cog6ToothIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo_transparent.png';
import { useAuth } from '@/pages/auth/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggle: () => void;
}

export default function Header({ sidebarOpen = false, onToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleSettings = () => {
    navigate('/settings');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm(t('common.confirmLogout'))) {
      logout();
    }
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Expose header height as CSS variable so sticky sub-headers can offset correctly
  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = headerRef.current;
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--app-header-height', `${h}px`);
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);
  
  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-md p-[16px]">
      {/* Static toggle button, above sidebar */}
      <button
        onClick={onToggle}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[100] p-2 bg-transparent border-0 text-slate-700 cursor-pointer rounded-xl hover:bg-slate-100 focus:outline-none"
        aria-label="Toggle sidebar"
        title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
      >
        <Bars3Icon width={24} height={24} />
      </button>
      <div className="max-w-full mx-auto px-5 flex justify-between items-center">
        <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-[45px]'}`}>
          <button onClick={() => navigate('/')} style={brandTitleStyle}>
            <img src={logo} style={{ height: 40, width: 'auto' }} className="block object-contain" />
          </button>
        </div>
        <span style={{marginLeft:"auto",marginRight: "20px", color: '#374151'}}>
          {t('common.welcome')}, {user?.firstName || user?.username}
        </span>
        <div style={navItemsStyle}>
          {/* dropdown menu */}
          <div ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className = "flex items-center gap-2 p-2 bg-transparent border-0 text-white cursor-pointer text-left"
              title={t('common.welcome')}
            >
            <UserCircleIcon width={24} height={24} style={{ color: '#374151' }} />
            </button>
            
            {isDropdownOpen && (
              <div style={dropdownMenuStyle}>
                <div style={dropdownHeaderStyle}>
                  <div style={userInfoStyle}>
                    <span style={userRoleStyle}>
                      ({user?.role})
                    </span>
                  </div>
                </div>
                <div style={dropdownDividerStyle}></div>
                <button
                  onClick={handleSettings}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Cog6ToothIcon width={16} height={16} style={{ marginRight: '8px' }} />
                  {t('common.settings')}
                </button>
                <button
                  onClick={handleLogout}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}





const brandTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
  color: '#111827',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navItemsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
};


const userRoleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  textTransform: 'uppercase',
};








const dropdownMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  minWidth: '200px',
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  zIndex: 50,
  overflow: 'hidden',
};


const dropdownHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};


const dropdownDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#e5e7eb',
};


const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'transparent',
  color: '#374151',
  border: 'none',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};
