import React, { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { ChevronDown, ChevronRight, FileText, Plus, Folder } from 'lucide-react';

export default function ManuscriptSidebar() {
  const { tree, activeSceneId, setActiveSceneId, createScene, updateChapter, updateScene, reorderTree } = useManuscriptStore();
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  
  // DnD State
  const [draggedScene, setDraggedScene] = useState<{ id: number, chapterId: number } | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<number | null>(null);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleCreateScene = (chapterId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = prompt("Nombre de la nueva escena:");
    if (title) {
      createScene(chapterId, title);
      // Ensure chapter is expanded
      setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
    }
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
    
    // We update orders for both chapters (if they are different) or just the one (if same)
    sourceChapter.scenes.forEach((s: any, idx: number) => {
      itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: sourceChapter.id });
    });
    
    if (sourceChapter.id !== targetChapter.id) {
      targetChapter.scenes.forEach((s: any, idx: number) => {
        // avoid pushing twice if chapter is same (already handled above)
        if (!itemsToUpdate.find(i => i.id === s.id)) {
          itemsToUpdate.push({ id: s.id, type: 'scene', order: idx + 1, parent_id: targetChapter.id });
        }
      });
    }

    setDragOverSceneId(null);
    setDraggedScene(null);
    
    // Call API (this will also optimistically or eventually update the store)
    await reorderTree(itemsToUpdate);
  };

  const handleDropOnChapter = async (targetChapterId: number) => {
    if (!draggedScene || draggedScene.chapterId === targetChapterId) {
       return;
    }
    // Drop at the end of the chapter
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
    <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider truncate">
          {tree.title}
        </h2>
      </div>

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
                <div className="flex items-center gap-2 text-[var(--color-text-primary)] w-full overflow-hidden">
                  {isExpanded ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                  <Folder size={16} className="text-indigo-400 shrink-0" />
                  <EditableTitle 
                    initialTitle={chapter.title} 
                    onSave={(newTitle) => updateChapter(chapter.id, { title: newTitle })} 
                  />
                </div>
                <button 
                  onClick={(e) => handleCreateScene(chapter.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#6366f1]/20 hover:text-[#6366f1] text-[var(--color-text-secondary)] rounded shrink-0"
                  title="Añadir escena"
                >
                  <Plus size={14} />
                </button>
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
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                        activeSceneId === scene.id 
                          ? 'bg-[#6366f1]/20 text-[#6366f1] font-medium' 
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                      } ${dragOverSceneId === scene.id ? 'border-t-2 border-[#6366f1]' : ''} ${draggedScene?.id === scene.id ? 'opacity-50' : ''}`}
                    >
                      <FileText size={14} className="shrink-0" />
                      <EditableTitle 
                        initialTitle={scene.title} 
                        onSave={(newTitle) => updateScene(scene.id, { title: newTitle })} 
                      />
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
    </div>
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
        className="bg-transparent border-b border-[#6366f1] focus:outline-none w-full truncate"
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
