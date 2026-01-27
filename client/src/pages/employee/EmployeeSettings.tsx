import { useI18n, LanguageSwitcher } from '@/contexts/I18nContext';
import { Cog6ToothIcon, GlobeAltIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';

export default function EmployeeSettings() {
  const { t, language } = useI18n();

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      {/* Top background decoration - same as RateResume and TrackingJobs */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Cog6ToothIcon className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
              </div>
              <p className="text-white/90 text-lg">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* 语言设置卡片 */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <GlobeAltIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('settings.language.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('settings.language.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {t('settings.language.current')}:
                    </span>
                    <span className="ml-2 text-sm font-semibold text-gray-900">
                      {language === 'en' ? 'English' : '中文'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center p-6 border border-gray-200 rounded-lg bg-white">
                  <LanguageSwitcher />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 {language === 'en' 
                      ? 'Your language preference will be saved and applied across the application.' 
                      : '您的语言偏好将被保存并应用于整个应用程序。'}
                  </p>
                </div>
              </div>
            </Card>

            {/* 账户设置卡片 */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Account Settings' : '账户设置'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {language === 'en' 
                      ? 'Manage your account information and preferences' 
                      : '管理您的账户信息和偏好设置'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 italic">
                  {t('settings.comingSoon')}
                </p>
              </div>
            </Card>

            {/* 通知设置卡片 */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BellIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('settings.notifications.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('settings.notifications.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 italic">
                  {t('settings.comingSoon')}
                </p>
              </div>
            </Card>

            {/* 外观设置卡片 */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Cog6ToothIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('settings.appearance.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('settings.appearance.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 italic">
                  {t('settings.comingSoon')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
