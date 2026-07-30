import React, { useState } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { ChevronDown, ChevronRight, FileText, Plus, Folder } from 'lucide-react';

export default function ManuscriptSidebar() {
  const { tree, activeSceneId, setActiveSceneId, createScene } = useManuscriptStore();
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

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
              <button 
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[var(--color-surface-hover)] rounded-md group transition-colors"
              >
                <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Folder size={16} className="text-indigo-400" />
                  <span className="font-medium text-sm truncate">{chapter.title}</span>
                </div>
                <button 
                  onClick={(e) => handleCreateScene(chapter.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#6366f1]/20 hover:text-[#6366f1] text-[var(--color-text-secondary)] rounded"
                  title="Añadir escena"
                >
                  <Plus size={14} />
                </button>
              </button>

              {/* Scenes List */}
              {isExpanded && (
                <div className="pl-6 space-y-1">
                  {chapter.scenes.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => setActiveSceneId(scene.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        activeSceneId === scene.id 
                          ? 'bg-[#6366f1]/20 text-[#6366f1] font-medium' 
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <FileText size={14} />
                      <span className="truncate">{scene.title}</span>
                    </button>
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
