import { Outlet } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '../../api/auth';
import AuthBackground from './AuthBackground';

export default function AuthLayout() {
  const [theme, setTheme] = useState(() => localStorage.getItem('atramentum_login_theme') || 'parchment');
  const [allowPublicRegistration, setAllowPublicRegistration] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    authApi.getPublicSettings()
      .then(res => {
        if (res.login_theme) {
          setTheme(res.login_theme);
          localStorage.setItem('atramentum_login_theme', res.login_theme);
        }
        if (res.allow_public_registration !== undefined) {
          setAllowPublicRegistration(res.allow_public_registration === 'true' || res.allow_public_registration === true);
        }
      })
      .catch(err => console.error("Could not fetch public settings", err))
      .finally(() => setIsLoaded(true));
  }, []);

  return (
    <div className={`min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4 login-theme-${theme} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-90'}`}>
      {/* Background Decorative Elements */}
      <AuthBackground />

      <div className={`max-w-md w-full theme-${theme} rounded-2xl overflow-hidden z-10 relative shadow-2xl`}>
        <div className="p-8 pb-6 text-center border-b border-white/10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black/30 rounded-xl border border-white/10 mb-4 shadow-inner">
            <PenTool className={`w-6 h-6 ${theme === 'neon' ? 'text-indigo-400' : theme === 'modern' ? 'text-[#6366f1]' : 'text-yellow-500/80'}`} />
          </div>
          <h1 className={`text-3xl font-bold tracking-widest uppercase ${theme === 'modern' ? 'text-[#6366f1]' : theme === 'neon' ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'font-cinzel gold-gradient-text'}`}>Atramentum</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Tu historia comienza aquí</p>
        </div>

        <div className="p-8">
          <Outlet context={{ theme, allowPublicRegistration, isLoaded }} />
        </div>
      </div>
    </div>
  );
}

