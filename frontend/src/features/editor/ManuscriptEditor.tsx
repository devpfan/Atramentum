import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { AutoTagExtension } from './extensions/AutoTagExtension';
import { useCodexStore } from '../../store/useCodexStore';
import { useAppStore } from '../../store/useAppStore';
import { Wand2, PenLine, Sparkles, Shrink } from 'lucide-react';
import type { CodexEntry } from '../../api/codex';

export default function ManuscriptEditor() {
  const { entries, fetchEntries, isLoading } = useCodexStore();
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; entry: CodexEntry | null }>({
    visible: false, x: 0, y: 0, entry: null
  });

  // Cargar Codex
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const editor = useEditor({
    extensions: [StarterKit, AutoTagExtension],
    content: `
      <h2>Capítulo 1: El Comienzo</h2>
      <p>Había una vez un rey llamado Arturo que gobernaba con justicia. Su espada, Excalibur, brillaba en la oscuridad de la sala. Sin embargo, en el reino de Camelot, oscuros secretos acechaban.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  // Delegación de eventos para Tooltip del Codex
  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('codex-tag')) {
      const codexId = target.getAttribute('data-codex-id');
      if (codexId) {
        const entry = entries.find(e => e.id.toString() === codexId);
        if (entry) {
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY + 20,
            entry
          });
          return;
        }
      }
    }
    // Ocultar si no está sobre un tag
    setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
  };

  const handleAiAction = async (instruction: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;

    const token = useAppStore.getState().token;
    setIsAiLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/ai/inline-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selected_text: selectedText,
          instruction: instruction
        })
      });

      if (!res.body) throw new Error('Sin respuesta del servidor.');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Borramos el texto seleccionado
      editor.chain().focus().deleteSelection().run();

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // Insertamos en texto plano como va llegando
          editor.commands.insertContent(chunk);
        }
      }
    } catch (err) {
      console.error("Error en AI streaming", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse p-8 text-[var(--color-text-secondary)]">Cargando base de datos del Codex...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-full relative">
      
      {/* Tooltip Flotante */}
      {tooltip.visible && tooltip.entry && (
        <div 
          className="fixed z-50 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-4 rounded-xl max-w-xs pointer-events-none transition-opacity"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">{tooltip.entry.name}</h3>
            <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-2 py-0.5 rounded-full font-medium">
              {tooltip.entry.category}
            </span>
          </div>
          {tooltip.entry.description && (
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {tooltip.entry.description}
            </p>
          )}
        </div>
      )}

      {/* Editor Principal */}
      <div 
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-10 shadow-xl min-h-[70vh] cursor-text"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
      >
        {editor && (
          <BubbleMenu editor={editor} className="flex overflow-hidden rounded-xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md">
            <button 
              onClick={() => handleAiAction("Reescribe este texto de forma más profesional y literaria.")}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[#6366f1]/20 hover:text-[#6366f1] transition-colors disabled:opacity-50"
            >
              <PenLine size={16} /> Reescribir
            </button>
            <div className="w-px bg-[var(--color-border)]"></div>
            <button 
              onClick={() => handleAiAction("Expande este texto añadiendo más detalles descriptivos.")}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} /> Expandir
            </button>
            <div className="w-px bg-[var(--color-border)]"></div>
            <button 
              onClick={() => handleAiAction("Resume este texto en una frase más corta y directa.")}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-amber-500/20 hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              <Shrink size={16} /> Resumir
            </button>
            
            {isAiLoading && (
              <>
                <div className="w-px bg-[var(--color-border)]"></div>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                  <Wand2 size={16} className="animate-pulse text-[#6366f1]" /> Pensando...
                </div>
              </>
            )}
          </BubbleMenu>
        )}
        
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
