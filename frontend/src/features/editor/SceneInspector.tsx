import { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { Sparkles, X } from 'lucide-react';

interface SceneInspectorProps {
  onGenerate: (beatsText: string) => void;
  isGenerating: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export default function SceneInspector({ onGenerate, isGenerating, isOpen, onToggle }: SceneInspectorProps) {
  const { tree, activeSceneId, updateActiveScene } = useManuscriptStore();

  const activeScene = activeSceneId && tree
    ? tree.chapters.flatMap(c => c.scenes).find(s => s.id === activeSceneId)
    : null;

  const [beatsInput, setBeatsInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync with active scene
  useEffect(() => {
    if (activeScene) {
      // Convert JSON array of strings back to newline separated text
      const beats = Array.isArray(activeScene.beats) ? activeScene.beats.join('\n') : '';
      setBeatsInput(beats);
    } else {
      setBeatsInput('');
    }
  }, [activeScene?.id]);

  const handleSaveBeats = async () => {
    if (!activeSceneId) return;
    setSaveStatus('saving');

    // Split by newline and remove empty lines
    const beatsArray = beatsInput.split('\n').map(b => b.trim()).filter(b => b.length > 0);

    try {
      await updateActiveScene({ beats: beatsArray });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  if (!isOpen) return null;

  if (!activeScene) {
    return (
      <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full flex items-center justify-center p-4 text-center shrink-0 relative">
        <button onClick={onToggle} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
          <X size={20} />
        </button>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Selecciona una escena para ver sus propiedades.
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full flex flex-col shrink-0">
      <div className="h-14 px-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Inspector de Escena</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{activeScene.title}</p>
        </div>
        <button onClick={onToggle} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Beats Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Beats (Eventos)</label>
            {saveStatus === 'saving' && <span className="text-xs text-[var(--color-text-secondary)]">Guardando...</span>}
            {saveStatus === 'saved' && <span className="text-xs text-emerald-400">Guardado ✓</span>}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)]">
            Escribe un beat por línea. La IA los usará como esqueleto para redactar la prosa.
          </p>

          <textarea
            value={beatsInput}
            onChange={(e) => setBeatsInput(e.target.value)}
            onBlur={handleSaveBeats} // Save when losing focus
            placeholder="1. El detective entra al bar.&#10;2. Habla con el cantinero.&#10;3. Descubre la pista secreta."
            className="w-full h-48 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] resize-y"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => onGenerate(beatsInput)}
            disabled={isGenerating || !beatsInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {isGenerating ? 'Generando...' : 'Generar Magia'}
          </button>
          <p className="text-xs text-[var(--color-text-secondary)] text-center mt-3">
            Atención: Esto reemplazará el texto actual del editor.
          </p>
        </div>

      </div>
    </div>
  );
}
