import { ArrowUpRight, BarChart3 } from 'lucide-react';
import type { AppMetadata, Language, UIStrings } from '../../types/monitor.types';

interface FooterProps {
  metadata: AppMetadata;
  ui: UIStrings;
  language: Language;
}

export function Footer({ metadata, ui, language }: FooterProps) {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-grid page-shell">
        <div className="footer-about">
          <a className="brand footer-brand" href="#monitor-top">
            <span className="brand-mark" aria-hidden="true"><BarChart3 size={18} strokeWidth={2.4} /></span>
            <span className="brand-name">{metadata.projectName}</span>
          </a>
          <h2>{ui.footerAboutTitle}</h2>
          <p>{ui.footerAbout}</p>
        </div>

        <div className="footer-column">
          <h2>{ui.footerSourcesTitle}</h2>
          <ul className="footer-links">
            {Object.entries(metadata.sources).map(([id, source]) => (
              <li key={id}><a href={source.url} target="_blank" rel="noreferrer">{language === 'en' ? source.displayNameEn : source.displayName}<ArrowUpRight size={12} /></a></li>
            ))}
          </ul>
        </div>

        <div className="footer-column footer-method">
          <h2>{ui.footerMethodTitle}</h2>
          <p>{ui.footerMethod}</p>
          <a href="#filters" className="footer-inline-link">{ui.footerLinksTitle}<ArrowUpRight size={12} /></a>
        </div>
      </div>
      <div className="footer-bottom page-shell">
        <span>© {metadata.projectName} · {metadata.updatedAt.slice(0, 4)}</span>
        <span>{ui.footerCredits}</span>
        <span className="footer-demo">{ui.demoTag}</span>
      </div>
    </footer>
  );
}
