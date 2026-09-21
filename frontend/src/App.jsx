import { Routes, Route, Navigate } from 'react-router-dom';
import SplashPage from './pages/splash/SplashPage';
import { AppShell, RoleRoute } from './routes';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MapPage from './pages/map/MapPage';
import HabitationsPage from './pages/habitations/HabitationsPage';
import RiskPage from './pages/risk/RiskPage';
import RelocationPage from './pages/relocation/RelocationPage';
import SitesPage from './pages/sites/SitesPage';
import CapacityPage from './pages/capacity/CapacityPage';
import OptimizationPage from './pages/optimization/OptimizationPage';
import FieldPage from './pages/field/FieldPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/habitations" element={<HabitationsPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/relocation" element={<RelocationPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/capacity" element={<CapacityPage />} />
        <Route path="/optimization" element={<OptimizationPage />} />
        <Route path="/field" element={<FieldPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/admin"
          element={(
            <RoleRoute roles={['commander']}>
              <AdminPage />
            </RoleRoute>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
