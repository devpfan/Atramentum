import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Check, 
  Loader2,
  MessageSquare,
  Cloud,
  Zap,
  BookOpen,
  Volume2,
  Undo2,
  Redo2,
  Grid,
  Plus,
  LayoutTemplate
} from 'lucide-react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { manuscriptApi } from '../../api/manuscript';
import { MangaBubbleComponent } from './MangaBubbleComponent';
import { MangaImageComponent } from './MangaImageComponent';
import { MangaPanelGrid } from './MangaPanelGrid';
import { MangaPageFilmstrip } from './MangaPageFilmstrip';
import type { 
  MangaBubble, 
  MangaBubbleType, 
  MangaPageCanvasData, 
  MangaImageItem, 
  MangaPanelLayout 
} from './types';

type StudioTab = 'panels' | 'lettering' | 'canvas';

export const MangaCanvasEditor: React.FC = () => {
  const { 
    tree, 
    activeSceneId, 
    setActiveSceneId, 
    updateScene, 
    createScene 
  } = useManuscriptStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>('panels');
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Find active scene & chapter
  const activeSceneInfo = useMemo(() => {
    if (!tree || !activeSceneId) return null;
    for (const chapter of tree.chapters) {
      const scene = chapter.scenes.find(s => s.id === activeSceneId);
      if (scene) {
        return { scene, chapter, siblingScenes: chapter.scenes };
      }
    }
    return null;
  }, [tree, activeSceneId]);

  const activeScene = activeSceneInfo?.scene;
  const activeChapter = activeSceneInfo?.chapter;
  const siblingScenes = activeSceneInfo?.siblingScenes || [];

  // Canvas Data State
  const [canvasData, setCanvasData] = useState<MangaPageCanvasData>({
    type: 'manga_canvas',
    layout: 'none',
    images: [],
    page_width: 680,
    bubbles: []
  });

  // Undo / Redo History
  const [history, setHistory] = useState<MangaPageCanvasData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  const pushToHistory = useCallback((newData: MangaPageCanvasData) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newData)));
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevData = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCanvasData(JSON.parse(JSON.stringify(prevData)));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextData = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCanvasData(JSON.parse(JSON.stringify(nextData)));
    }
  }, [history, historyIndex]);

  // Global Keyboard listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Load canvas data when active scene changes
  useEffect(() => {
    if (!activeScene) return;

    let initialData: MangaPageCanvasData = {
      type: 'manga_canvas',
      layout: 'none',
      images: [],
      page_width: 680,
      bubbles: []
    };

    try {
      if (activeScene.content && activeScene.content.startsWith('{')) {
        const parsed = JSON.parse(activeScene.content);
        if (parsed.type === 'manga_canvas') {
          let imagesList: MangaImageItem[] = [];
          if (Array.isArray(parsed.images)) {
            imagesList = parsed.images;
          } else if (parsed.image_url) {
            imagesList = [{
              id: 'legacy_img_1',
              url: parsed.image_url,
              x: 0,
              y: 0,
              width: parsed.page_width || 680,
              zIndex: 1
            }];
          }

          initialData = {
            type: 'manga_canvas',
            layout: parsed.layout || 'none',
            images: imagesList,
            page_width: typeof parsed.page_width === 'number' ? parsed.page_width : 680,
            bubbles: Array.isArray(parsed.bubbles) ? parsed.bubbles : []
          };
        }
      }
    } catch (e) {
      console.error("Error parsing manga canvas content:", e);
    }

    setCanvasData(initialData);
    setHistory([JSON.parse(JSON.stringify(initialData))]);
    setHistoryIndex(0);
    setSelectedBubbleId(null);
    setSelectedImageId(null);
  }, [activeScene?.id]);

  // Debounced auto-save canvas data
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!activeScene) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateScene(activeScene.id, {
          content: JSON.stringify(canvasData)
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error("Error autosaving manga canvas:", err);
        setSaveStatus('saved');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [canvasData, activeScene?.id, updateScene]);

  // Image Upload handler
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!activeScene) return;
    setIsUploading(true);
    try {
      const newImages: MangaImageItem[] = [];
      const currentImages = canvasData.images || [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const res = await manuscriptApi.uploadSceneImage(activeScene.id, file);
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        
        const offset = (currentImages.length + i) % 4;
        newImages.push({
          id: imageId,
          url: res.image_url,
          x: 5 + offset * 10,
          y: 5 + offset * 12,
          width: Math.min(canvasData.page_width || 680, 480),
          zIndex: (currentImages.length + i) + 2
        });
      }

      if (newImages.length > 0) {
        const updated: MangaPageCanvasData = {
          ...canvasData,
          images: [...currentImages, ...newImages]
        };
        setCanvasData(updated);
        pushToHistory(updated);
        setSelectedImageId(newImages[newImages.length - 1].id);
      }
    } catch (err) {
      console.error("Error subiendo imagen de página:", err);
      alert("Error al subir la imagen. Verifica que sea PNG, JPG o WebP.");
    } finally {
      setIsUploading(false);
    }
  };

  // Update specific Image Item
  const handleUpdateImage = (id: string, imageUpdate: Partial<MangaImageItem>) => {
    setCanvasData(prev => {
      const currentImages = prev.images || [];
      return {
        ...prev,
        images: currentImages.map(img => (img.id === id ? { ...img, ...imageUpdate } : img))
      };
    });
  };

  // Delete specific image
  const handleDeleteImage = (id: string) => {
    const currentImages = canvasData.images || [];
    const updated: MangaPageCanvasData = {
      ...canvasData,
      images: currentImages.filter(img => img.id !== id)
    };
    setCanvasData(updated);
    pushToHistory(updated);
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // Bring Image to front
  const handleBringImageToFront = (id: string) => {
    const currentImages = canvasData.images || [];
    const maxZ = Math.max(...currentImages.map(img => img.zIndex || 1), 1);
    handleUpdateImage(id, { zIndex: maxZ + 1 });
  };

  // Send Image to back
  const handleSendImageToBack = (id: string) => {
    const currentImages = canvasData.images || [];
    const minZ = Math.min(...currentImages.map(img => img.zIndex || 1), 1);
    handleUpdateImage(id, { zIndex: Math.max(1, minZ - 1) });
  };

  // Layout Template change
  const handleSelectLayout = (layout: MangaPanelLayout) => {
    const updated: MangaPageCanvasData = {
      ...canvasData,
      layout
    };
    setCanvasData(updated);
    pushToHistory(updated);
  };

  // Add Bubble handler
  const handleAddBubble = (type: MangaBubbleType = 'speech') => {
    const newBubble: MangaBubble = {
      id: `bubble_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      text: type === 'sfx' ? '¡¡DODODO!!' : type === 'narrative' ? 'En aquel instante...' : 'Nuevo diálogo...',
      x: 35 + (canvasData.bubbles.length % 5) * 5,
      y: 25 + (canvasData.bubbles.length % 5) * 6,
      width: type === 'sfx' ? 140 : 160,
      fontSize: type === 'sfx' ? 20 : 14
    };

    const updated: MangaPageCanvasData = {
      ...canvasData,
      bubbles: [...canvasData.bubbles, newBubble]
    };
    setCanvasData(updated);
    pushToHistory(updated);
    setSelectedBubbleId(newBubble.id);
    setSelectedImageId(null);
  };

  // Update specific bubble
  const handleUpdateBubble = (id: string, bubbleUpdate: Partial<MangaBubble>) => {
    setCanvasData(prev => ({
      ...prev,
      bubbles: prev.bubbles.map(b => (b.id === id ? { ...b, ...bubbleUpdate } : b))
    }));
  };

  // Delete bubble
  const handleDeleteBubble = (id: string) => {
    const updated: MangaPageCanvasData = {
      ...canvasData,
      bubbles: canvasData.bubbles.filter(b => b.id !== id)
    };
    setCanvasData(updated);
    pushToHistory(updated);
    if (selectedBubbleId === id) setSelectedBubbleId(null);
  };

  // Update Page Width
  const handleUpdatePageWidth = (page_width: number) => {
    const updated: MangaPageCanvasData = { ...canvasData, page_width };
    setCanvasData(updated);
    pushToHistory(updated);
  };

  // Handle Drag & Drop of Image files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Create next page in active chapter
  const handleCreateNewPage = async () => {
    if (!activeChapter) return;
    const pageNumber = siblingScenes.length + 1;
    const newScene = await createScene(activeChapter.id, `Página ${pageNumber}`);
    if (newScene) {
      setActiveSceneId(newScene.id);
    }
  };

  const pageWidth = canvasData.page_width || 680;
  const currentLayout = canvasData.layout || 'none';
  const images = canvasData.images || [];

  const LAYOUT_OPTIONS: { id: MangaPanelLayout; name: string; icon: string }[] = [
    { id: 'none', name: 'Libre', icon: '🔲' },
    { id: 'splash', name: 'Splash (1)', icon: '🖼️' },
    { id: '4koma', name: '4-Koma', icon: '📜' },
    { id: 'classic-6', name: 'Clásico (6)', icon: '📖' },
    { id: 'dynamic-3', name: 'Dinámico (3)', icon: '⚡' },
    { id: 'action-5', name: 'Acción (5)', icon: '💥' },
    { id: 'webtoon-strip', name: 'Webtoon', icon: '📱' },
  ];

  if (!activeScene) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-text-secondary)] p-8">
        <ImageIcon size={48} className="mb-4 text-zinc-600 animate-pulse" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Ninguna página seleccionada</h3>
        <p className="text-sm mt-1">Selecciona o crea una página en la barra lateral para comenzar el letreado.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-background)] overflow-hidden select-none">
      {/* Hidden File Input (supports multiple images) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files);
          }
        }} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />

      {/* TOP STUDIO BAR: FILA 1 (Información, Pestañas de Modo y Zoom) */}
      <div className="h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-2 md:px-4 flex items-center justify-between gap-2 md:gap-4 shrink-0 z-30 overflow-x-auto no-scrollbar">
        {/* Left: Page Title, Undo/Redo & Save Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider leading-none">
              {activeChapter?.title || 'Capítulo'}
            </span>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[140px] leading-tight">
              {activeScene.title}
            </h2>
          </div>

          <div className="h-5 w-px bg-[var(--color-border)]" />

          {/* Undo & Redo */}
          <div className="flex items-center gap-0.5 bg-[var(--color-background)] p-0.5 rounded-md border border-[var(--color-border)]">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1 rounded text-xs transition-colors ${
                historyIndex > 0 
                  ? 'hover:bg-[var(--color-surface-hover)] text-zinc-200 hover:text-indigo-400' 
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1 rounded text-xs transition-colors ${
                historyIndex < history.length - 1 
                  ? 'hover:bg-[var(--color-surface-hover)] text-zinc-200 hover:text-indigo-400' 
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={13} className="animate-spin text-indigo-400" />
                <span className="text-zinc-400 text-[11px]">Guardando...</span>
              </>
            ) : (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-zinc-400 text-[11px]">Guardado</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Studio Mode Tabs */}
        <div className="flex items-center bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('panels')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'panels'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Grid size={13} />
            <span>Viñetas & Dibujo</span>
          </button>

          <button
            onClick={() => setActiveTab('lettering')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'lettering'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <MessageSquare size={13} />
            <span>Diálogos & Letreado</span>
          </button>

          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <LayoutTemplate size={13} />
            <span>Lienzo & Formato</span>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-[var(--color-background)] rounded-md border border-[var(--color-border)] p-0.5">
            <button
              onClick={() => setZoom(z => Math.max(40, z - 10))}
              className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-[var(--color-text-secondary)]"
              title="Alejar zoom"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-[var(--color-text-secondary)] min-w-[36px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(160, z + 10))}
              className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-[var(--color-text-secondary)]"
              title="Acercar zoom"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-[var(--color-text-secondary)] border-l border-[var(--color-border)] ml-0.5"
              title="100%"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* TOP STUDIO BAR: FILA 2 (Sub-barra contextual según la pestaña activa) */}
      <div className="h-11 bg-zinc-900/95 border-b border-zinc-800 px-2 md:px-4 flex items-center justify-between gap-2 md:gap-4 shrink-0 z-20 overflow-x-auto no-scrollbar">
        {/* TAB 1: Viñetas & Dibujo */}
        {activeTab === 'panels' && (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
                title="Cargar dibujos a esta página"
              >
                {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                <span>+ Añadir Dibujo</span>
              </button>

              <div className="h-4 w-px bg-zinc-750 mx-1" />

              <span className="shrink-0 text-[11px] text-zinc-400 font-medium">Plantilla de Viñetas:</span>

              {/* Panel Layouts Buttons (Horizontal row - always visible!) */}
              <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
                {LAYOUT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectLayout(opt.id)}
                    className={`flex items-center shrink-0 gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      currentLayout === opt.id
                        ? 'bg-indigo-600/30 text-white border border-indigo-500/50 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <span className="shrink-0 text-[11px] text-zinc-500">
              {images.length} {images.length === 1 ? 'dibujo en página' : 'dibujos en página'}
            </span>
          </div>
        )}

        {/* TAB 2: Diálogos & Letreado */}
        {activeTab === 'lettering' && (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[11px] text-zinc-400 font-medium mr-1">Insertar Globos:</span>

              <button
                onClick={() => handleAddBubble('speech')}
                className="flex items-center shrink-0 gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition-colors"
                title="Añadir bocadillo de diálogo estándar"
              >
                <MessageSquare size={13} className="text-indigo-400" />
                <span>+ Diálogo</span>
              </button>

              <button
                onClick={() => handleAddBubble('thought')}
                className="flex items-center shrink-0 gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition-colors"
                title="Añadir bocadillo de pensamiento"
              >
                <Cloud size={13} className="text-sky-400" />
                <span>+ Pensamiento</span>
              </button>

              <button
                onClick={() => handleAddBubble('scream')}
                className="flex items-center shrink-0 gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition-colors"
                title="Añadir bocadillo de grito o impacto"
              >
                <Zap size={13} className="text-amber-400" />
                <span>+ Grito</span>
              </button>

              <button
                onClick={() => handleAddBubble('narrative')}
                className="flex items-center shrink-0 gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition-colors"
                title="Añadir cartela de narrador"
              >
                <BookOpen size={13} className="text-emerald-400" />
                <span>+ Narrador</span>
              </button>

              <button
                onClick={() => handleAddBubble('sfx')}
                className="flex items-center shrink-0 gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-md transition-colors"
                title="Añadir onomatopeya sonora / SFX"
              >
                <Volume2 size={13} className="text-rose-400" />
                <span>+ SFX / Onomatopeya</span>
              </button>
            </div>

            <span className="shrink-0 text-[11px] text-zinc-500">
              {canvasData.bubbles.length} {canvasData.bubbles.length === 1 ? 'globo colocado' : 'globos colocados'}
            </span>
          </div>
        )}

        {/* TAB 3: Lienzo & Formato */}
        {activeTab === 'canvas' && (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[11px] text-zinc-400 font-medium">Tamaño de Publicación:</span>

              <div className="flex items-center shrink-0 gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => handleUpdatePageWidth(680)}
                  className={`shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    pageWidth === 680
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  📖 Manga B5 (680px)
                </button>
                <button
                  onClick={() => handleUpdatePageWidth(800)}
                  className={`shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    pageWidth === 800
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  📄 Cómic A4 (800px)
                </button>
                <button
                  onClick={() => handleUpdatePageWidth(560)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    pageWidth === 560
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  📱 Webtoon (560px)
                </button>
                <button
                  onClick={() => handleUpdatePageWidth(1100)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    pageWidth === 1100
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  🖼️ Doble Página (1100px)
                </button>
              </div>
            </div>

            {/* Direct Zoom Presets */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-zinc-400 mr-1">Zoom rápido:</span>
              {[50, 75, 100, 125, 150].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    zoom === z ? 'bg-zinc-800 text-indigo-400 font-semibold border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-850'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace (Scrollable Canvas Area) */}
      <div 
        className="flex-1 overflow-auto bg-zinc-950/90 p-8 flex items-start justify-center relative"
        onClick={() => {
          setSelectedBubbleId(null);
          setSelectedImageId(null);
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Canvas Board */}
        <div
          ref={canvasRef}
          style={{
            width: `${(pageWidth * zoom) / 100}px`,
            minHeight: `${(960 * zoom) / 100}px`,
            transformOrigin: 'top center'
          }}
          className={`relative bg-white shadow-2xl rounded-sm transition-all duration-150 overflow-hidden flex flex-col border ${
            isDraggingFile ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-zinc-900 border-indigo-500' : 'border-zinc-800'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedBubbleId(null);
              setSelectedImageId(null);
            }
          }}
        >
          {/* Panel Grid Layer (Frames & Gutters) */}
          <MangaPanelGrid layout={currentLayout} />

          {/* Empty Canvas Notice if no images and free layout */}
          {images.length === 0 && currentLayout === 'none' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[960px] flex flex-col items-center justify-center p-8 text-center bg-zinc-50 text-zinc-600 hover:bg-zinc-100 cursor-pointer border-2 border-dashed border-zinc-300 transition-colors m-6 rounded-xl"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 shadow-sm">
                <Upload size={36} />
              </div>
              <h4 className="text-base font-semibold text-zinc-800 mb-1">
                Lienzo de Manga Vacío
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Haz clic aquí o arrastra tus dibujos para colocarlos libremente sobre la página. Puedes añadir varias imágenes y distribuirlas en viñetas.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow hover:bg-indigo-700 transition-colors">
                  + Añadir Dibujos
                </span>
                <span 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('panels'); }}
                  className="px-3 py-1.5 bg-zinc-200 text-zinc-800 text-xs font-medium rounded-md hover:bg-zinc-300 transition-colors"
                >
                  📐 Elegir Viñetas
                </span>
              </div>
            </div>
          )}

          {/* Draggable & Resizable Images Layer */}
          {images.map(image => (
            <MangaImageComponent
              key={image.id}
              image={image}
              isSelected={selectedImageId === image.id}
              onSelect={() => {
                setSelectedImageId(image.id);
                setSelectedBubbleId(null);
              }}
              onUpdate={(updated) => handleUpdateImage(image.id, updated)}
              onDelete={() => handleDeleteImage(image.id)}
              onBringToFront={() => handleBringImageToFront(image.id)}
              onSendToBack={() => handleSendImageToBack(image.id)}
              canvasRef={canvasRef}
            />
          ))}

          {/* Interactive Manga Bubbles Layer (Always over images) */}
          {canvasData.bubbles.map(bubble => (
            <MangaBubbleComponent
              key={bubble.id}
              bubble={bubble}
              isSelected={selectedBubbleId === bubble.id}
              onSelect={() => {
                setSelectedBubbleId(bubble.id);
                setSelectedImageId(null);
              }}
              onUpdate={(updated) => handleUpdateBubble(bubble.id, updated)}
              onDelete={() => handleDeleteBubble(bubble.id)}
              canvasRef={canvasRef}
            />
          ))}

          {/* Drag Overlay indicator */}
          {isDraggingFile && (
            <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-indigo-500 z-50">
              <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-xl flex items-center gap-2">
                <Upload size={18} className="animate-bounce text-indigo-400" />
                <span>Suelta las imágenes para colocarlas en el lienzo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Filmstrip */}
      <MangaPageFilmstrip
        pages={siblingScenes}
        activePageId={activeScene.id}
        onSelectPage={(id) => setActiveSceneId(id)}
        onCreatePage={handleCreateNewPage}
      />
    </div>
  );
};
