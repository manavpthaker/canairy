import { TASK_TIERS } from '../data/phaseTasks';
import { useDone } from './household';

/**
 * The household plan: steps that make any disruption easier, grouped from the
 * basics up. Progress is saved on this device only.
 */
export function Plan() {
  const { done, toggle } = useDone('forever');
  const total = TASK_TIERS.reduce((n, t) => n + t.tasks.length, 0);
  const complete = TASK_TIERS.reduce((n, t) => n + t.tasks.filter((task) => done.has(task.id)).length, 0);

  return (
    <div className="cn-column" style={{ maxWidth: '44rem' }}>
      <h1 className="cn-headline">Your household plan</h1>
      <p className="cn-lede">
        Steps that make any disruption easier to ride out, from a power cut to a lost paycheck. Start with the basics;
        most of it takes an afternoon. Your progress stays on this device.
      </p>
      <p style={{ marginBottom: '0.5rem' }}>
        <strong>{complete}</strong> of {total} done.
      </p>
      <div className="cn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={complete} aria-label="Plan progress">
        <span style={{ width: `${(100 * complete) / Math.max(total, 1)}%` }} />
      </div>

      {TASK_TIERS.map((tier, n) => {
        const tierDone = tier.tasks.filter((t) => done.has(t.id)).length;
        return (
          <section key={tier.id} aria-labelledby={`tier-${tier.id}`}>
            <h2 id={`tier-${tier.id}`} className="cn-h2">
              {n + 1}. {tier.title}
            </h2>
            <p className="cn-sub">
              {tier.description} {tierDone > 0 && <>({tierDone} of {tier.tasks.length} done.)</>}
            </p>
            <ul className="cn-actions">
              {tier.tasks.map((task) => {
                const isDone = done.has(task.id);
                return (
                  <li key={task.id} className={`cn-action ${isDone ? 'is-done' : ''}`}>
                    <input type="checkbox" checked={isDone} onChange={() => toggle(task.id)} aria-labelledby={`${task.id}-t`} />
                    <div>
                      <h3 id={`${task.id}-t`}>{task.title}</h3>
                      <p>{task.description}</p>
                    </div>
                    <div className="meta">
                      Takes {task.timeEstimate.replace('~', 'about ')}.
                      {task.costEstimate ? ` Costs ${task.costEstimate}.` : ' Free.'}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
