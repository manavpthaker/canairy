import { Link } from 'react-router-dom';
import { useStore } from '../store';

export function About() {
  const count = useStore((s) => s.indicators.length);
  return (
    <div className="cn-column">
      <h1 className="cn-headline">How Canairy works</h1>
      <p className="cn-lede">
        Canairy watches public data that tends to move before household budgets do, and tells you in plain words when
        something is worth doing.
      </p>

      <h2 className="cn-h2">What we check</h2>
      <p>
        Every hour we collect {count || 'about three dozen'} readings from official and market sources: the Bureau of
        Labor Statistics, the Federal Reserve, the Energy Information Administration, FEMA, the FDA, the CDC, the
        National Weather Service, CISA, the FDIC, the Treasury and the State Department, among others.{' '}
        <Link to="/signals">See the full list</Link>.
      </p>

      <h2 className="cn-h2">How a signal turns amber or red</h2>
      <p>
        Each signal has two thresholds set from its own history: a “worth watching” level that’s unusual but not
        alarming, and an “act now” level that has only been reached in past crises. Every signal page shows both, so you
        can judge for yourself.
      </p>
      <p>
        Each signal page also puts today’s number in perspective: its usual range, the record high and low, and how today
        compares, all worked out from up to ten years of the same official source.
      </p>
      <p>
        A few signals are shown for context only. They’re real data but loose proxies for household risk, so they never
        raise an alert on their own.
      </p>

      <h2 className="cn-h2">What we won’t do</h2>
      <p>
        We don’t estimate, fill gaps or show sample data. If a source doesn’t answer, the last real reading is shown
        with its age, and it stops counting toward alerts once it’s out of date.
      </p>
      <p>
        We don’t collect anything about you. Your household answers stay in your browser. Your ZIP code is turned into
        map coordinates using a file on this site, and only those coordinates are sent to the National Weather Service to
        look up local alerts.
      </p>

      <h2 className="cn-h2">The daily briefing</h2>
      <p>
        When a signal changes level, Claude, an AI model made by Anthropic, writes a short briefing from the same
        readings you see here. Before it’s published, a check confirms every number in it comes from the data. If it
        doesn’t pass, you see the plain summary instead.
      </p>

      <h2 className="cn-h2">For caseworkers and developers</h2>
      <p>
        The same readings are available as a free, open feed so benefit navigators and financial coaches can build them
        into their own tools. <Link to="/developers">Read the feed documentation</Link>.
      </p>

      <h2 className="cn-h2">Not advice</h2>
      <p>
        Canairy is general information, not financial, medical or legal advice. For decisions about your money, health
        or housing, talk to a professional or one of the free services we link to.
      </p>
    </div>
  );
}
