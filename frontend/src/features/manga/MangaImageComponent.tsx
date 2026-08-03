import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Move, ArrowUp, ArrowDown } from 'lucide-react';
import type { MangaImageItem } from './types';

interface MangaImageComponentProps {
  image: MangaImageItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: Partial<MangaImageItem>) => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const MangaImageComponent: React.FC<MangaImageComponentProps> = ({
  image,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onBringToFront,
  onSendToBack,
  canvasRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const resizeStartRef = useRef<{ startX: number; initialWidth: number }>({
    startX: 0,
    initialWidth: 0
  });

  // Handle Dragging
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (!canvasRef.current) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: image.x,
      initialY: image.y
    };
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      initialWidth: image.width || 320
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartRef.current.startX;
        const deltaY = e.clientY - dragStartRef.current.startY;

        const deltaPercentX = (deltaX / rect.width) * 100;
        const deltaPercentY = (deltaY / rect.height) * 100;

        let newX = dragStartRef.current.initialX + deltaPercentX;
        let newY = dragStartRef.current.initialY + deltaPercentY;

        // Clamp inside canvas
        newX = Math.max(0, Math.min(95, newX));
        newY = Math.max(0, Math.min(95, newY));

        onUpdate({ x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.startX;
        const newWidth = Math.max(80, Math.min(1200, resizeStartRef.current.initialWidth + deltaX));
        onUpdate({ width: newWidth });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, image.x, image.y, onUpdate, canvasRef]);

  const imageUrl = image.url.startsWith('http') ? image.url : `http://localhost:8000${image.url}`;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        left: `${image.x}%`,
        top: `${image.y}%`,
        width: `${image.width || 320}px`,
        position: 'absolute',
        zIndex: image.zIndex || 5,
        touchAction: 'none'
      }}
      className={`group cursor-move select-none transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900 shadow-2xl' : 'hover:ring-1 hover:ring-blue-400/50'
      }`}
    >
      {/* Floating Toolbar when Selected */}
      {isSelected && (
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-md px-2 py-1 flex items-center gap-1.5 shadow-2xl border border-zinc-700 text-xs whitespace-nowrap z-40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div 
            onMouseDown={handleMouseDownDrag}
            className="p-1 hover:bg-zinc-800 rounded cursor-grab active:cursor-grabbing text-zinc-300"
            title="Mover dibujo"
          >
            <Move size={13} />
          </div>

          <div className="h-3 w-px bg-zinc-700 mx-0.5" />

          {/* Layer order buttons */}
          <button
            onClick={onBringToFront}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
            title="Traer al frente"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={onSendToBack}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white"
            title="Enviar al fondo"
          >
            <ArrowDown size={13} />
          </button>

          <span className="text-[10px] text-zinc-400 font-mono px-1">
            {Math.round(image.width || 320)}px
          </span>

          <div className="h-3 w-px bg-zinc-700 mx-0.5" />

          {/* Delete image */}
          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
            title="Eliminar este dibujo del lienzo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Image Content */}
      <div 
        onMouseDown={handleMouseDownDrag}
        className="w-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <img 
          src={imageUrl} 
          alt="Viñeta de manga"
          className="w-full h-auto object-contain pointer-events-none block select-none"
        />

        {/* Resizer Corner Handle */}
        {isSelected && (
          <div 
            onMouseDown={handleMouseDownResize}
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white cursor-se-resize shadow-md hover:scale-125 transition-transform"
            title="Arrastra para redimensionar"
          />
        )}
      </div>
    </div>
  );
};
