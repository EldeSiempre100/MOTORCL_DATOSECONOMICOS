import { BarChart3, ChevronDown, Moon, Search, Sun, X } from 'lucide-react';
import type { AppMetadata, Language, UIStrings } from '../../types/monitor.types';

interface TopNavbarProps {
  metadata: AppMetadata;
  ui: UIStrings;
  language: Language;
  dark: boolean;
  search: string;
  onSearch: (value: string) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onShowDelayed: () => void;
  resultCount: number;
}

export function TopNavbar({
  metadata,
  ui,
  language,
  dark,
  search,
  onSearch,
  onToggleLanguage,
  onToggleTheme,
  onShowDelayed,
  resultCount,
}: TopNavbarProps) {
  const countLabel = metadata.delayedSeriesCount === 1 ? 'serie' : ui.delayedPrefix;

  return (
    <header className="site-header" id="monitor-top">
      <div className="topbar page-shell">
        <a className="brand" href="#monitor-top" aria-label={metadata.projectName}>
          <span className="brand-mark" aria-hidden="true"><BarChart3 size={19} strokeWidth={2.4} /></span>
          <span className="brand-name">{metadata.projectName}</span>
        </a>

        <div className="search-wrap">
          <Search className="search-icon" size={15} aria-hidden="true" />
          <input
            aria-label={ui.searchLabel}
            placeholder={ui.searchPlaceholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          {search ? (
            <button className="search-clear icon-button" type="button" aria-label={ui.clearSearch} onClick={() => onSearch('')}>
              <X size={14} />
            </button>
          ) : null}
          {search.trim() ? <span className="search-count">{resultCount} {ui.results}</span> : null}
        </div>

        <div className="header-actions">
          {metadata.delayedSeriesCount > 0 ? <button className="delayed-link" type="button" onClick={onShowDelayed}>
            <span className="status-dot status-dot--delayed" />
            <span>{metadata.delayedSeriesCount} {countLabel}</span>
          </button> : null}
          <nav className="main-nav" aria-label={ui.footerLinksTitle}>
            <a className="nav-link nav-link--active" href="#monitor-top">{ui.navMonitor}</a>
            <a className="nav-link" href="#series">{ui.navData}</a>
            <a className="nav-link" href="#contact">{ui.navContact}</a>
          </nav>
          <button className="language-toggle" type="button" onClick={onToggleLanguage} aria-label={ui.languageLabel} title={ui.languageLabel}>
            {language === 'es' ? 'ES' : 'EN'} <ChevronDown size={12} />
          </button>
          <button className="icon-button theme-toggle" type="button" onClick={onToggleTheme} aria-label={dark ? ui.themeToLight : ui.themeToDark} title={dark ? ui.themeToLight : ui.themeToDark}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
      <div className="header-rule" />
    </header>
  );
}
