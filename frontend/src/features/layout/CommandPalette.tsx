import React, { useState, useEffect, useRef } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { useCodexStore } from '../../store/useCodexStore';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Library, X } from 'lucide-react';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { tree, setActiveSceneId } = useManuscriptStore();
  const { entries } = useCodexStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Recolectar items
  const scenes = tree?.chapters.flatMap(c => c.scenes.map(s => ({
    id: s.id,
    title: s.title,
    type: 'scene',
    chapterTitle: c.title
  }))) || [];

  const codexItems = entries.map(e => ({
    id: e.id,
    title: e.name,
    type: 'codex',
    category: e.category
  }));

  const allItems = [...scenes, ...codexItems];
  
  const filteredItems = allItems.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.type === 'scene') {
      setActiveSceneId(item.id);
      navigate('/app');
    } else {
      navigate('/app/codex');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-24" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={20} className="text-[var(--color-text-secondary)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none text-[var(--color-text-primary)] text-lg placeholder-[var(--color-text-secondary)]"
            placeholder="Buscar escena o entrada del Archivum..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
          <button onClick={() => setIsOpen(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={20} />
          </button>
        </div>
        
        {filteredItems.length > 0 ? (
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            {filteredItems.map((item, index) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-3 flex items-center cursor-pointer transition-colors ${
                  selectedIndex === index 
                    ? 'bg-[#6366f1]/10 text-[#6366f1]' 
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {item.type === 'scene' ? <FileText size={18} className="mr-3 opacity-70" /> : <Library size={18} className="mr-3 opacity-70" />}
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-60">
                    {item.type === 'scene' ? `Escena • ${(item as any).chapterTitle}` : `Archivum • ${(item as any).category}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-[var(--color-text-secondary)]">
            No se encontraron resultados para "{query}"
          </div>
        )}
        
        <div className="border-t border-[var(--color-border)] p-2 text-xs text-[var(--color-text-secondary)] flex justify-between bg-black/10">
          <span>Usa <kbd className="bg-[var(--color-background)] border border-[var(--color-border)] px-1 rounded">↑</kbd> <kbd className="bg-[var(--color-background)] border border-[var(--color-border)] px-1 rounded">↓</kbd> para navegar</span>
          <span><kbd className="bg-[var(--color-background)] border border-[var(--color-border)] px-1 rounded">Enter</kbd> para seleccionar</span>
        </div>
      </div>
    </div>
  );
}
