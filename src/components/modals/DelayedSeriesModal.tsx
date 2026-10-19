import { AlertCircle, ArrowUpRight, X } from 'lucide-react';
import { useEffect } from 'react';
import type { AppMetadata, Language, UIStrings } from '../../types/monitor.types';

interface DelayedSeriesModalProps {
  metadata: AppMetadata;
  ui: UIStrings;
  language: Language;
  onClose: () => void;
}

export function DelayedSeriesModal({ metadata, ui, language, onClose }: DelayedSeriesModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="delayed-modal" role="dialog" aria-modal="true" aria-labelledby="delayed-title">
        <div className="modal-heading">
          <span className="modal-icon"><AlertCircle size={18} /></span>
          <div>
            <p className="eyebrow">{metadata.delayedSeriesCount} {ui.delayedPrefix}</p>
            <h2 id="delayed-title">{ui.delayedTitle}</h2>
          </div>
          <button className="icon-button modal-close" type="button" aria-label={ui.close} onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-intro">{ui.delayedIntro}</p>
        <div className="delayed-list">
          {metadata.delayedSeries.map((series) => (
            <article className="delayed-item" key={series.id}>
              <div className="delayed-item-main">
                <h3>{language === 'en' ? series.nameEn : series.name}</h3>
                <span>{series.source} <span className="meta-divider">·</span> {series.lastUpdate}</span>
              </div>
              <div className="delayed-item-side">
                <span className="delayed-reason">{language === 'en' ? series.reasonEn : series.reason}</span>
                {metadata.sources[series.source] ? <a href={metadata.sources[series.source].url} target="_blank" rel="noreferrer" aria-label={`${ui.download}: ${series.source}`}><ArrowUpRight size={14} /></a> : null}
              </div>
            </article>
          ))}
        </div>
        <div className="modal-footnote"><span className="status-dot status-dot--delayed" />{metadata.demoNotice[language]}</div>
      </section>
    </div>
  );
}
