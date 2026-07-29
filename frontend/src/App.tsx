import { useAppStore } from './store/useAppStore'
import { PenTool } from 'lucide-react'

function App() {
  const { token } = useAppStore()

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-[#6366f1]/10 rounded-full flex items-center justify-center border border-[#6366f1]/30">
           <PenTool className="w-8 h-8 text-[#6366f1]" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Atramentum</h1>
          <p className="text-[var(--color-text-secondary)]">
            El entorno de escritura inteligente
          </p>
        </div>

        <div className="w-full bg-[var(--color-background)] rounded-lg p-4 border border-[var(--color-border)] mt-4">
          <p className="text-sm flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">Estado del Frontend:</span>
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Línea
            </span>
          </p>
          <p className="text-sm flex justify-between items-center mt-3">
            <span className="text-[var(--color-text-secondary)]">Autenticación (Zustand):</span>
            <span className={`font-medium ${token ? "text-emerald-400" : "text-amber-400"}`}>
              {token ? "Sesión Activa" : "Esperando Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
