import React, { useState, useEffect } from 'react';
import { aiApi, type AiSettings, type AiPersona } from '../../api/ai';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface AiSettingsModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function AiSettingsModal({ onClose, onSaved }: AiSettingsModalProps) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await aiApi.getSettings();
        if (!data.custom_personas) {
          data.custom_personas = [];
        }
        setSettings(data);
      } catch (err) {
        console.error('Error fetching AI settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAddPersona = () => {
    if (!settings) return;
    const newPersona: AiPersona = {
      id: `custom_${Date.now()}`,
      name: 'Nueva Persona',
      prompt: 'Eres un...'
    };
    setSettings({
      ...settings,
      custom_personas: [...(settings.custom_personas || []), newPersona]
    });
  };

  const handleRemovePersona = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      custom_personas: (settings.custom_personas || []).filter(p => p.id !== id)
    });
  };

  const handleChangePersona = (id: string, field: keyof AiPersona, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      custom_personas: (settings.custom_personas || []).map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await aiApi.updateSettings(settings);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[var(--color-surface)] p-6 rounded-xl shadow-2xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Personas IA Personalizadas</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-secondary)] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Crea tus propios roles de IA para interactuar en el chat.
            </p>
            <button 
              onClick={handleAddPersona}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1]/30 rounded-lg transition-colors"
            >
              <Plus size={16} /> Nueva Persona
            </button>
          </div>

          <div className="space-y-4">
            {(!settings?.custom_personas || settings.custom_personas.length === 0) && (
              <div className="text-center p-8 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)]">
                No has creado ninguna Persona personalizada.
              </div>
            )}
            {settings?.custom_personas?.map((persona, index) => (
              <div key={persona.id} className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-4 space-y-3 relative group">
                <button 
                  onClick={() => handleRemovePersona(persona.id)}
                  className="absolute top-4 right-4 p-1.5 text-[var(--color-text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar Persona"
                >
                  <Trash2 size={16} />
                </button>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 uppercase tracking-wider">Nombre del Rol</label>
                  <input 
                    type="text" 
                    value={persona.name}
                    onChange={(e) => handleChangePersona(persona.id, 'name', e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded py-1.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 uppercase tracking-wider">Instrucciones del Sistema (Prompt)</label>
                  <textarea 
                    value={persona.prompt}
                    onChange={(e) => handleChangePersona(persona.id, 'prompt', e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded py-2 px-3 text-sm focus:outline-none focus:border-blue-500 resize-y"
                    placeholder="Ej: Eres un asistente extremadamente sarcástico que siempre responde con ironía pero ayuda a corregir la ortografía."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-background)] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
          >
            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
