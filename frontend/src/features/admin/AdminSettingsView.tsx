import { useState, useEffect } from 'react';
import { adminService, GlobalSetting } from '../../api/admin';
import { Save, Server, ShieldCheck } from 'lucide-react';

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminService.getSettings().then(data => {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.key] = s.value);
      setSettings(map);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await adminService.updateSetting({ key, value });
      }
      alert("Configuraciones guardadas con éxito");
    } catch (e) {
      console.error(e);
      alert("Error guardando configuraciones");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Configuración Global</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Ajustes a nivel de servidor que aplican a todos los usuarios.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#6366f1] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
        >
          <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Seguridad */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-green-500" size={20} />
            <h2 className="text-lg font-bold">Seguridad y Acceso</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={settings['allow_public_registration'] !== 'false'} 
                onChange={(e) => handleChange('allow_public_registration', e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 rounded border-[var(--color-border)] text-[#6366f1] focus:ring-[#6366f1] bg-[var(--color-background)]"
              />
              <div>
                <div className="font-medium">Permitir Registro Público</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Si se desactiva, solo los administradores podrán crear nuevas cuentas.</div>
              </div>
            </label>
          </div>
        </div>

        {/* IA Global */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Server className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold">Servidor de IA (Llave Maestra)</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Estas configuraciones se usarán como respaldo para todos los usuarios que no tengan su propia API Key configurada.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor Global por Defecto</label>
              <select 
                value={settings['global_ai_provider'] || 'gemini'} 
                onChange={(e) => handleChange('global_ai_provider', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="local">Ollama (Local / Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key de Gemini</label>
              <input 
                type="password"
                value={settings['global_gemini_key'] || ''}
                onChange={(e) => handleChange('global_gemini_key', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">API Key de OpenAI</label>
              <input 
                type="password"
                value={settings['global_openai_key'] || ''}
                onChange={(e) => handleChange('global_openai_key', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL Base de Ollama (Offline)</label>
              <input 
                type="text"
                placeholder="http://localhost:11434/v1"
                value={settings['global_local_url'] || ''}
                onChange={(e) => handleChange('global_local_url', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Ejemplo: http://127.0.0.1:11434/v1</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
