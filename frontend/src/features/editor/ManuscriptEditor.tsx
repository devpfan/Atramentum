import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { AutoTagExtension } from './extensions/AutoTagExtension';
import { useCodexStore } from '../../store/useCodexStore';
import { useAppStore } from '../../store/useAppStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { Wand2, PenLine, Sparkles, Shrink, PanelRightOpen, Check, X as CloseIcon } from 'lucide-react';
import type { CodexEntry } from '../../api/codex';
import ManuscriptSidebar from './ManuscriptSidebar';
import SceneInspector from './SceneInspector';
import { useSettingsStore } from '../../store/useSettingsStore';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import EditorToolbar from './EditorToolbar';
import { BookOpen } from 'lucide-react';

export default function ManuscriptEditor() {
  const { entries, fetchEntries } = useCodexStore();
  const { tree, fetchTree, activeSceneId, updateActiveScene, activeBookId } = useManuscriptStore();
  const { editorFontFamily, editorFontSize, editorLineHeight } = useSettingsStore();
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const isFocusMode = useAppStore(state => state.isFocusMode);
  const toggleFocusMode = useAppStore(state => state.toggleFocusMode);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; entry: CodexEntry | null }>({
    visible: false, x: 0, y: 0, entry: null
  });

  // AI Preview State
  const [aiPreview, setAiPreview] = useState<{
    visible: boolean;
    originalText: string;
    generatedText: string;
    from: number;
    to: number;
    x: number;
    y: number;
  }>({ visible: false, originalText: '', generatedText: '', from: 0, to: 0, x: 0, y: 0 });

  // Synonyms Popover State
  const [synonymsPopover, setSynonymsPopover] = useState<{
    visible: boolean;
    word: string;
    synonyms: string[];
    isLoading: boolean;
    x: number;
    y: number;
    from: number;
    to: number;
  }>({ visible: false, word: '', synonyms: [], isLoading: false, x: 0, y: 0, from: 0, to: 0 });

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
    extensions: [StarterKit, AutoTagExtension, Underline, Highlight.configure({ multicolor: true })],
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
          let yPos = e.clientY + 20;
          let xPos = e.clientX;
          
          // Ajuste si está muy abajo en la pantalla (evita que se corte)
          if (e.clientY + 250 > window.innerHeight) {
            yPos = e.clientY - 200; // Lo mostramos hacia arriba
          }
          
          // Ajuste si está muy a la derecha
          if (e.clientX + 320 > window.innerWidth) {
            xPos = e.clientX - 320;
          }

          setTooltip({
            visible: true,
            x: xPos,
            y: yPos,
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

    // Get coordinates for the popover
    const coords = editor.view.coordsAtPos(from);

    const token = useAppStore.getState().token;
    setIsAiLoading(true);

    setAiPreview({
      visible: true,
      originalText: selectedText,
      generatedText: '',
      from,
      to,
      x: coords.left,
      y: coords.bottom + 10
    });

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

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setAiPreview(prev => ({ ...prev, generatedText: prev.generatedText + chunk }));
        }
      }
    } catch (err) {
      console.error("Error en AI streaming", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptAi = () => {
    if (!editor || !aiPreview.visible) return;
    editor.chain().focus().setTextSelection({ from: aiPreview.from, to: aiPreview.to }).insertContent(aiPreview.generatedText).run();
    setAiPreview(prev => ({ ...prev, visible: false }));
  };

  const handleRejectAi = () => {
    setAiPreview(prev => ({ ...prev, visible: false }));
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

  const handleFetchSynonyms = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const word = editor.state.doc.textBetween(from, to, ' ').trim();
    if (!word || word.includes(' ')) return;
    
    const coords = editor.view.coordsAtPos(from);
    setSynonymsPopover({
      visible: true, word, synonyms: [], isLoading: true, x: coords.left, y: coords.bottom + 10, from, to
    });
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/ai/synonyms?word=${encodeURIComponent(word)}`);
      const data = await res.json();
      setSynonymsPopover(prev => ({ ...prev, isLoading: false, synonyms: data.synonyms || [] }));
    } catch (err) {
      console.error(err);
      setSynonymsPopover(prev => ({ ...prev, isLoading: false, synonyms: [] }));
    }
  };
  
  const handleApplySynonym = (syn: string) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from: synonymsPopover.from, to: synonymsPopover.to }).insertContent(syn).run();
    setSynonymsPopover(prev => ({ ...prev, visible: false }));
  };

  const selectedTextForMenu = editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ').trim() : '';
  const isSingleWord = selectedTextForMenu.length > 0 && !selectedTextForMenu.includes(' ');

  return (
    <div className="flex h-full w-full bg-[var(--color-background)]">
      {!isFocusMode && <ManuscriptSidebar />}

      <div className={`flex-1 overflow-y-auto relative ${isFocusMode ? 'p-0 w-full' : 'p-8'}`}>
        {/* Botón flotante para salir del modo focus */}
        {isFocusMode && (
          <button 
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              toggleFocusMode(false);
            }}
            className="fixed top-4 right-4 z-50 p-2 text-indigo-400 hover:text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors opacity-0 hover:opacity-100 focus-mode-exit-btn"
            title="Salir del Modo Concentración (ESC)"
          >
            <Shrink size={20} />
          </button>
        )}

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

          {/* AI Inline Preview Modal */}
          {aiPreview.visible && (
            <div 
              className="fixed z-50 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-0 rounded-xl w-96 flex flex-col overflow-hidden max-h-[400px]"
              style={{ left: aiPreview.x, top: aiPreview.y }}
            >
              <div className="flex justify-between items-center p-3 border-b border-[var(--color-border)] bg-[#6366f1]/5">
                <div className="flex items-center gap-2 text-[#6366f1] font-medium text-sm">
                  <Wand2 size={16} className={isAiLoading ? "animate-pulse" : ""} /> 
                  {isAiLoading ? "AtrIA está escribiendo..." : "Sugerencia de AtrIA"}
                </div>
                {!isAiLoading && (
                  <button onClick={handleRejectAi} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 text-sm">
                <div className="mb-4">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 block">Original</span>
                  <div className="line-through text-red-400 opacity-70 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                    {aiPreview.originalText}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6366f1] uppercase tracking-wider mb-1 block">Sugerencia</span>
                  {isAiLoading ? (
                    <div className="text-emerald-400 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 whitespace-pre-wrap">
                      {aiPreview.generatedText || "..."}
                    </div>
                  ) : (
                    <textarea 
                      className="w-full text-emerald-400 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/30 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none whitespace-pre-wrap resize-y min-h-[100px]"
                      value={aiPreview.generatedText}
                      onChange={(e) => setAiPreview(prev => ({ ...prev, generatedText: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              {!isAiLoading && (
                <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-background)] flex gap-2 justify-end">
                  <button 
                    onClick={handleRejectAi}
                    className="px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleAcceptAi}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#6366f1] text-white rounded-md hover:bg-[#4f46e5] transition-colors"
                  >
                    <Check size={16} /> Aplicar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Synonyms Popover */}
          {synonymsPopover.visible && (
            <div 
              className="fixed z-50 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-0 rounded-xl w-64 flex flex-col overflow-hidden max-h-[300px]"
              style={{ left: synonymsPopover.x, top: synonymsPopover.y }}
            >
              <div className="flex justify-between items-center p-3 border-b border-[var(--color-border)] bg-blue-500/10">
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                  <BookOpen size={16} className={synonymsPopover.isLoading ? "animate-pulse" : ""} /> 
                  Sinónimos
                </div>
                <button onClick={() => setSynonymsPopover(prev => ({ ...prev, visible: false }))} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <CloseIcon size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {synonymsPopover.isLoading ? (
                  <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">Buscando...</div>
                ) : synonymsPopover.synonyms.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {synonymsPopover.synonyms.map(syn => (
                      <button 
                        key={syn}
                        onClick={() => handleApplySynonym(syn)}
                        className="text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-sm transition-colors"
                      >
                        {syn}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">No se encontraron sinónimos.</div>
                )}
              </div>
            </div>
          )}

          {activeSceneId ? (
            <div 
              className={isFocusMode ? 'min-h-[100vh] w-full max-w-[900px] mx-auto cursor-text flex flex-col pt-12' : 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl min-h-[70vh] cursor-text flex flex-col'}
              style={{
                fontFamily: isFocusMode ? undefined : editorFontFamily,
                fontSize: isFocusMode ? undefined : `${editorFontSize}px`,
                lineHeight: isFocusMode ? undefined : editorLineHeight
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
            >
              {!isFocusMode && <EditorToolbar editor={editor} />}
              
              <div className={`flex-1 ${isFocusMode ? 'px-8 pt-8' : 'px-10 pb-10'}`}>
                <h1 className={`text-3xl font-bold mb-6 text-[var(--color-text-primary)] pb-4 border-b border-[var(--color-border)]`} style={{ fontFamily: isFocusMode ? 'inherit' : 'sans-serif' }}>
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
                  
                  {isSingleWord && (
                    <>
                      <div className="w-px bg-[var(--color-border)]"></div>
                      <button 
                        onClick={handleFetchSynonyms}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                      >
                        <BookOpen size={16} /> Sinónimos
                      </button>
                    </>
                  )}

                  <div className="w-px bg-[var(--color-border)]"></div>
                  <button 
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#fbbf24' }).run()}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                      editor.isActive('highlight') 
                        ? 'bg-yellow-500/30 text-yellow-500' 
                        : 'text-[var(--color-text-primary)] hover:bg-yellow-500/20 hover:text-yellow-500'
                    }`}
                    title="Marcar nota / Resaltar"
                  >
                    Resaltar
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

      {!isFocusMode && (
        <SceneInspector 
          onGenerate={handleGenerateScene} 
          isGenerating={isGeneratingScene} 
          isOpen={isInspectorOpen}
          onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
        />
      )}

      {!isFocusMode && !isInspectorOpen && activeSceneId && (
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
