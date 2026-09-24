import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useStore } from './store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shell } from './experience/Shell';
import { Today } from './experience/Today';

const SignalPage = lazy(() => import('./experience/SignalPage').then((m) => ({ default: m.SignalPage })));
const AllSignals = lazy(() => import('./experience/SignalPage').then((m) => ({ default: m.AllSignals })));
const Plan = lazy(() => import('./experience/Plan').then((m) => ({ default: m.Plan })));
const About = lazy(() => import('./experience/About').then((m) => ({ default: m.About })));
import { Changes } from './experience/Changes';
const Developers = lazy(() => import('./experience/Developers').then((m) => ({ default: m.Developers })));

function LegacySignal() {
  const { id } = useParams();
  return <Navigate to={`/signal/${id}`} replace />;
}

function NotFound() {
  return (
    <div className="cn-column">
      <h1 className="cn-headline">There’s no page here.</h1>
      <p className="cn-lede"><a href="/">Go to today’s signals</a>.</p>
    </div>
  );
}

function App() {
  const refreshAll = useStore((s) => s.refreshAll);

  useEffect(() => {
    refreshAll();
    // Data is collected hourly, so a 5-minute check is plenty. Skip hidden tabs.
    const interval = setInterval(() => {
      if (!document.hidden) refreshAll();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Today />} />
              <Route path="/signal/:id" element={<SignalPage />} />
              <Route path="/signals" element={<AllSignals />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/changes" element={<Changes />} />
              <Route path="/about" element={<About />} />
              <Route path="/developers" element={<Developers />} />

              {/* Old addresses */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/indicators" element={<Navigate to="/signals" replace />} />
              <Route path="/indicator/:id" element={<LegacySignal />} />
              <Route path="/action-plan" element={<Navigate to="/plan" replace />} />
              <Route path="/alerts" element={<Navigate to="/" replace />} />
              <Route path="/analytics" element={<Navigate to="/signals" replace />} />
              <Route path="/reports" element={<Navigate to="/signals" replace />} />
              <Route path="/settings" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
