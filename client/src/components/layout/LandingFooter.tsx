import { useI18n } from "../../contexts/I18nContext";

export default function LandingFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.company')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#about" className="hover:text-gray-900">{t('landing.footer.links.about')}</a></li>
              <li><a href="#contact" className="hover:text-gray-900">{t('landing.footer.links.contact')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.resources')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#docs" className="hover:text-gray-900">{t('landing.footer.links.docs')}</a></li>
              <li><a href="#api" className="hover:text-gray-900">{t('landing.footer.links.api')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#privacy" className="hover:text-gray-900">{t('landing.footer.links.privacy')}</a></li>
              <li><a href="#terms" className="hover:text-gray-900">{t('landing.footer.links.terms')}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center text-sm text-gray-500">
          {t('common.copyright')}
        </div>
      </div>
    </footer>
  );
}



