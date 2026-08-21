import React, { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { ChevronDown, ChevronRight, FileText, Plus, Folder, Trash2, AlertCircle, Film, Palette, BookOpen, X } from 'lucide-react';

interface ManuscriptSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function ManuscriptSidebar({ mobileOpen = false, setMobileOpen }: ManuscriptSidebarProps) {
  const { 
    tree, 
    activeSceneId, 
    setActiveSceneId, 
    createChapter, 
    createScene, 
    deleteChapter, 
    deleteScene, 
    updateChapter, 
    updateScene, 
    reorderTree 
  } = useManuscriptStore();

  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  
  // DnD State
  const [draggedScene, setDraggedScene] = useState<{ id: number, chapterId: number } | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<number | null>(null);

  // Deletion Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'chapter' | 'scene';
    id: number;
    title: string;
  } | null>(null);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleCreateChapter = async () => {
    await createChapter();
  };

  const handleCreateScene = async (chapterId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
    await createScene(chapterId);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'chapter') {
      await deleteChapter(itemToDelete.id);
    } else {
      await deleteScene(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const handleDropScene = async (targetSceneId: number, targetChapterId: number) => {
    if (!draggedScene || draggedScene.id === targetSceneId) {
      setDragOverSceneId(null);
      return;
    }

    if (!tree) return;

    // Create a copy of the chapters
    const chaptersCopy = JSON.parse(JSON.stringify(tree.chapters));
    
    // Find source and target chapters
    const sourceChapter = chaptersCopy.find((c: any) => c.id === draggedScene.chapterId);
    const targetChapter = chaptersCopy.find((c: any) => c.id === targetChapterId);
    
    if (!sourceChapter || !targetChapter) return;

    // Find and remove the dragged scene
    const sceneIndex = sourceChapter.scenes.findIndex((s: any) => s.id === draggedScene.id);
    const [scene] = sourceChapter.scenes.splice(sceneIndex, 1);
    
    // Find insert index
    const insertIndex = targetChapter.scenes.findIndex((s: any) => s.id === targetSceneId);
    
    // Insert scene
    targetChapter.scenes.splice(insertIndex, 0, scene);
    
    // Prepare items for API: update order and parent_id for all affected scenes
    const itemsToUpdate: { id: number, type: string, order: number, parent_id: number }[] = [];
    
    sourceChapter.scenes.forEach((s: any, idx: number) => {
      itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: sourceChapter.id });
    });
    
    if (sourceChapter.id !== targetChapter.id) {
      targetChapter.scenes.forEach((s: any, idx: number) => {
        if (!itemsToUpdate.find(i => i.id === s.id)) {
          itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: targetChapter.id });
        }
      });
    }

    setDragOverSceneId(null);
    setDraggedScene(null);
    await reorderTree(itemsToUpdate);
  };

  const handleDropOnChapter = async (targetChapterId: number) => {
    if (!draggedScene || draggedScene.chapterId === targetChapterId) {
       return;
    }
    if (!tree) return;
    const chaptersCopy = JSON.parse(JSON.stringify(tree.chapters));
    const sourceChapter = chaptersCopy.find((c: any) => c.id === draggedScene.chapterId);
    const targetChapter = chaptersCopy.find((c: any) => c.id === targetChapterId);
    
    if (!sourceChapter || !targetChapter) return;

    const sceneIndex = sourceChapter.scenes.findIndex((s: any) => s.id === draggedScene.id);
    const [scene] = sourceChapter.scenes.splice(sceneIndex, 1);
    targetChapter.scenes.push(scene);

    const itemsToUpdate: any[] = [];
    sourceChapter.scenes.forEach((s: any, idx: number) => {
      itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: sourceChapter.id });
    });
    targetChapter.scenes.forEach((s: any, idx: number) => {
      if (!itemsToUpdate.find(i => i.id === s.id)) {
        itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: targetChapter.id });
      }
    });

    setDragOverSceneId(null);
    setDraggedScene(null);
    await reorderTree(itemsToUpdate);
  };

  if (!tree) return null;

  return (
    <>
    {/* Mobile Overlay Backdrop */}
    {mobileOpen && (
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        onClick={() => setMobileOpen?.(false)}
      />
    )}

    <div className={`
      fixed md:static inset-y-0 left-0 z-[70]
      w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full flex flex-col shrink-0 select-none
      transition-transform duration-300
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Cabecera Sidebar */}
      <div className="h-14 px-4 flex items-center justify-between gap-2 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {tree.project_type === 'screenplay' ? (
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 shrink-0" title="Guion Cine/TV">
              <Film size={14} />
            </span>
          ) : tree.project_type === 'manga' ? (
            <span className="p-1 rounded bg-purple-500/10 text-purple-400 shrink-0" title="Guion Manga/Cómic">
              <Palette size={14} />
            </span>
          ) : (
            <span className="p-1 rounded bg-blue-500/10 text-blue-400 shrink-0" title="Novela">
              <BookOpen size={14} />
            </span>
          )}
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider truncate" title={tree.title}>
            {tree.title}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={handleCreateChapter}
            className="p-1.5 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-indigo-400 rounded-md transition-colors"
            title={tree.project_type === 'screenplay' ? "Añadir nueva secuencia" : "Añadir nuevo capítulo"}
          >
            <Plus size={16} />
          </button>
          {/* Close button for mobile */}
          <button 
            onClick={() => setMobileOpen?.(false)}
            className="md:hidden p-1.5 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Lista de Capítulos y Escenas */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tree.chapters.map(chapter => {
          const isExpanded = expandedChapters[chapter.id] !== false; // Default expanded

          return (
            <div key={chapter.id} className="space-y-1">
              {/* Chapter Header */}
              <div 
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[var(--color-surface-hover)] rounded-md group transition-colors cursor-pointer"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-center gap-2 text-[var(--color-text-primary)] flex-1 min-w-0 mr-2">
                  {isExpanded ? <ChevronDown size={16} className="shrink-0 text-[var(--color-text-secondary)]" /> : <ChevronRight size={16} className="shrink-0 text-[var(--color-text-secondary)]" />}
                  <Folder size={16} className="text-indigo-400 shrink-0" />
                  <EditableTitle 
                    initialTitle={chapter.title} 
                    onSave={(newTitle) => updateChapter(chapter.id, { title: newTitle })} 
                  />
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={(e) => handleCreateScene(chapter.id, e)}
                    className="p-1 hover:bg-[#6366f1]/20 hover:text-[#6366f1] text-[var(--color-text-secondary)] rounded transition-colors"
                    title={tree.project_type === 'manga' ? "Añadir página" : tree.project_type === 'screenplay' ? "Añadir escena de guion" : "Añadir escena"}
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete({ type: 'chapter', id: chapter.id, title: chapter.title });
                    }}
                    className="p-1 hover:bg-red-500/20 hover:text-red-400 text-[var(--color-text-secondary)] rounded transition-colors"
                    title={tree.project_type === 'screenplay' ? "Eliminar secuencia" : "Eliminar capítulo"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Scenes List */}
              {isExpanded && (
                <div 
                  className="pl-6 space-y-1 min-h-[20px]"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     if (chapter.scenes.length === 0) {
                        handleDropOnChapter(chapter.id);
                     }
                  }}
                >
                  {chapter.scenes.map(scene => (
                    <div
                      key={scene.id}
                      draggable
                      onDragStart={() => setDraggedScene({ id: scene.id, chapterId: chapter.id })}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSceneId(scene.id);
                      }}
                      onDragLeave={() => setDragOverSceneId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDropScene(scene.id, chapter.id);
                      }}
                      onClick={() => setActiveSceneId(scene.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer group/scene ${
                        activeSceneId === scene.id 
                          ? 'bg-[#6366f1]/20 text-[#6366f1] font-medium' 
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                      } ${dragOverSceneId === scene.id ? 'border-t-2 border-[#6366f1]' : ''} ${draggedScene?.id === scene.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <FileText size={14} className="shrink-0" />
                        <EditableTitle 
                          initialTitle={scene.title} 
                          onSave={(newTitle) => updateScene(scene.id, { title: newTitle })} 
                        />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ type: 'scene', id: scene.id, title: scene.title });
                        }}
                        className="opacity-0 group-hover/scene:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-[var(--color-text-secondary)] rounded transition-opacity shrink-0"
                        title="Eliminar escena"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {chapter.scenes.length === 0 && (
                    <div className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] italic">
                      Vacío
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón Inferior para Añadir Capítulo */}
      <div className="p-2 border-t border-[var(--color-border)] shrink-0">
        <button
          onClick={handleCreateChapter}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:text-indigo-400 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors border border-dashed border-[var(--color-border)] hover:border-indigo-400/40"
        >
          <Plus size={14} />
          <span>Añadir Capítulo</span>
        </button>
      </div>

      {/* Modal de Confirmación de Eliminación Propio de la App */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                {itemToDelete.type === 'chapter' ? '¿Eliminar capítulo?' : '¿Eliminar escena?'}
              </h3>
            </div>
            
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong className="text-[var(--color-text-primary)]">"{itemToDelete.title}"</strong>
              {itemToDelete.type === 'chapter' ? ' y todas las escenas que contiene' : ''}? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function EditableTitle({ initialTitle, onSave }: { initialTitle: string, onSave: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialTitle);

  useEffect(() => {
    setValue(initialTitle);
  }, [initialTitle]);

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          if (value.trim() && value !== initialTitle) onSave(value.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            if (value.trim() && value !== initialTitle) onSave(value.trim());
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
            setValue(initialTitle);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-transparent border-b border-[#6366f1] focus:outline-none w-full truncate text-sm"
      />
    );
  }

  return (
    <span 
      className="truncate w-full block" 
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Doble clic para renombrar"
    >
      {initialTitle}
    </span>
  );
}
