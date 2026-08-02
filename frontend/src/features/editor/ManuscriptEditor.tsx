import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AutoTagExtension } from './extensions/AutoTagExtension';
import { useCodexStore } from '../../store/useCodexStore';
import { useAppStore } from '../../store/useAppStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { Wand2, Sparkles, Shrink, PanelRightOpen, Check, X as CloseIcon, BookOpen } from 'lucide-react';
import type { CodexEntry } from '../../api/codex';
import ManuscriptSidebar from './ManuscriptSidebar';
import SceneInspector from './SceneInspector';
import { useSettingsStore } from '../../store/useSettingsStore';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import EditorToolbar from './EditorToolbar';

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

  // Dynamic Scrollbar Width Observer for 100% pixel-perfect alignment
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateScrollbar = () => {
      const sw = el.offsetWidth - el.clientWidth;
      setScrollbarWidth(sw);
    };

    updateScrollbar();
    const ro = new ResizeObserver(updateScrollbar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSceneId]);

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

  // AI Custom Menu Popover State
  const [aiMenuPopover, setAiMenuPopover] = useState<{
    visible: boolean;
    x: number;
    y: number;
    customInstruction: string;
  }>({ visible: false, x: 0, y: 0, customInstruction: '' });

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

    setAiMenuPopover(prev => ({ ...prev, visible: false })); // Cerrar menu flotante si estaba abierto

    const token = useAppStore.getState().token;
    setIsAiLoading(true);

    let xPos = coords.left;
    let yPos = coords.bottom + 10;
    
    // Adjust if too close to bottom (assuming modal max height ~400px)
    if (yPos + 400 > window.innerHeight) {
      yPos = coords.top - 410;
    }
    // Adjust if too far right
    if (xPos + 384 > window.innerWidth) { // 384px = w-96
      xPos = window.innerWidth - 400;
    }

    setAiPreview({
      visible: true,
      originalText: selectedText,
      generatedText: '',
      from,
      to,
      x: xPos,
      y: yPos
    });

    try {
      const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
      const res = await fetch(`${baseUrl}/ai/inline-edit`, {
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

  const handleGenerateScene = async (beatsText: string, style: string = 'novelist', customStylePrompt?: string) => {
    if (!editor || !activeSceneId) return;
    const token = useAppStore.getState().token;
    
    setIsGeneratingScene(true);
    // Limpiamos el editor para la nueva generación
    editor.commands.setContent('');
    
    try {
      const prompt = `Escribe la prosa para esta escena detalladamente siguiendo estos beats (eventos clave):\n${beatsText}`;
      
      const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
      const res = await fetch(`${baseUrl}/ai/generate-scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scene_id: activeSceneId,
          prompt: prompt,
          style: style,
          custom_style_prompt: customStylePrompt
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
    let xPos = coords.left;
    let yPos = coords.bottom + 10;
    
    if (yPos + 300 > window.innerHeight) {
      yPos = coords.top - 310;
    }
    if (xPos + 256 > window.innerWidth) { // 256px = w-64
      xPos = window.innerWidth - 270;
    }

    setSynonymsPopover({
      visible: true, word, synonyms: [], isLoading: true, x: xPos, y: yPos, from, to
    });
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
      const res = await fetch(`${baseUrl}/ai/synonyms?word=${encodeURIComponent(word)}`);
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

  const handleOpenAiMenu = (fromToolbar = false) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    let xPos = window.innerWidth / 2 - 144;
    let yPos = 140;

    if (!fromToolbar && from !== to) {
      try {
        const coords = editor.view.coordsAtPos(from);
        xPos = coords.left;
        yPos = coords.bottom + 12;
      } catch (e) {
        // fallback
      }
    }

    if (yPos + 360 > window.innerHeight) {
      yPos = Math.max(20, window.innerHeight - 380);
    }
    if (xPos + 295 > window.innerWidth) {
      xPos = Math.max(20, window.innerWidth - 310);
    }

    setAiMenuPopover({
      visible: true,
      x: Math.max(20, xPos),
      y: Math.max(20, yPos),
      customInstruction: ''
    });
  };

  const AI_PRESETS = [
    { label: '🎭 Mostrar, no contar', prompt: 'Reescribe este texto usando la técnica de "mostrar, no contar" (show, don\'t tell). Hazlo más inmersivo y sensorial.' },
    { label: '✨ Más descriptivo', prompt: 'Expande este texto añadiendo más detalles descriptivos sobre el entorno y las sensaciones.' },
    { label: '✂️ Resumir', prompt: 'Resume este texto en una frase más corta y directa.' },
    { label: '👁️ 1ra Persona', prompt: 'Reescribe este texto en primera persona (desde el punto de vista del protagonista).' },
    { label: '👁️ 3ra Persona', prompt: 'Reescribe este texto en tercera persona.' },
  ];

  const selectedTextForMenu = editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ').trim() : '';
  const wordCount = selectedTextForMenu.split(/\s+/).filter(w => w.length > 0).length;
  const isSingleWord = wordCount === 1;
  const hasSelection = editor ? !editor.state.selection.empty : false;

  return (
    <div className="flex h-full w-full bg-[var(--color-background)] overflow-hidden">
      {!isFocusMode && <ManuscriptSidebar />}

      {/* COLUMNA CENTRAL: BARRA FIJA SIEMPRE VISIBLE + ÁREA DE ESCRITURA CON SCROLL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* 1. BARRA SUPERIOR FIJA (SIEMPRE VISIBLE Y ALINEADA EXACTA CON EL MANUSCRITO) */}
        {!isFocusMode && activeSceneId && (
          <div 
            className="h-14 pl-8 flex items-center shrink-0 z-20"
            style={{ paddingRight: `calc(2rem + ${scrollbarWidth}px)` }}
          >
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm px-3 py-1 flex items-center justify-between">
                <EditorToolbar 
                  editor={editor} 
                  onOpenAiMenu={() => handleOpenAiMenu(true)}
                  onFetchSynonyms={handleFetchSynonyms}
                  isAiLoading={isAiLoading || isGeneratingScene}
                  isSingleWord={isSingleWord}
                  hasSelection={hasSelection}
                  saveStatus={saveStatus}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. ÁREA DE ESCRITURA CON SCROLL (EL PERGAMINO) */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto relative ${isFocusMode ? 'p-0 w-full' : 'px-8 py-4'}`}
        >
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
              
              {tooltip.entry.image_url && (
                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden border border-[var(--color-border)]">
                  <img src={tooltip.entry.image_url} alt={tooltip.entry.name} className="w-full h-full object-cover" />
                </div>
              )}

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

          {/* AI Custom Action Menu Popover */}
          {aiMenuPopover.visible && !aiPreview.visible && (
            <div 
              className="fixed z-[60] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-0 rounded-xl w-72 flex flex-col overflow-hidden"
              style={{ left: aiMenuPopover.x, top: aiMenuPopover.y }}
            >
              <div className="flex justify-between items-center p-3 border-b border-[var(--color-border)] bg-indigo-500/10">
                <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm">
                  <Sparkles size={16} /> 
                  Acción Mágica
                </div>
                <button onClick={() => setAiMenuPopover(prev => ({ ...prev, visible: false }))} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <CloseIcon size={16} />
                </button>
              </div>
              
              <div className="p-3 border-b border-[var(--color-border)]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (aiMenuPopover.customInstruction.trim()) {
                      handleAiAction(aiMenuPopover.customInstruction);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. Hazlo sonar más siniestro..."
                    value={aiMenuPopover.customInstruction}
                    onChange={(e) => setAiMenuPopover(prev => ({ ...prev, customInstruction: e.target.value }))}
                    className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)]"
                  />
                  <button 
                    type="submit"
                    disabled={!aiMenuPopover.customInstruction.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-md disabled:opacity-50 transition-colors"
                  >
                    <Wand2 size={16} />
                  </button>
                </form>
              </div>

              <div className="p-2 flex flex-col gap-1 max-h-[250px] overflow-y-auto">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 px-2 mt-1">Presets Rápidos</div>
                {AI_PRESETS.map((preset, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAiAction(preset.prompt)}
                    className="text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-sm transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSceneId ? (
            <div 
              className={isFocusMode ? 'min-h-[100vh] w-full max-w-[900px] mx-auto cursor-text flex flex-col pt-12' : 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl min-h-[75vh] cursor-text flex flex-col p-10'}
              style={{
                fontFamily: isFocusMode ? undefined : editorFontFamily,
                fontSize: isFocusMode ? undefined : `${editorFontSize}px`,
                lineHeight: isFocusMode ? undefined : editorLineHeight
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
            >
              <h1 className={`text-3xl font-bold mb-6 text-[var(--color-text-primary)] pb-4 border-b border-[var(--color-border)]`} style={{ fontFamily: isFocusMode ? 'inherit' : 'sans-serif' }}>
                {activeScene?.title || 'Sin Título'}
              </h1>
            
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[50vh] text-[var(--color-text-secondary)]">
              Selecciona una escena en la barra lateral para empezar a escribir.
            </div>
          )}
        </div>
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
