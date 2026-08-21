import { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { Sparkles, X, Palette } from 'lucide-react';

export const PROSE_STYLES = [
  { id: 'novelist', label: '✒️ Novelista (Show, don\'t tell)', desc: 'Prosa inmersiva, descripciones sensoriales y diálogos naturales' },
  { id: 'grimdark', label: '🌑 Fantasía Oscura / Grimdark', desc: 'Tono crudo, visceral, decadencia y tensión psicológica' },
  { id: 'noir', label: '🕵️ Novela Negra / Noir', desc: 'Frases afiladas, cinismo, contrastes y silencios elocuentes' },
  { id: 'epic', label: '📜 Épica Clásica / Fantasía', desc: 'Prosa solemne, majestuosa y resonancia mítica' },
  { id: 'action', label: '⚡ Acción / Thriller Ágil', desc: 'Frases concisas, alta adrenalina y ritmo trepidante' },
  { id: 'custom', label: '🎨 Voz Personalizada', desc: 'Escribe tu propia directriz de autor' },
];

interface SceneInspectorProps {
  onGenerate: (beatsText: string, style?: string, customStylePrompt?: string) => void;
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
  const [selectedStyle, setSelectedStyle] = useState('novelist');
  const [customStylePrompt, setCustomStylePrompt] = useState('');
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
      <div className="fixed md:static inset-y-0 right-0 z-[60] w-80 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full flex items-center justify-center p-4 text-center shrink-0">
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
    <>
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-[50] backdrop-blur-sm"
        onClick={onToggle}
      />
      <div className="fixed md:static inset-y-0 right-0 z-[60] w-80 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full flex flex-col shrink-0 shadow-xl md:shadow-none transition-transform duration-300">
        <div className="h-14 px-4 flex justify-between items-center border-b border-[var(--color-border)] shrink-0">
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Inspector de Escena</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{activeScene.title}</p>
        </div>
        <button onClick={onToggle} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Beats Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Beats (Escaleta)</label>
            {saveStatus === 'saving' && <span className="text-xs text-[var(--color-text-secondary)]">Guardando...</span>}
            {saveStatus === 'saved' && <span className="text-xs text-emerald-400">Guardado ✓</span>}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)]">
            Escribe un evento por línea. La IA los redactará en orden cronológico.
          </p>

          <textarea
            value={beatsInput}
            onChange={(e) => setBeatsInput(e.target.value)}
            onBlur={handleSaveBeats}
            placeholder="1. El detective entra al bar bajo la lluvia.&#10;2. Habla con el cantinero sobre el sospechoso.&#10;3. Descubre un sobre sellado en la barra."
            className="w-full h-40 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Prose Style Section */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-[var(--color-primary)]" />
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Estilo Narrativo
            </label>
          </div>

          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
          >
            {PROSE_STYLES.map(style => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>

          {/* Description helper */}
          <p className="text-[11px] text-[var(--color-text-secondary)] italic">
            {PROSE_STYLES.find(s => s.id === selectedStyle)?.desc}
          </p>

          {/* Custom style directive textarea */}
          {selectedStyle === 'custom' && (
            <div className="mt-2 space-y-1">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">Directriz de autor personalizada:</label>
              <textarea
                value={customStylePrompt}
                onChange={(e) => setCustomStylePrompt(e.target.value)}
                placeholder="Ej: Escribe con frases cortas y contundentes al estilo Hemingway, tono melancólico..."
                className="w-full h-20 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2 text-xs focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] resize-y"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => onGenerate(beatsInput, selectedStyle, customStylePrompt)}
            disabled={isGenerating || !beatsInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {isGenerating ? 'Generando Escena...' : 'Generar Magia'}
          </button>
          <p className="text-xs text-[var(--color-text-secondary)] text-center mt-2.5">
            Atención: Reemplazará el texto actual de la escena.
          </p>
        </div>

      </div>
    </div>
    </>
  );
}
