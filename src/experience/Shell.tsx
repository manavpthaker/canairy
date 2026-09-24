import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { CanaryMark } from './CanaryLine';
import { HouseholdDialog } from './HouseholdDialog';
import { hasProfile, useHousehold } from './household';
import './theme.css';

export function Shell() {
  const household = useHousehold();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // The old app styled <html> dark; this experience owns the page background.
  useEffect(() => {
    document.documentElement.classList.add('cn');
    return () => document.documentElement.classList.remove('cn');
  }, []);

  useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener('canairy:open-household', openDialog);
    return () => window.removeEventListener('canairy:open-household', openDialog);
  }, []);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <div className="cn-app">
      <a className="cn-skip" href="#main">Skip to content</a>
      <header className="cn-header">
        <Link to="/" className="cn-brand" aria-label="Canairy home">
          <CanaryMark />
          <span>Canairy</span>
        </Link>
        <nav className="cn-nav" aria-label="Main">
          <NavLink to="/" end>Today</NavLink>
          <NavLink to="/plan">Plan</NavLink>
          <NavLink to="/changes" className="hide-sm">Benefits</NavLink>
          <NavLink to="/about" className="hide-sm">How it works</NavLink>
          <button type="button" className="cn-household" onClick={() => setOpen(true)}>
            {hasProfile(household) ? 'Your household' : 'Personalize'}
          </button>
        </nav>
      </header>

      <main id="main" className="cn-main">
        <Outlet />
      </main>

      <footer className="cn-footer">
        <span>Canairy is free and open source. Public data only; your household details stay on your device.</span>
        <nav aria-label="Footer">
          <Link to="/about">How it works</Link>
          <Link to="/signals">All signals</Link>
          <Link to="/changes">Changes to benefits</Link>
          <Link to="/developers">Open data feed</Link>
          <a href="https://github.com/manavpthaker/canairy">Source code</a>
        </nav>
      </footer>

      <dialog ref={dialog} className="cn-dialog" onClose={() => setOpen(false)} aria-labelledby="household-title">
        {open && <HouseholdDialog onDone={() => setOpen(false)} />}
      </dialog>
    </div>
  );
}
