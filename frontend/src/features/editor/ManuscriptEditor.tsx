import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { AutoTagExtension } from './extensions/AutoTagExtension';
import { useCodexStore } from '../../store/useCodexStore';
import { useAppStore } from '../../store/useAppStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { Wand2, PenLine, Sparkles, Shrink, PanelRightOpen } from 'lucide-react';
import type { CodexEntry } from '../../api/codex';
import ManuscriptSidebar from './ManuscriptSidebar';
import SceneInspector from './SceneInspector';
import { useSettingsStore } from '../../store/useSettingsStore';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';

export default function ManuscriptEditor() {
  const { entries, fetchEntries } = useCodexStore();
  const { tree, fetchTree, activeSceneId, updateActiveScene, activeBookId } = useManuscriptStore();
  const { editorFontFamily, editorFontSize, editorLineHeight } = useSettingsStore();
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; entry: CodexEntry | null }>({
    visible: false, x: 0, y: 0, entry: null
  });

  // Cargar datos
  useEffect(() => {
    if (activeBookId) {
      fetchEntries();
    }
  }, [fetchEntries, activeBookId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Encontrar la escena activa
  const activeScene = activeSceneId && tree 
    ? tree.chapters.flatMap(c => c.scenes).find(s => s.id === activeSceneId) 
    : null;

  // Manejo del autoguardado con debounce manual
  const debounceTimeout = useRef<number | null>(null);

  const handleUpdateContent = useCallback((newContent: string) => {
    setSaveStatus('saving');
    if (debounceTimeout.current) window.clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = window.setTimeout(async () => {
      await updateActiveScene({ content: newContent });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000); // 1 segundo de debounce
  }, [updateActiveScene]);

  const editor = useEditor({
    extensions: [StarterKit, AutoTagExtension, Underline],
    content: activeScene?.content || '<p>Comienza a escribir aquí...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      handleUpdateContent(editor.getHTML());
    }
  });

  // Si cambia la escena activa, actualizamos el contenido del editor
  useEffect(() => {
    if (editor && activeScene && editor.getHTML() !== activeScene.content) {
      editor.commands.setContent(activeScene.content || '<p>Comienza a escribir aquí...</p>');
    }
  }, [activeSceneId, editor]);

  // Forzar actualización de tags cuando las entradas del codex (Archivum) terminen de cargar
  useEffect(() => {
    if (editor && entries.length > 0) {
      editor.view.dispatch(editor.state.tr.setMeta('forceUpdate', true));
    }
  }, [entries, editor]);

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

      editor.chain().focus().deleteSelection().run();

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          editor.commands.insertContent(chunk);
        }
      }
    } catch (err) {
      console.error("Error en AI streaming", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateScene = async (beatsText: string) => {
    if (!editor || !activeSceneId) return;
    const token = useAppStore.getState().token;
    
    setIsGeneratingScene(true);
    // Limpiamos el editor para la nueva generación
    editor.commands.setContent('');
    
    try {
      const prompt = `Escribe la prosa para esta escena detalladamente siguiendo estos beats (eventos clave):\n${beatsText}`;
      
      const res = await fetch('http://127.0.0.1:8000/api/v1/ai/generate-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scene_id: activeSceneId,
          prompt: prompt
        })
      });

      if (!res.body) throw new Error('Sin respuesta del servidor.');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // Insertamos en texto plano, Tiptap lo formatea si hay saltos de linea
          // Reemplazar saltos de línea con etiquetas p si es necesario
          editor.commands.insertContent(chunk);
        }
      }
      
      // Aseguramos que guarde el resultado final
      handleUpdateContent(editor.getHTML());
    } catch (err) {
      console.error("Error generating scene", err);
      alert("Hubo un error al generar la escena.");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-background)]">
      <ManuscriptSidebar />

      <div className="flex-1 overflow-y-auto relative p-8">
        {/* Indicador de Autoguardado */}
        <div className="absolute top-4 right-8 text-xs text-[var(--color-text-secondary)] font-medium">
          {saveStatus === 'saving' && <span className="animate-pulse">Guardando...</span>}
          {saveStatus === 'saved' && <span className="text-emerald-400">Guardado ✓</span>}
        </div>

        <div className="max-w-4xl mx-auto relative">
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

          {activeSceneId ? (
            <div 
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl min-h-[70vh] cursor-text flex flex-col"
              style={{
                fontFamily: editorFontFamily,
                fontSize: `${editorFontSize}px`,
                lineHeight: editorLineHeight
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
            >
              <EditorToolbar editor={editor} />
              
              <div className="px-10 pb-10 flex-1">
                <h1 className="text-3xl font-bold mb-6 text-[var(--color-text-primary)] pb-4 border-b border-[var(--color-border)]" style={{ fontFamily: 'sans-serif' }}>
                  {activeScene?.title || 'Sin Título'}
                </h1>
              
              {editor && (
                <BubbleMenu editor={editor} className="flex overflow-hidden rounded-xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md">
                  <button 
                    onClick={() => handleAiAction("Reescribe este texto de forma más profesional y literaria.")}
                    disabled={isAiLoading || isGeneratingScene}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[#6366f1]/20 hover:text-[#6366f1] transition-colors disabled:opacity-50"
                  >
                    <PenLine size={16} /> Reescribir
                  </button>
                  <div className="w-px bg-[var(--color-border)]"></div>
                  <button 
                    onClick={() => handleAiAction("Expande este texto añadiendo más detalles descriptivos.")}
                    disabled={isAiLoading || isGeneratingScene}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={16} /> Expandir
                  </button>
                  <div className="w-px bg-[var(--color-border)]"></div>
                  <button 
                    onClick={() => handleAiAction("Resume este texto en una frase más corta y directa.")}
                    disabled={isAiLoading || isGeneratingScene}
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
          ) : (
            <div className="flex items-center justify-center min-h-[50vh] text-[var(--color-text-secondary)]">
              Selecciona una escena en la barra lateral para empezar a escribir.
            </div>
          )}
        </div>
      </div>

      <SceneInspector 
        onGenerate={handleGenerateScene} 
        isGenerating={isGeneratingScene} 
        isOpen={isInspectorOpen}
        onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
      />

      {!isInspectorOpen && activeSceneId && (
        <button
          onClick={() => setIsInspectorOpen(true)}
          className="fixed right-4 top-24 z-20 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-l-lg shadow-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title="Abrir Inspector de Escena"
        >
          <PanelRightOpen size={24} />
        </button>
      )}
    </div>
  );
}
