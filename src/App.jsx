import React from 'react';
import { useAuth } from './controllers/useAuth';
import LoginScreen from './views/components/LoginScreen';
import Dashboard from './views/Dashboard';

const App = () => {
  const { user, loading, authError, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} authError={authError} />;
  }

  return <Dashboard user={user} logout={logout} />;
};

export default App;
