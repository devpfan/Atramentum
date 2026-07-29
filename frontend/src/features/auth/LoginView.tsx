import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAppStore } from '../../store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setToken = useAppStore(state => state.setToken);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authApi.login({ email, password });
      setToken(res.access_token);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Iniciar Sesión</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent transition-all"
            placeholder="escritor@atramentum.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Contraseña</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium rounded-lg px-4 py-2.5 mt-2 transition-colors flex items-center justify-center shadow-lg shadow-[#6366f1]/20 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar al Editor'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        ¿No tienes cuenta? <Link to="/register" className="text-[#6366f1] hover:underline font-medium">Regístrate aquí</Link>
      </p>
    </div>
  );
}
