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
  const orderedEvents = [
    ...visibleEvents.filter((event) => event.status === 'published'),
    ...visibleEvents.filter((event) => event.status === 'upcoming'),
  ];
  const firstUpcoming = orderedEvents.find((event) => event.status === 'upcoming')?.id;

  return (
    <section className="section-block timeline-section" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <div>
          <h2 id="timeline-heading">{ui.timelineTitle}</h2>
        </div>
        <a className="text-link" href="#timeline-upcoming">{ui.calendar}<ArrowRight size={14} /></a>
      </div>

      {visibleEvents.length ? (
        <div className="timeline-card">
          <ol className="timeline-track">
            {orderedEvents.map((event) => (
              <li className={`timeline-tile timeline-tile--${event.status}`} key={event.id} id={event.id === firstUpcoming ? 'timeline-upcoming' : undefined}>
                <time className="timeline-date" dateTime={event.date}>{language === 'en' ? event.dateTextEn : event.dateText}</time>
                <span className={`timeline-node ${event.status === 'upcoming' ? 'timeline-node--open' : ''}`} aria-hidden="true" />
                <div className="timeline-tile-title"><span className="timeline-icon" aria-hidden="true">{iconFor(event.icon)}</span><span>{language === 'en' ? event.indicatorEn : event.indicator}</span></div>
                {event.value ? <strong className={`timeline-number tone-${event.tone}`}>{event.value}</strong> : <span className="timeline-number timeline-number--empty">—</span>}
                <span className="timeline-tile-period">{language === 'en' ? event.periodEn : event.period}</span>
                <span className="timeline-tile-source">{event.source}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : <div className="empty-state empty-state--timeline">{search.trim() ? ui.noSearchResults : ui.noTimelineResults}</div>}
    </section>
  );
}
