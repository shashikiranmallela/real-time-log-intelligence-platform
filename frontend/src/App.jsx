import { Routes, Route, Navigate } from "react-router-dom";
import OverviewPage    from "./pages/observability/OverviewPage.jsx";
import StreamPage      from "./pages/observability/StreamPage.jsx";
import AnomaliesPage   from "./pages/observability/AnomaliesPage.jsx";
import IncidentsPage   from "./pages/observability/IncidentsPage.jsx";
import AIOpsPage       from "./pages/observability/AIOpsPage.jsx";
import SearchPage      from "./pages/observability/SearchPage.jsx";
import AlertsPage      from "./pages/observability/AlertsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<OverviewPage />} />
      <Route path="/obs"            element={<OverviewPage />} />
      <Route path="/obs/stream"     element={<StreamPage />} />
      <Route path="/obs/anomalies"  element={<AnomaliesPage />} />
      <Route path="/obs/incidents"  element={<IncidentsPage />} />
      <Route path="/obs/ai-ops"     element={<AIOpsPage />} />
      <Route path="/obs/search"     element={<SearchPage />} />
      <Route path="/obs/alerts"     element={<AlertsPage />} />

      {/* Safety redirects — in case any link navigates to bare paths */}
      <Route path="/stream"    element={<Navigate to="/obs/stream"    replace />} />
      <Route path="/anomalies" element={<Navigate to="/obs/anomalies" replace />} />
      <Route path="/incidents" element={<Navigate to="/obs/incidents" replace />} />
      <Route path="/ai-ops"    element={<Navigate to="/obs/ai-ops"    replace />} />
      <Route path="/search"    element={<Navigate to="/obs/search"    replace />} />
      <Route path="/alerts"    element={<Navigate to="/obs/alerts"    replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}