import React, { useState, useEffect } from 'react';
import { X, Save, Bot } from 'lucide-react';
import { authApi } from '../../api/auth';
import type { AISettings } from '../../api/auth';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<AISettings>({ provider: 'gemini' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    authApi.getAISettings()
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading settings", err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateAISettings(settings);
      onClose();
    } catch (err) {
      console.error("Error saving settings", err);
      alert("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <Bot size={20} className="text-[#6366f1]" />
            <h2 className="font-semibold">Configuración de Inteligencia Artificial</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="text-center text-[var(--color-text-secondary)] py-8">Cargando...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Proveedor de Modelos LLM
                </label>
                <select 
                  name="provider" 
                  value={settings.provider} 
                  onChange={handleChange}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="local">Modelo Local (Ollama / LM Studio)</option>
                </select>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Elige qué proveedor usará el Asistente de Escritura para generar Beats.
                </p>
              </div>

              {settings.provider === 'gemini' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    API Key de Gemini
                  </label>
                  <input 
                    type="password" 
                    name="gemini_key" 
                    value={settings.gemini_key || ''} 
                    onChange={handleChange}
                    placeholder="AIzaSy..."
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                  />
                </div>
              )}

              {settings.provider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    API Key de OpenAI
                  </label>
                  <input 
                    type="password" 
                    name="openai_key" 
                    value={settings.openai_key || ''} 
                    onChange={handleChange}
                    placeholder="sk-..."
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                  />
                </div>
              )}

              {settings.provider === 'anthropic' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    API Key de Anthropic
                  </label>
                  <input 
                    type="password" 
                    name="anthropic_key" 
                    value={settings.anthropic_key || ''} 
                    onChange={handleChange}
                    placeholder="sk-ant-..."
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                  />
                </div>
              )}

              {settings.provider === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    URL del Servidor Local (Compatible con OpenAI)
                  </label>
                  <input 
                    type="text" 
                    name="local_url" 
                    value={settings.local_url || ''} 
                    onChange={handleChange}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                  />
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Ej. Ollama o LM Studio ejecutándose localmente. Asegúrate de tener el modelo descargado.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)] rounded-b-lg flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="px-4 py-2 text-sm font-medium bg-[#6366f1] text-white rounded-md hover:bg-[#4f46e5] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
}
