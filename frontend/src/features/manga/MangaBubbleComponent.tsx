import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Move, Plus, Minus } from 'lucide-react';
import type { MangaBubble, MangaBubbleType } from './types';

interface MangaBubbleComponentProps {
  bubble: MangaBubble;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: Partial<MangaBubble>) => void;
  onDelete: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const MangaBubbleComponent: React.FC<MangaBubbleComponentProps> = ({
  bubble,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
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
      initialX: bubble.x,
      initialY: bubble.y
    };
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      initialWidth: bubble.width || 160
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
        newX = Math.max(0, Math.min(92, newX));
        newY = Math.max(0, Math.min(95, newY));

        onUpdate({ x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.startX;
        const newWidth = Math.max(100, Math.min(400, resizeStartRef.current.initialWidth + deltaX));
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
  }, [isDragging, isResizing, bubble.x, bubble.y, onUpdate, canvasRef]);

  // Style generators per bubble type
  const getBubbleStyle = () => {
    switch (bubble.type) {
      case 'thought':
        return 'bg-white text-black border-2 border-dashed border-zinc-800 rounded-[28px] shadow-lg';
      case 'scream':
        return 'bg-white text-black border-2 border-black font-black uppercase tracking-wider rounded-lg shadow-xl outline outline-2 outline-offset-2 outline-black';
      case 'narrative':
        return 'bg-[#fffdec] text-black border-2 border-black rounded-none shadow-md font-serif';
      case 'sfx':
        return 'bg-transparent text-red-600 font-black italic tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:_2px_2px_0_#fff,_-2px_-2px_0_#fff,_2px_-2px_0_#fff,_-2px_2px_0_#fff]';
      case 'speech':
      default:
        return 'bg-white text-black border-2 border-black rounded-[24px] shadow-lg';
    }
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: `${bubble.width || 160}px`,
        position: 'absolute',
        zIndex: isSelected ? 30 : 10,
        touchAction: 'none'
      }}
      className={`group cursor-pointer select-none transition-shadow ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
    >
      {/* Mini Controls Bar when Selected */}
      {isSelected && (
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white rounded-md px-2 py-1 flex items-center gap-1 shadow-xl border border-zinc-700 text-xs whitespace-nowrap z-40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div 
            onMouseDown={handleMouseDownDrag}
            className="p-1 hover:bg-zinc-700 rounded cursor-grab active:cursor-grabbing text-zinc-300"
            title="Arrastrar posición"
          >
            <Move size={12} />
          </div>

          {/* Type Selector */}
          <select 
            value={bubble.type}
            onChange={(e) => onUpdate({ type: e.target.value as MangaBubbleType })}
            className="bg-zinc-800 text-white text-[11px] rounded px-1 py-0.5 border border-zinc-700 focus:outline-none"
          >
            <option value="speech">💬 Diálogo</option>
            <option value="thought">💭 Pensamiento</option>
            <option value="scream">💥 Grito</option>
            <option value="narrative">📜 Narrador</option>
            <option value="sfx">⚡ Onomatopeya</option>
          </select>

          {/* Font Size Adjusters */}
          <div className="flex items-center gap-0.5 bg-zinc-800 rounded px-1">
            <button 
              onClick={() => onUpdate({ fontSize: Math.max(10, (bubble.fontSize || 14) - 1) })}
              className="p-0.5 hover:text-indigo-400"
              title="Reducir fuente"
            >
              <Minus size={10} />
            </button>
            <span className="text-[10px] text-zinc-400 min-w-[14px] text-center">{bubble.fontSize || 14}</span>
            <button 
              onClick={() => onUpdate({ fontSize: Math.min(32, (bubble.fontSize || 14) + 1) })}
              className="p-0.5 hover:text-indigo-400"
              title="Aumentar fuente"
            >
              <Plus size={10} />
            </button>
          </div>

          {/* Delete Button */}
          <button 
            onClick={onDelete}
            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors ml-1"
            title="Eliminar globo"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Bubble Body */}
      <div 
        onMouseDown={handleMouseDownDrag}
        className={`p-3 relative ${getBubbleStyle()} flex items-center justify-center`}
      >
        <textarea
          value={bubble.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()} // Allow selecting text without triggering drag
          style={{
            fontSize: `${bubble.fontSize || 14}px`,
            lineHeight: 1.25
          }}
          placeholder="Escribe el diálogo..."
          rows={Math.max(1, Math.min(6, Math.ceil(bubble.text.length / 15)))}
          className="w-full bg-transparent text-center resize-none border-none outline-none overflow-hidden font-sans font-medium text-inherit placeholder-zinc-400"
        />

        {/* Tail indicator for normal speech bubbles */}
        {bubble.type === 'speech' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black" />
        )}

        {/* Resizer Handle on bottom-right corner */}
        {isSelected && (
          <div 
            onMouseDown={handleMouseDownResize}
            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full border border-white cursor-se-resize shadow-md"
            title="Ajustar ancho"
          />
        )}
      </div>
    </div>
  );
};
