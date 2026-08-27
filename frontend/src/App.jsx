import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import CatLoader from './components/CatLoader';

function RedirectByRole() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-slate-950">
        <CatLoader text="Initializing Workspace..." size="w-40 h-40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

function LoginGuard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />

          <Route path="/*" element={<RedirectByRole />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;