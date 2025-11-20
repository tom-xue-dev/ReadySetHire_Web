import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import LandingHeader from "@components/layout/LandingHeader";
import LandingFooter from "@components/layout/LandingFooter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader />

      <div className="relative isolate px-6 pt-14 lg:px-8 backdrop-blur flex-1">
        {/* Top background */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
          <div
            style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
            className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
          />
        </div>

        {/* Hero content */}
        <section className="mx-auto max-w-3xl py-24 sm:py-36 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              {isAuthenticated ? t('navigation.dashboard') : t('landing.hero.primaryCta')}
            </Link>
            <a href="#how" className="text-sm font-semibold leading-6 text-gray-900">
              {t('landing.hero.secondaryCta')} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl py-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center">
            {t('landing.features.title')}
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
              title: t('landing.features.items.ats.title'),
              desc: t('landing.features.items.ats.desc')
            }, {
              title: t('landing.features.items.resumeAI.title'),
              desc: t('landing.features.items.resumeAI.desc')
            }, {
              title: t('landing.features.items.voiceInterview.title'),
              desc: t('landing.features.items.voiceInterview.desc')
            }, {
              title: t('landing.features.items.analytics.title'),
              desc: t('landing.features.items.analytics.desc')
            }, {
              title: t('landing.features.items.collaboration.title'),
              desc: t('landing.features.items.collaboration.desc')
            }, {
              title: t('landing.features.items.multilingual.title'),
              desc: t('landing.features.items.multilingual.desc')
            }].map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow">
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl py-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center">
            {t('landing.howItWorks.title')}
          </h2>
          <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
              n: 1, title: t('landing.howItWorks.steps.one.title'), desc: t('landing.howItWorks.steps.one.desc')
            }, {
              n: 2, title: t('landing.howItWorks.steps.two.title'), desc: t('landing.howItWorks.steps.two.desc')
            }, {
              n: 3, title: t('landing.howItWorks.steps.three.title'), desc: t('landing.howItWorks.steps.three.desc')
            }, {
              n: 4, title: t('landing.howItWorks.steps.four.title'), desc: t('landing.howItWorks.steps.four.desc')
            }].map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                  {s.n}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Contact anchor (simple CTA) */}
        <section id="contact" className="mx-auto max-w-3xl py-12 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('landing.header.nav.contact')}</h2>
          <p className="mt-3 text-sm text-gray-600">{t('landing.ctaBottom.subtitle')}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {isAuthenticated ? t('navigation.dashboard') : t('landing.ctaBottom.primary')}
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="text-sm font-semibold text-gray-900">
                {t('landing.ctaBottom.secondary')} →
              </Link>
            )}
        </div>
        </section>

        {/* Bottom background */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-[80px] sm:top-[calc(100%-30rem)]">
          <div
            style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
            className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
          />
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
