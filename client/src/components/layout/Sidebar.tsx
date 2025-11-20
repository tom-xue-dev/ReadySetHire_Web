import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { Bars3Icon } from '@heroicons/react/24/solid';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Collapsible, fixed sidebar; toggle button lives in Header
export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const menuItems = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: '📊' },
    { path: '/jobs', label: t('navigation.jobs'), icon: '💼' },
    { path: '/interviews', label: t('navigation.interviews'), icon: '🎯' },
    { path: '/applicants', label: t('navigation.applicants'), icon: '👥' },
    { path: '/resume-management', label: t('navigation.resumeManagement'), icon: '📄' },
    { path: '/subscription', label: t('navigation.subscription'), icon: '💳' },
    // { path: '/questions', label: t('navigation.questions'), icon: '❓' },
     
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isOpen ? '280px' : '70px',
          backgroundColor: '#ffffff',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <div className="p-[16px] flex items-center gap-3">
          <button
            onClick={onToggle}
            className="bg-transparent border-0 text-slate-700 cursor-pointer p-[10px] rounded-xl flex items-center justify-center hover:bg-slate-100"
            title={isOpen ? t('common.closeMenu') : t('common.openMenu')}
          >
            <Bars3Icon width={20} height={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px' }}>
          <ul style={{ listStyle: 'none', margin: '5px', padding: 0 }}>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-1">
                <button
                  onClick={() => {
                    navigate(item.path);
                    onToggle();
                  }}
                  className={`w-full p-[12px] bg-transparent border-0 cursor-pointer text-left flex items-center ${
                    isOpen ? 'justify-start gap-[12px]' : 'justify-center'
                  } text-[14px] transition-colors duration-200 rounded-xl ${
                    isActive(item.path)
                      ? 'bg-[#635bff]/10 text-[#635bff]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[16px]">{item.icon}</span>
                  {isOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

