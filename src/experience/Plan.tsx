import { useDone } from './household';
import { stepsFor, useStages, type StageArea } from './useStages';

function StageBadge({ stage, name }: { stage: number; name: string }) {
  return <span className={`cn-stage s${stage}`}>Stage {stage}: {name}</span>;
}

function AreaRow({ area }: { area: StageArea }) {
  return (
    <div className="cn-area">
      <div className="head">
        <span className="name">{area.name}</span>
        <StageBadge stage={area.stage} name={area.stageName} />
      </div>
      {area.why.map((w) => <p key={w}>{w}</p>)}
      {area.next[0] && <p className="next">Next: {area.next[0]}</p>}
      {area.down && <p className="next">{area.down}</p>}
    </div>
  );
}

/**
 * The household plan: where the household stands area by area (from the
 * readings), what to do at that stage, the no-regret list, and the rules for
 * moving up and down. Checklist progress is saved on this device only.
 */
export function Plan() {
  const { stages, plan, loaded } = useStages();
  const { done, toggle } = useDone('forever');

  if (!loaded) return <div className="cn-column"><p className="cn-note">Loading your plan…</p></div>;
  if (!plan) {
    return (
      <div className="cn-column">
        <h1 className="cn-headline">Your household plan</h1>
        <p className="cn-banner warn">The plan couldn't load. Check your connection and try again.</p>
      </div>
    );
  }

  const current = stages ? plan.ladder[Math.min(stages.overall.stage, 3)] : null;
  const elevated = stages ? stages.areas.filter((a) => a.stage >= 1).sort((a, b) => b.stage - a.stage) : [];
  const calm = stages ? stages.areas.filter((a) => a.stage === 0) : [];
  const steps = stages ? stepsFor(stages, plan) : [];
  const total = plan.noRegret.length;
  const complete = plan.noRegret.filter((t) => done.has(t.id)).length;

  return (
    <div className="cn-column" style={{ maxWidth: '44rem' }}>
      <h1 className="cn-headline">Your household plan</h1>
      <p className="cn-lede">
        Decide now, while things are calm, what moves you up a stage and what moves you down. Then follow the readings,
        not the mood of the news.
      </p>

      {stages && current ? (
        <section aria-labelledby="where" className="cn-panel">
          <h2 id="where" className="sr-only">Where things stand</h2>
          <div className="cn-stage-now">
            <span className="big">Stage {stages.overall.stage}: {stages.overall.name}</span>
            <span className="cn-note">{current.meaning}</span>
          </div>
          <p className="cn-note" style={{ marginTop: 0 }}>{stages.overall.why}</p>
          {elevated.map((a) => <AreaRow key={a.id} area={a} />)}
          {calm.length > 0 && (
            <p className="cn-note" style={{ marginBottom: 0 }}>
              At Baseline: {calm.map((a) => a.name.toLowerCase()).join(', ')}.
            </p>
          )}
        </section>
      ) : (
        <p className="cn-banner warn">Stages couldn't load, so this shows the plan without today's readings.</p>
      )}

      {stages && current && (
        <section aria-labelledby="now">
          <h2 id="now" className="cn-h2">What to do at Stage {current.stage}</h2>
          <dl className="cn-facts">
            <dt>Today</dt><dd>{current.today}</dd>
            <dt>This week</dt><dd>{current.week}</dd>
            <dt>This month</dt><dd>{current.month}</dd>
            <dt>Cost</dt><dd>{current.cost}</dd>
          </dl>
          {steps.map(({ area, steps: list }) => (
            <div key={area.id}>
              <h3 className="cn-area-title">{area.name}, Stage {area.stage}</h3>
              <ul className="cn-steps">{list.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="no-regret">
        <h2 id="no-regret" className="cn-h2">Start here: ten steps that help in any scenario</h2>
        <p className="cn-sub">
          {complete} of {total} done. Most of it is cheap, and some of it is money you move rather than spend.
        </p>
        <div className="cn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={complete} aria-label="No-regret progress">
          <span style={{ width: `${(100 * complete) / Math.max(total, 1)}%` }} />
        </div>
        <ul className="cn-actions" style={{ marginTop: '1rem' }}>
          {plan.noRegret.map((task) => {
            const isDone = done.has(task.id);
            return (
              <li key={task.id} className={`cn-action ${isDone ? 'is-done' : ''}`}>
                <input type="checkbox" checked={isDone} onChange={() => toggle(task.id)} aria-labelledby={`${task.id}-t`} />
                <div>
                  <h3 id={`${task.id}-t`}>{task.title}</h3>
                  <p>{task.why}</p>
                </div>
                <div className="meta">Cost: {task.cost}.</div>
              </li>
            );
          })}
        </ul>
        <p className="cn-note">{plan.skip}</p>
      </section>

      <section aria-labelledby="ladder">
        <h2 id="ladder" className="cn-h2">How the stages work</h2>
        <ul className="cn-steps">{plan.principles.map((p) => <li key={p}>{p}</li>)}</ul>
        <div className="cn-ladder">
          {plan.ladder.map((s) => (
            <div key={s.stage}>
              <StageBadge stage={s.stage} name={s.name} />
              <span>{s.meaning}</span>
              {s.up && <p>Moves up: {s.up}</p>}
              {s.down && <p>Moves down: {s.down}</p>}
            </div>
          ))}
        </div>
      </section>

      {stages && (
        <details className="cn-disclosure">
          <summary>Triggers no feed can measure</summary>
          <p className="cn-note">
            Watch for these yourself. When one happens, move that area to the stage shown, even if every reading is calm.
          </p>
          {stages.areas.filter((a) => a.manualTriggers.length).map((a) => (
            <div key={a.id}>
              <h3 className="cn-area-title">{a.name}</h3>
              <ul className="cn-steps">
                {a.manualTriggers.map((t) => <li key={t.trigger}>Stage {t.stage}: {t.trigger}</li>)}
              </ul>
            </div>
          ))}
        </details>
      )}

      <details className="cn-disclosure">
        <summary>Keep it working</summary>
        <dl className="cn-facts" style={{ marginTop: '0.75rem' }}>
          {plan.maintenance.map((m) => (
            <div key={m.when} style={{ display: 'contents' }}>
              <dt>{m.when}</dt><dd>{m.what}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="cn-note" style={{ marginTop: '2rem' }}>{plan.source}</p>
    </div>
  );
}
