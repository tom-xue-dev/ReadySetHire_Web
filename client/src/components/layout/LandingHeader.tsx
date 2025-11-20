import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../contexts/I18nContext";
import logo from "../../assets/logo_transparent.png";

export default function LandingHeader() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <nav className="flex items-center justify-between py-4" aria-label="Global">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src={logo} style={{ height: 36, width: 'auto' }} className="block object-contain" />
            <span className="sr-only">{t('landing.header.brand')}</span>
          </button>

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
        </nav>
      </div>
    </header>
  );
}



