import { useI18n } from '../../contexts/I18nContext';
import { LanguageSwitcher } from '../../contexts/I18nContext';

export default function Settings() {
  const { t, language } = useI18n();

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t('settings.title')}</h1>
        <p style={subtitleStyle}>{t('settings.subtitle')}</p>
      </div>

      <div style={contentStyle}>
        {/* 语言设置区域 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>{t('settings.language.title')}</h2>
            <p style={sectionDescriptionStyle}>{t('settings.language.description')}</p>
          </div>
          
          <div style={languageSectionStyle}>
            <div style={currentLanguageStyle}>
              <span style={currentLanguageLabelStyle}>{t('settings.language.current')}:</span>
              <span style={currentLanguageValueStyle}>
                {language === 'en' ? 'English' : '中文'}
              </span>
            </div>
            
            <div style={languageSwitcherContainerStyle}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* 其他设置区域 - 为将来扩展预留 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>{t('settings.appearance.title')}</h2>
            <p style={sectionDescriptionStyle}>{t('settings.appearance.description')}</p>
          </div>
          
          <div style={comingSoonStyle}>
            <span style={comingSoonTextStyle}>{t('settings.comingSoon')}</span>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>{t('settings.notifications.title')}</h2>
            <p style={sectionDescriptionStyle}>{t('settings.notifications.description')}</p>
          </div>
          
          <div style={comingSoonStyle}>
            <span style={comingSoonTextStyle}>{t('settings.comingSoon')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 样式定义
const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#ffffff',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '32px',
  paddingBottom: '16px',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 8px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0',
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 8px 0',
};

const sectionDescriptionStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const languageSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const currentLanguageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const currentLanguageLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
};

const currentLanguageValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#111827',
};

const languageSwitcherContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px',
};

const comingSoonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '2px dashed #d1d5db',
};

const comingSoonTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#9ca3af',
  fontStyle: 'italic',
};
