import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Loader2 } from 'lucide-react';

export default function RegisterView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.register({ email, password });
      setSuccess('¡Cuenta creada con éxito! Redirigiendo al Login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Ocurrió un error al registrarse.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Crear Cuenta</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-center">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent transition-all"
            placeholder="nuevo@atramentum.com"
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
          disabled={isLoading || !!success}
          className="w-full bg-[var(--color-surface-hover)] hover:bg-[#6366f1] text-[var(--color-text-primary)] font-medium rounded-lg px-4 py-2.5 mt-2 transition-colors flex items-center justify-center border border-[var(--color-border)] disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarse'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        ¿Ya tienes cuenta? <Link to="/login" className="text-[#6366f1] hover:underline font-medium">Inicia Sesión</Link>
      </p>
    </div>
  );
}
