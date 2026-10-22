import { Languages } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * Language switch. Each option is labelled in its own language so the
 * control stays readable for users who cannot read the current locale.
 *
 * `variant="dark"` is used on the always-dark sign-in screen.
 */
export default function LanguageSwitcher({ className = '', variant = 'light' }) {
  const { lang, setLang, locales, t } = useTranslation();
  const isDark = variant === 'dark';

  return (
    <label
      className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors cursor-pointer ${
        isDark
          ? 'text-slate-300 hover:text-white hover:bg-white/10'
          : 'text-gray-500 hover:text-brand-text hover:bg-primary-soft'
      } ${className}`}
      title={t('shell.language.label')}
    >
      <Languages className="w-5 h-5" aria-hidden="true" />
      <span className="sr-only">{t('shell.language.label')}</span>
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        aria-label={t('shell.language.label')}
        className={`appearance-none bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded cursor-pointer ${
          isDark ? 'text-slate-200' : 'text-gray-600'
        }`}
      >
        {locales.map((locale) => (
          <option key={locale.code} value={locale.code} className="bg-surface text-gray-900">
            {locale.label}
          </option>
        ))}
      </select>
    </label>
  );
}
