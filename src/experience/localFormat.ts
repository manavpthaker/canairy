import { LocalSignal } from './useLocal';

const pct = (n: number, digits = 1) => `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;
const cents = (n: number) => `${n.toFixed(1)}¢ per kWh`;

/** The reading, in words a person would say. */
export function localValue(s: LocalSignal): string {
  switch (s.metric) {
    case 'fema':
      return `${s.value} declaration${s.value === 1 ? '' : 's'} in the last 90 days`;
    case 'wastewater':
      return `${s.category}${s.pathogen && s.level !== 'green' ? ` (${s.pathogen})` : ''}`;
    case 'drought':
      if (!s.any_drought_pct) return 'No drought';
      if (s.value > 0) return `${Math.round(s.value)}% of the county in severe drought or worse`;
      return `${Math.round(s.any_drought_pct)}% of the county abnormally dry or in drought`;
    case 'unemployment':
      return `${s.value.toFixed(1)}%`;
    case 'gas':
      return `$${s.value.toFixed(2)}/gal`;
    case 'electricity':
      return `${cents(s.value)}, ${pct(s.change_pct ?? 0)} from a year ago`;
    case 'grocery':
      return `${pct(s.value)} from a year ago`;
  }
}

/** Comparison with the country, where one exists. */
export function localCompare(s: LocalSignal): string | null {
  const n = s.national;
  if (!n) return null;
  switch (s.metric) {
    case 'unemployment': {
      const rise = s.rise_from_12mo_low ?? 0;
      const trend = rise >= 0.3 ? ` Up ${rise.toFixed(1)} points from its low this past year.` : '';
      return `US: ${n.value.toFixed(1)}%.${trend}`;
    }
    case 'gas':
      return `US average: $${n.value.toFixed(2)}.`;
    case 'electricity':
      return `US: ${cents(n.value)}, ${pct(n.change_pct ?? 0)}.`;
    case 'grocery':
      return `US: ${pct(n.value)}.`;
    default:
      return null;
  }
}

export const LOCAL_SOURCE: Record<LocalSignal['metric'], { name: string; url: string }> = {
  fema: { name: 'FEMA', url: 'https://www.fema.gov/disaster/declarations' },
  wastewater: { name: 'CDC wastewater surveillance', url: 'https://www.cdc.gov/nwss/rv/index.html' },
  drought: { name: 'U.S. Drought Monitor', url: 'https://droughtmonitor.unl.edu/' },
  unemployment: { name: 'BLS (via FRED)', url: 'https://fred.stlouisfed.org/categories/27281' },
  gas: { name: 'EIA', url: 'https://www.eia.gov/petroleum/gasdiesel/' },
  electricity: { name: 'EIA', url: 'https://www.eia.gov/electricity/monthly/' },
  grocery: { name: 'BLS CPI (via FRED)', url: 'https://www.bls.gov/cpi/regional-resources.htm' },
};
