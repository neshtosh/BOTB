import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import CreatorPage from './pages/CreatorPage';
import AuthPage from './pages/auth/AuthPage';
import { AuthProvider } from './context/AuthContext';

// The creator studio is only loaded by signed-in creators, not by every visitor.
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Publish = lazy(() => import('./pages/dashboard/Publish'));
const Library = lazy(() => import('./pages/dashboard/Library'));
const Connections = lazy(() => import('./pages/dashboard/Connections'));
const ProfileSettings = lazy(() => import('./pages/dashboard/ProfileSettings'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-surface-600">Loading…</div>}>
          <Routes>
            {/* Public: the landing page, creators' public pages and auth */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="c/:handle" element={<CreatorPage />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="signup" element={<AuthPage mode="signup" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            {/* Signed in: the creator's own content */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="publish" element={<Publish />} />
              <Route path="library" element={<Library />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="connections" element={<Connections />} />
              <Route path="profile" element={<ProfileSettings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
