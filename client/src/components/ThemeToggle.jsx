import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

/**
 * Light / dark switch for the header. The button reflects the *effective*
 * theme, so it always offers the opposite of what the user currently sees.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={t('shell.theme.toggle')}
      aria-label={t('shell.theme.toggle')}
      aria-pressed={isDark}
      className={`p-2 text-gray-500 hover:text-brand-text rounded-full hover:bg-primary-soft transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
