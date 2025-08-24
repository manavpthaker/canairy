import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Indicators } from './pages/Indicators';
import { IndicatorDetails } from './pages/IndicatorDetails';
import { News } from './pages/News';
import { Analytics } from './pages/Analytics';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { useStore } from './store';
import { wsService } from './services/api';

function App() {
  const { fetchIndicators, fetchHOPIScore, fetchSystemStatus, updateIndicator } = useStore();

  useEffect(() => {
    // Initial data fetch
    fetchIndicators();
    fetchHOPIScore();
    fetchSystemStatus();

    // Set up WebSocket connection
    wsService.connect();

    // Subscribe to WebSocket events
    wsService.on('indicator:update', (data: any) => {
      updateIndicator(data.id, data);
    });

    wsService.on('hopi:update', () => {
      fetchHOPIScore();
    });

    // Set up polling interval
    const interval = setInterval(() => {
      fetchIndicators();
      fetchHOPIScore();
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicators" element={<Indicators />} />
        <Route path="/indicator/:id" element={<IndicatorDetails />} />
        <Route path="/news" element={<News />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;