import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RuleChange, useRules } from './useLocal';

const date = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export function RuleItem({ rule }: { rule: RuleChange }) {
  return (
    <li className="cn-action" style={{ gridTemplateColumns: '1fr' }}>
      <p className="cn-note" style={{ margin: 0 }}>
        {rule.programs.join(', ')}. {rule.type === 'proposed' ? 'Proposed' : 'Final'} rule, {date(rule.published)}.
      </p>
      <h3>{rule.summary ?? rule.title}</h3>
      {rule.summary && <p className="cn-note" style={{ marginTop: '0.35rem' }}>{rule.title}</p>}
      <div className="meta" style={{ gridColumn: 1 }}>
        {rule.open_for_comment && rule.comments_close && (
          <><strong style={{ color: 'var(--ink)' }}>Open for public comment until {date(rule.comments_close)}.</strong>{' '}</>
        )}
        {rule.type === 'final' && rule.effective && <>Takes effect {date(rule.effective)}. </>}
        {rule.agency}.{' '}
        <a href={rule.url} target="_blank" rel="noopener noreferrer">
          {rule.open_for_comment ? 'Read it and comment' : 'Read the rule'}<span className="sr-only"> (opens a new tab)</span>
        </a>
      </div>
    </li>
  );
}

/** Rules that change what families get, for the Today page. */
export function ChangesPreview({ limit = 3 }: { limit?: number }) {
  const rules = useRules(120);
  if (!rules) return null;
  const relevant = rules.filter((r) => r.affects_families);
  if (relevant.length === 0) return null;
  // Open comment periods first: that's where a family can still weigh in.
  const shown = [...relevant].sort((a, b) => Number(b.open_for_comment) - Number(a.open_for_comment)).slice(0, limit);
  return (
    <>
      <h2 className="cn-h2">Changes to benefits</h2>
      <p className="cn-sub">
        Federal rules from the last four months that change eligibility, amounts or how to apply.{' '}
        <Link to="/changes">See all {relevant.length}</Link>.
      </p>
      <ul className="cn-actions">{shown.map((r) => <RuleItem key={r.id} rule={r} />)}</ul>
    </>
  );
}

export function Changes() {
  const rules = useRules(180);
  const [showAll, setShowAll] = useState(false);
  const list = (rules ?? []).filter((r) => showAll || r.affects_families);
  const technical = (rules ?? []).filter((r) => !r.affects_families).length;

  return (
    <div className="cn-column" style={{ maxWidth: '44rem' }}>
      <h1 className="cn-headline">Changes to benefits</h1>
      <p className="cn-lede">
        New federal rules for SNAP, WIC, school meals, Medicaid, marketplace coverage, unemployment, disability, housing,
        energy help, phone discounts, tax credits and student loans, in plain words.
      </p>
      <p className="cn-note">
        Checked daily from the Federal Register. Summaries are written by Claude, an AI model, from each rule’s own text
        and checked so they don’t add numbers or dates the rule doesn’t contain. Always read the rule or ask your
        caseworker before acting on it.
      </p>
      {rules === null ? (
        <p className="cn-note">Loading…</p>
      ) : (
        <>
          <ul className="cn-actions" style={{ marginTop: '1.5rem' }}>{list.map((r) => <RuleItem key={r.id} rule={r} />)}</ul>
          {technical > 0 && (
            <p style={{ marginTop: '1.5rem' }}>
              <button className="cn-link-button" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Hide technical changes' : `Also show ${technical} technical changes that don’t affect what families get`}
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
