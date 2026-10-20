import { ArrowRight, BriefcaseBusiness, ChartNoAxesColumnIncreasing, Coins, HeartPulse } from 'lucide-react';
import { CardSparkline } from './CardSparkline';
import type { AppMetadata, ChartDefinition, Language, PeriodId, SummaryCard, UIStrings, Variation } from '../../types/monitor.types';

interface SummaryCardsGridProps {
  cards: SummaryCard[];
  charts: ChartDefinition[];
  from: string;
  to: string;
  metadata: AppMetadata;
  language: Language;
  variation: Variation;
  period: PeriodId;
  category: string;
  search: string;
  ui: UIStrings;
  onChooseCategory: (category: string) => void;
}

function iconFor(name: string) {
  const icons = {
    activity: ChartNoAxesColumnIncreasing,
    prices: Coins,
    employment: BriefcaseBusiness,
    poverty: HeartPulse,
  } as const;
  const Icon = icons[name as keyof typeof icons] ?? ChartNoAxesColumnIncreasing;
  return <Icon size={16} strokeWidth={1.8} />;
}

function toneClass(tone: string) {
  return tone === 'positive' ? 'tone-positive' : tone === 'negative' ? 'tone-negative' : 'tone-neutral';
}

export function SummaryCardsGrid({ cards, charts, from, to, metadata, language, variation, period, category, search, ui, onChooseCategory }: SummaryCardsGridProps) {
  const normalizedSearch = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
  const visibleCards = cards.filter((card) => {
    const matchesCategory = category === 'vision-general' || card.category === category;
    const text = [card.title, card.titleEn, card.main.name, card.main.nameEn, ...card.subIndicators.flatMap((item) => [item.name, item.nameEn])]
      .join(' ')
      .toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
    return matchesCategory && (!normalizedSearch || text.includes(normalizedSearch));
  });

  return (
    <section className="section-block summary-section" aria-labelledby="summary-heading">
      <div className="section-heading section-heading--summary">
        <div>
          <p className="eyebrow">{ui.summaryKicker}</p>
          <h2 id="summary-heading">{ui.summaryTitle}</h2>
        </div>
        <span className="section-period"><span className="status-dot status-dot--green" />{ui.latestData} <span className="meta-divider">·</span> {metadata.latestCompleteMonth}</span>
      </div>

      {visibleCards.length ? (
        <div className="summary-grid">
          {visibleCards.map((card) => {
            const indicator = card.main.valuesByVariation[variation][period] ?? card.main.valuesByVariation[variation].ultimo;
            const matchingChart = charts.find((item) => item.category === card.category && (item.dataStatus ?? 'demo') === (card.dataStatus ?? 'demo') && (!card.seriesId || item.seriesId === card.seriesId));
            return (
              <article className="summary-card" key={card.id}>
                <button className="card-category" type="button" onClick={() => onChooseCategory(card.category)} aria-label={language === 'en' ? card.titleEn : card.title}>
                  <span className="category-icon">{iconFor(card.icon)}</span>
                  <span>{language === 'en' ? card.titleEn : card.title}</span>
                  <ArrowRight className="category-arrow" size={14} />
                </button>
                <span className={`data-origin data-origin--${card.dataStatus ?? 'demo'}`}>{card.dataStatus === 'official' ? 'INE · oficial' : language === 'en' ? 'Example' : 'Ejemplo'}</span>
                <div className="card-main-label">
                  <span className="main-name">{language === 'en' ? card.main.nameEn : card.main.name}</span>
                  <span className="main-description">{language === 'en' ? card.main.descriptionEn : card.main.description}</span>
                </div>
                <div className="kpi-line">
                  <strong className={`kpi-value ${toneClass(indicator.tone)}`}>{indicator.value}</strong>
                  <span className={`diagnosis ${toneClass(indicator.tone)}`}>{language === 'en' ? indicator.diagnosisEn : indicator.diagnosis}</span>
                </div>
                <p className="kpi-context">{language === 'en' ? indicator.contextEn : indicator.context}</p>
                <CardSparkline chart={matchingChart} language={language} variation={variation} period={period} from={from} to={to} />

                <div className="card-divider" />
                <div className="sub-indicators">
                  {card.subIndicators.map((subIndicator) => (
                    <div className="sub-indicator" key={subIndicator.name}>
                      <span className="sub-name">{language === 'en' ? subIndicator.nameEn : subIndicator.name}</span>
                      <span className="sub-period">{language === 'en' ? subIndicator.periodEn : subIndicator.period}</span>
                      <span className={`sub-value ${toneClass(subIndicator.toneByVariation[variation])}`}>{subIndicator.values[variation]}</span>
                    </div>
                  ))}
                </div>

                <div className="card-sources">
                  <span>{ui.sources}:</span>
                  {card.sources.map((sourceId, index) => {
                    const source = metadata.sources[sourceId];
                    return (
                      <span className="source-link-wrap" key={sourceId}>
                        {index > 0 ? <span className="source-divider">·</span> : null}
                        {source && card.dataStatus === 'official' ? <a href={card.documentUrl ?? source.url} target="_blank" rel="noreferrer">{sourceId}<span aria-hidden="true"> ↗</span></a> : <span>{sourceId}</span>}
                      </span>
                    );
                  })}
                </div>
                {card.seriesId ? <a className="indicator-detail-link" href={`/indicador/${card.seriesId}`}>{language === 'en' ? 'View series and observations' : 'Ver ficha y observaciones'} <ArrowRight size={13} /></a> : null}
              </article>
            );
          })}
        </div>
      ) : <div className="empty-state">{search.trim() ? ui.noSearchResults : ui.noCategoryCards}</div>}
    </section>
  );
}
