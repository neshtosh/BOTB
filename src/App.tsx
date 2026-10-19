import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import CreatorPage from './pages/CreatorPage';
import AuthPage from './pages/auth/AuthPage';
import { AuthProvider } from './context/AuthContext';
import DemoBadge from './components/common/DemoBadge';
import DemoConnect from './pages/demo/DemoConnect';
import DemoPost from './pages/demo/DemoPost';
import SmartLink from './pages/SmartLink';
import HelpCenter from './pages/help/HelpCenter';
import HelpArticlePage from './pages/help/HelpArticle';

// The creator studio is only loaded by signed-in creators, not by every visitor.
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const NewRelease = lazy(() => import('./pages/dashboard/NewRelease'));
const ReleaseDetail = lazy(() => import('./pages/dashboard/ReleaseDetail'));
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
              <Route path="help" element={<HelpCenter />} />
              <Route path="help/:slug" element={<HelpArticlePage />} />
              {/* Demo mode only: stand-ins for platform sign-in and published posts */}
              <Route path="demo/connect/:provider" element={<DemoConnect />} />
              <Route path="demo/post/:jobId" element={<DemoPost />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            {/* A release's smart link: standalone, like a link-in-bio page */}
            <Route path="/r/:slug" element={<SmartLink />} />
            {/* Signed in: the creator's own content */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="publish" element={<NewRelease />} />
              <Route path="library" element={<Library />} />
              <Route path="library/:id" element={<ReleaseDetail />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="connections" element={<Connections />} />
              <Route path="profile" element={<ProfileSettings />} />
            </Route>
          </Routes>
        </Suspense>
        <DemoBadge />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
