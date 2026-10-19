import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Coins, Landmark, TrendingUp } from 'lucide-react';
import type { Language, TimelineEvent, UIStrings } from '../../types/monitor.types';

interface TimelineSectionProps {
  events: TimelineEvent[];
  category: string;
  search: string;
  language: Language;
  ui: UIStrings;
}

function iconFor(name: string) {
  const icons = {
    activity: TrendingUp,
    bank: Landmark,
    prices: Coins,
    employment: BriefcaseBusiness,
    survey: BarChart3,
  } as const;
  const Icon = icons[name as keyof typeof icons] ?? CalendarDays;
  return <Icon size={14} strokeWidth={1.7} />;
}

export function TimelineSection({ events, category, search, language, ui }: TimelineSectionProps) {
  const normalizedSearch = search.trim().toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en');
  const visibleEvents = events.filter((event) => {
    const matchesCategory = category === 'vision-general' || event.category === category;
    const matchesSearch = !normalizedSearch || [event.indicator, event.indicatorEn, event.source, event.period, event.periodEn]
      .some((value) => value.toLocaleLowerCase(language === 'es' ? 'es-CL' : 'en').includes(normalizedSearch));
    return matchesCategory && matchesSearch;
  });
  const published = visibleEvents.filter((event) => event.status === 'published');
  const upcoming = visibleEvents.filter((event) => event.status === 'upcoming');

  return (
    <section className="section-block timeline-section" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{ui.recentRelease} <span className="heading-separator">/</span> {ui.upcomingRelease}</p>
          <h2 id="timeline-heading">{ui.timelineTitle}</h2>
        </div>
        <a className="text-link" href="#timeline-upcoming">{ui.calendar}<ArrowRight size={14} /></a>
      </div>

      {visibleEvents.length ? (
        <div className="timeline-card">
          {published.length ? <TimelineGroup events={published} status="published" language={language} ui={ui} /> : null}
          {upcoming.length ? <TimelineGroup events={upcoming} status="upcoming" language={language} ui={ui} /> : null}
        </div>
      ) : <div className="empty-state empty-state--timeline">{search.trim() ? ui.noSearchResults : ui.noTimelineResults}</div>}
    </section>
  );
}

function TimelineGroup({ events, status, language, ui }: { events: TimelineEvent[]; status: 'published' | 'upcoming'; language: Language; ui: UIStrings }) {
  return (
    <div className={`timeline-group timeline-group--${status}`} id={status === 'upcoming' ? 'timeline-upcoming' : undefined}>
      <div className="timeline-group-label">{status === 'published' ? ui.released : ui.upcoming}</div>
      <ol className="timeline-list">
        {events.map((event) => (
          <li className={`timeline-item timeline-item--${event.tone}`} key={event.id}>
            <span className={`timeline-node ${status === 'upcoming' ? 'timeline-node--open' : ''}`} aria-hidden="true" />
            <time className="timeline-date" dateTime={event.date}>{language === 'en' ? event.dateTextEn : event.dateText}</time>
            <span className="timeline-icon" aria-hidden="true">{iconFor(event.icon)}</span>
            <div className="timeline-copy">
              <div className="timeline-title-row">
                <span className="timeline-name">{language === 'en' ? event.indicatorEn : event.indicator}</span>
                <span className="period-tag">{language === 'en' ? event.periodEn : event.period}</span>
              </div>
              {status === 'upcoming' ? <span className="timeline-meta">{ui.upcomingRelease}</span> : null}
            </div>
            <div className="timeline-value">
              {event.value ? <span className={`timeline-number tone-${event.tone}`}>{event.value}</span> : null}
              <span className="source-tag">{event.source}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
