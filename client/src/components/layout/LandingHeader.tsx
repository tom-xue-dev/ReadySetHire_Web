import { Link, useNavigate } from "react-router-dom";
import { UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from "../../contexts/I18nContext";
import { useAuth } from "../../pages/auth/AuthContext";
import logo from "../../assets/logo_transparent.png";

interface LandingHeaderProps {
  showNavLinks?: boolean;
}

export default function LandingHeader({ showNavLinks = true }: LandingHeaderProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (user?.role === 'EMPLOYEE') {
      navigate('/tracking-jobs');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm(t('common.confirmLogout'))) {
      logout();
      navigate('/');
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

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <nav className="flex items-center justify-between py-4" aria-label="Global">
          <button onClick={handleLogoClick} className="flex items-center gap-2">
            <img src={logo} style={{ height: 36, width: 'auto' }} className="block object-contain" />
            <span className="sr-only">{t('landing.header.brand')}</span>
          </button>

          {/* Navigation links - only show on home page */}
          {showNavLinks && (
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {t('landing.header.nav.features')}
              </a>
              <a href="#how" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {t('landing.header.nav.howItWorks')}
              </a>
              <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {t('landing.header.nav.contact')}
              </a>
            </div>
          )}

          {/* Right side - show different content based on auth status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {t('common.welcome')}, {user?.firstName || user?.username}
              </span>
              
              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={t('common.welcome')}
                >
                  <UserCircleIcon width={24} height={24} className="text-gray-700" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <span className="text-xs text-gray-500 uppercase">
                        ({user?.role})
                      </span>
                    </div>
                    <button
                      onClick={handleSettings}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Cog6ToothIcon width={16} height={16} />
                      {t('common.settings')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-gray-900">
                {t('landing.header.cta.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {t('landing.header.cta.register')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}



