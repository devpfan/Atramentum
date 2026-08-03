import React from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import type { Scene } from '../../api/manuscript';
import type { MangaPageCanvasData } from './types';

interface MangaPageFilmstripProps {
  pages: Scene[];
  activePageId: number | null;
  onSelectPage: (id: number) => void;
  onCreatePage: () => void;
}

export const MangaPageFilmstrip: React.FC<MangaPageFilmstripProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage
}) => {
  return (
    <div className="h-28 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-2 flex items-center gap-3 overflow-x-auto select-none shrink-0 z-20">
      <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap mr-1 flex flex-col justify-center">
        <span>Páginas</span>
        <span className="text-[10px] text-zinc-500 font-normal">{pages.length} totales</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto py-1">
        {pages.map((page, index) => {
          const isActive = page.id === activePageId;
          
          let imageUrl: string | null = null;
          let bubbleCount = 0;
          try {
            if (page.content && page.content.startsWith('{')) {
              const data: MangaPageCanvasData = JSON.parse(page.content);
              imageUrl = (data.images && data.images.length > 0) ? data.images[0].url : data.image_url || null;
              bubbleCount = data.bubbles ? data.bubbles.length : 0;
            }
          } catch {
            // fallback
          }

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(page.id)}
              className={`group relative flex flex-col items-center justify-between w-16 h-22 rounded-md border transition-all cursor-pointer overflow-hidden shrink-0 ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                  : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-zinc-500'
              }`}
            >
              {/* Thumbnail Image or Empty State */}
              <div className="w-full flex-1 flex items-center justify-center bg-zinc-900/50 overflow-hidden relative">
                {imageUrl ? (
                  <img 
                    src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`} 
                    alt={`Pág ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                )}

                {/* Bubbles count badge */}
                {bubbleCount > 0 && (
                  <span className="absolute bottom-1 right-1 bg-zinc-950/80 text-zinc-200 text-[9px] px-1 rounded-sm font-mono">
                    💬{bubbleCount}
                  </span>
                )}
              </div>

              {/* Page Number Label */}
              <div className={`w-full py-0.5 text-center text-[10px] font-medium truncate px-1 ${
                isActive ? 'text-indigo-400 bg-indigo-500/20' : 'text-zinc-400 bg-[var(--color-surface)]'
              }`}>
                Pág. {index + 1}
              </div>
            </div>
          );
        })}

        {/* Add New Page Button */}
        <button
          onClick={onCreatePage}
          className="flex flex-col items-center justify-center w-16 h-22 rounded-md border border-dashed border-[var(--color-border)] hover:border-indigo-500 hover:bg-indigo-500/5 text-[var(--color-text-secondary)] hover:text-indigo-400 transition-all shrink-0 gap-1"
          title="Añadir nueva página al capítulo"
        >
          <Plus size={18} />
          <span className="text-[10px] font-medium">+ Página</span>
        </button>
      </div>
    </div>
  );
};
