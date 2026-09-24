import { describe, expect, it } from 'vitest';
import { IndicatorData } from '../types';
import { formatReading, byArea } from '../experience/format';
import { buildActions, composeHeadline } from '../experience/guidance';
import { helpFor, relevance, HELP } from '../experience/help';
import { ADVICE } from '../experience/advice';

function ind(id: string, level: 'red' | 'amber' | 'green' | 'unknown', extra: Partial<IndicatorData> = {}): IndicatorData {
  return {
    id, name: id.replace(/_/g, ' '), domain: 'economy', description: 'Test signal. More text.', unit: '%',
    thresholds: { green: {}, amber: {}, red: {}, threshold_amber: 1, threshold_red: 2 },
    dataSource: 'Test', updateFrequency: 'Weekly', area: 'costs', tier: 'core',
    status: { level, value: 1.5, lastUpdate: new Date().toISOString(), dataSource: 'LIVE' },
    ...extra,
  } as IndicatorData;
}

describe('formatReading', () => {
  it.each([
    [4.478, '$/gal', '$4.48/gal'],
    [114.89, '$/bbl', '$115/bbl'],
    [3407, '$/FEU', '$3,407/FEU'],
    [2.75, '% y/y', '2.75% y/y'],
    [1719, 'K', '1,719K'],
    [197, 'K/week', '197K/week'],
    [2.53, 'ratio', '2.53'],
    [35, 'per 90d', '35 per 90d'],
  ])('%s %s → %s', (value, unit, expected) => {
    expect(formatReading(value, unit)).toBe(expected);
  });

  it('shows a dash for missing values', () => {
    expect(formatReading(null, '%')).toBe('—');
  });
});

describe('composeHeadline', () => {
  it('says all steady when nothing is elevated', () => {
    expect(composeHeadline([ind('a', 'green')]).headline).toBe('All steady this week.');
  });

  it('leads with the most severe area and names signals', () => {
    const out = composeHeadline([
      ind('oil_brent_price', 'red', { area: 'energy', name: 'Crude Oil Price' }),
      ind('energy_gas_price', 'amber', { area: 'costs', name: 'Gas Prices' }),
      ind('x', 'green'),
    ]);
    expect(out.headline).toBe('Energy prices are very high, and 1 other area is worth watching.');
    expect(out.summary).toContain('Crude oil price needs action.');
    expect(out.summary).toContain('The other 1 are steady.');
  });

  it('ignores stale and context-only readings', () => {
    const stale = ind('a', 'red', { status: { level: 'red', value: 1, lastUpdate: '', dataSource: 'STALE' } });
    expect(composeHeadline([stale, ind('b', 'green')]).headline).toBe('All steady this week.');
  });
});

describe('buildActions', () => {
  it('uses written advice for elevated signals, red first, max three', () => {
    const list = [
      ind('energy_gas_price', 'amber'),
      ind('oil_brent_price', 'red', { area: 'energy' }),
      ind('cyber_01_cisa_kev', 'amber', { area: 'safety' }),
      ind('fema_disaster_declarations', 'amber', { area: 'safety' }),
      ind('supply_02_freight_index', 'amber'),
    ];
    const actions = buildActions(list, {}, null);
    expect(actions).toHaveLength(3);
    expect(actions[0].indicators[0].id).toBe('oil_brent_price');
    expect(actions[0].title).toBe(ADVICE.oil_brent_price.whatToDo.red);
  });

  it('drops actions that do not apply to the household', () => {
    const actions = buildActions([ind('energy_gas_price', 'amber'), ind('housing_03_rate_shock', 'amber')], { drives: false, housing: 'rent' }, null);
    expect(actions).toHaveLength(0);
  });

  it('never lists watch-only advice as a to-do', () => {
    const actions = buildActions([ind('spr_01_level', 'amber', { area: 'energy' })], {}, null);
    expect(actions).toHaveLength(0);
  });

  it('prefers the published briefing and links its signals', () => {
    const briefing = {
      headline: 'h', summary: 's', watch: [],
      actions: [{ title: 'Do X', why: 'Because', urgency: 'this week' as const, effort: '5 minutes' as const, cost: 'free' as const, indicator_ids: ['job_01_jobless_claims'] }],
    };
    const [a] = buildActions([ind('job_01_jobless_claims', 'amber', { area: 'jobs' })], {}, briefing);
    expect(a.title).toBe('Do X');
    expect(a.meta).toBe('Takes 5 minutes. Free. Do it this week.');
    expect(a.help.map((h) => h.id)).toContain('ui');
  });
});

describe('help and relevance', () => {
  it('only shows WIC to households with kids', () => {
    expect(helpFor('econ_02_grocery_cpi', {}).map((h) => h.id)).not.toContain('wic');
    expect(helpFor('econ_02_grocery_cpi', { kids: true }).map((h) => h.id)).toContain('wic');
  });

  it('ranks by household situation', () => {
    expect(relevance('housing_04_rent_cpi', { housing: 'rent' })).toBe(2);
    expect(relevance('housing_04_rent_cpi', { housing: 'own' })).toBe(0);
    expect(relevance('energy_gas_price', {})).toBe(1);
  });

  it('every dollar figure has an official source', () => {
    for (const h of Object.values(HELP)) {
      if (h.money) expect(h.moneySource, h.id).toMatch(/^https:\/\//);
    }
  });
});

describe('byArea', () => {
  it('groups in display order and skips empty areas', () => {
    const groups = byArea([ind('a', 'green', { area: 'safety' }), ind('b', 'green', { area: 'costs' })]);
    expect(groups.map(([area]) => area)).toEqual(['costs', 'safety']);
  });
});
