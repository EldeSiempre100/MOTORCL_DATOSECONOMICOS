import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BarChart3, ChevronDown, Moon, Search, Sun, X } from 'lucide-react';
import type { AppMetadata, ChartDefinition, Language, SummaryCard, UIStrings } from '../../types/monitor.types';

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
  cards?: SummaryCard[];
  charts?: ChartDefinition[];
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
  cards = [],
}: TopNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const countLabel = metadata.delayedSeriesCount === 1 ? 'serie' : ui.delayedPrefix;

  // Track scroll for sticky backdrop blur
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
      } else if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Search quick matches for the dropdown
  const quickMatches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
    if (!term) return [];
    const results: Array<{
      id: string;
      title: string;
      category: string;
      value: string;
      tone: string;
      seriesId?: string;
      dataStatus?: string;
    }> = [];

    cards.forEach((card) => {
      const cardTitle = language === 'en' ? card.titleEn : card.title;
      const mainName = language === 'en' ? card.main.nameEn : card.main.name;
      const val = card.main.valuesByVariation.mensual.ultimo;

      if ([cardTitle, mainName, card.category].join(' ').toLocaleLowerCase().includes(term)) {
        results.push({
          id: card.id,
          title: `${cardTitle} — ${mainName}`,
          category: card.category,
          value: val.value,
          tone: val.tone,
          seriesId: card.seriesId,
          dataStatus: card.dataStatus,
        });
      }

      card.subIndicators.forEach((sub) => {
        const subName = language === 'en' ? sub.nameEn : sub.name;
        if (subName.toLocaleLowerCase().includes(term)) {
          results.push({
            id: `${card.id}-${sub.name}`,
            title: `${subName} (${cardTitle})`,
            category: card.category,
            value: sub.values.mensual,
            tone: sub.toneByVariation.mensual,
            seriesId: sub.seriesId,
            dataStatus: card.dataStatus,
          });
        }
      });
    });

    return results.slice(0, 7);
  }, [cards, language, search]);

  return (
    <header className="site-header" id="monitor-top" data-scrolled={scrolled}>
      <div className="topbar page-shell">
        <a className="brand" href="/" aria-label={metadata.projectName}>
          <span className="brand-mark" aria-hidden="true">
            <BarChart3 size={19} strokeWidth={2.4} />
          </span>
          <span className="brand-name">{metadata.projectName}</span>
        </a>

        <div className="search-wrap" ref={searchWrapRef}>
          <Search className="search-icon" size={15} aria-hidden="true" />
          <input
            ref={inputRef}
            aria-label={ui.searchLabel}
            placeholder={ui.searchPlaceholder}
            value={search}
            onFocus={() => setDropdownOpen(true)}
            onChange={(event) => {
              onSearch(event.target.value);
              setDropdownOpen(true);
            }}
          />
          {search ? (
            <button
              className="search-clear icon-button"
              type="button"
              aria-label={ui.clearSearch}
              onClick={() => {
                onSearch('');
                setDropdownOpen(false);
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="search-kbd" title="Presiona Ctrl+K para buscar">Ctrl+K</kbd>
          )}

          {dropdownOpen && quickMatches.length > 0 ? (
            <div className="search-results-dropdown" role="listbox">
              <div className="search-results-header">
                <span>{language === 'en' ? 'Quick suggestions' : 'Resultados rápidos'}</span>
                <span>{resultCount} {ui.results}</span>
              </div>
              {quickMatches.map((item) => (
                <a
                  key={item.id}
                  className="search-result-item"
                  href={item.seriesId ? `/indicador/${item.seriesId}` : `#card-${item.category}`}
                  onClick={() => {
                    setDropdownOpen(false);
                  }}
                >
                  <div className="search-result-item-main">
                    <span className="search-result-name">{item.title}</span>
                    <span className="search-result-sub">
                      <span className={`status-dot status-dot--${item.dataStatus === 'official' ? 'green' : 'gray'}`} />
                      {item.dataStatus === 'official' ? 'INE · Oficial' : (item.dataStatus === 'sourced' ? 'Mindicador · fuente externa' : '')}
                    </span>
                  </div>
                  <div className="search-result-side">
                    <strong className={`search-result-val tone-${item.tone}`}>{item.value}</strong>
                    <ArrowUpRight size={13} className="search-result-arrow" />
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          {metadata.delayedSeriesCount > 0 ? (
            <button className="delayed-link" type="button" onClick={onShowDelayed}>
              <span className="status-dot status-dot--delayed" />
              <span>{metadata.delayedSeriesCount} {countLabel}</span>
            </button>
          ) : null}

          <div className="official-status-pill" title="Fuente oficial conectada con SIMEL">
            <span className="status-dot status-dot--green" />
            <span className="status-pill-text">INE · SIMEL</span>
          </div>

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
