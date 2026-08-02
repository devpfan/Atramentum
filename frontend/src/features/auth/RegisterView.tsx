import { useState } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Loader2 } from 'lucide-react';

export default function RegisterView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useOutletContext<{ theme: string }>();

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
      <h2 className={`text-xl mb-8 text-center uppercase tracking-widest border-b pb-4 ${theme === 'modern' ? 'font-semibold normal-case tracking-normal border-[var(--color-border)]/50' : theme === 'neon' ? 'text-indigo-400 border-indigo-400/20 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'font-cinzel text-yellow-500/80 border-yellow-500/20'}`}>Crear Cuenta</h2>

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
            className={`w-full text-[var(--color-text-primary)] transition-all ${theme === 'modern' ? 'bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent' : theme === 'neon' ? 'input-line py-2 text-center text-lg border-indigo-400/30 focus:border-indigo-400' : 'input-line py-2 text-center font-serif text-lg'}`}
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
            className={`w-full text-[var(--color-text-primary)] tracking-widest transition-all ${theme === 'modern' ? 'bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent' : theme === 'neon' ? 'input-line py-2 text-center text-lg border-indigo-400/30 focus:border-indigo-400' : 'input-line py-2 text-center font-serif text-lg'}`}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !!success}
          className={`w-full flex items-center justify-center transition-all disabled:opacity-50 mt-6 ${theme === 'modern' ? 'bg-[var(--color-surface-hover)] hover:bg-[#6366f1] text-[var(--color-text-primary)] font-medium rounded-lg px-4 py-2.5 border border-[var(--color-border)]' : theme === 'neon' ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/50 text-indigo-400 rounded-none px-4 py-3 uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 text-yellow-500 font-cinzel rounded-none px-4 py-3 uppercase tracking-widest text-sm'}`}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarse'}
        </button>
      </form>

      <p className={`mt-8 text-center text-sm text-[var(--color-text-secondary)] ${theme === 'modern' ? '' : 'font-serif'}`}>
        ¿Ya tienes cuenta? <Link to="/login" className={`hover:underline transition-colors ${theme === 'modern' ? 'text-[#6366f1] font-medium' : theme === 'neon' ? 'text-indigo-400 hover:text-indigo-300 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'text-yellow-600 hover:text-yellow-400'}`}>Inicia Sesión</Link>
      </p>
    </div>
  );
}
