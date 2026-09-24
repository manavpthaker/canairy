import { describe, expect, it } from 'vitest';
import { localCompare, localValue } from '../experience/localFormat';
import { localActions } from '../experience/guidance';
import { LocalData, LocalSignal } from '../experience/useLocal';

const sig = (s: Partial<LocalSignal>): LocalSignal =>
  ({ metric: 'gas', name: 'Gas prices', where: 'New Jersey', value: 3.2, level: 'green', as_of: '2026-09-15', ...s }) as LocalSignal;

const data = (signals: LocalSignal[]): LocalData => ({ fips: '34017', county: 'Hudson County', state: 'NJ', place: 'Hudson County, NJ', signals });

describe('localValue', () => {
  it('says readings in words', () => {
    expect(localValue(sig({ metric: 'gas', value: 3.199 }))).toBe('$3.20/gal');
    expect(localValue(sig({ metric: 'fema', value: 1 }))).toBe('1 declaration in the last 90 days');
    expect(localValue(sig({ metric: 'grocery', value: 2.34 }))).toBe('+2.3% from a year ago');
    expect(localValue(sig({ metric: 'drought', value: 0, any_drought_pct: 0 }))).toBe('No drought');
    expect(localValue(sig({ metric: 'drought', value: 62.4, any_drought_pct: 100 }))).toBe('62% of the county in severe drought or worse');
  });

  it('compares with the country only when there is a national figure', () => {
    expect(localCompare(sig({ metric: 'gas', national: { value: 3.05 } }))).toBe('US average: $3.05.');
    expect(localCompare(sig({ metric: 'unemployment', value: 5, rise_from_12mo_low: 0.4, national: { value: 4.3 } })))
      .toBe('US: 4.3%. Up 0.4 points from its low this past year.');
    expect(localCompare(sig({ metric: 'fema' }))).toBeNull();
  });
});

describe('localActions', () => {
  it('turns red local readings into actions with help links', () => {
    const actions = localActions(data([
      sig({ metric: 'fema', level: 'red', individual_assistance: true, where: 'Hudson County', disasters: [] }),
      sig({ metric: 'grocery', level: 'red', value: 6.4, where: 'the Northeast' }),
      sig({ metric: 'gas', level: 'amber' }),
    ]));
    expect(actions.map((a) => a.id)).toEqual(['l-fema', 'l-grocery']);
    expect(actions[0].help.map((h) => h.id)).toContain('fema');
    expect(actions[1].why).toBe('Grocery prices in the Northeast are 6.4% higher than a year ago.');
  });

  it('ignores FEMA declarations without help for individuals', () => {
    expect(localActions(data([sig({ metric: 'fema', level: 'red', individual_assistance: false })]))).toEqual([]);
    expect(localActions(null)).toEqual([]);
  });
});
