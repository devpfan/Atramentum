import { useState, useEffect } from 'react';
import { useCodexStore } from '../../store/useCodexStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { codexApi } from '../../api/codex';
import { Search, Plus, Globe, Book, Wand2, Loader2, Cpu } from 'lucide-react';
import { Tooltip } from '../../components/Tooltip';

interface CodexListProps {
  selectedEntryId: number | null;
  onSelectEntry: (id: number) => void;
}

export default function CodexList({ selectedEntryId, onSelectEntry }: CodexListProps) {
  const { entries, isLoading, fetchEntries } = useCodexStore();
  const { activeBookId } = useManuscriptStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanTime, setScanTime] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isScanning) {
      setScanTime(0);
      interval = setInterval(() => {
        setScanTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const filteredEntries = entries.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScan = async () => {
    if (!activeBookId) return;
    
    const confirmMsg = "¿Deseas escanear el documento con IA para extraer personajes?\n\nNo te preocupes, el sistema omitirá inteligentemente los personajes que ya hayas creado, por lo que no habrá duplicados.";
    if (!window.confirm(confirmMsg)) {
        return;
    }
    
    setIsScanning(true);
    try {
      const result = await codexApi.scanDocument(activeBookId);
      alert(`Escaneo completado. Se insertaron ${result.inserted} personajes nuevos.`);
      await fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Error al escanear el documento.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] relative">
      <div className="p-4 border-b border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Archivum</h2>
          <div className="flex gap-2">
            <Tooltip content="Escanear Personajes con IA (No duplica los existentes)" position="top">
              <button 
                onClick={handleScan} 
                disabled={isScanning || !activeBookId}
                className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
              >
                {isScanning ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
              </button>
            </Tooltip>
            <Tooltip content="Nueva Entrada" position="top">
              <button 
                onClick={() => onSelectEntry(-1)} 
                className="p-1 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90"
              >
                <Plus size={20} />
              </button>
            </Tooltip>
          </div>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && <div className="text-center p-4 text-sm text-[var(--color-text-secondary)]">Cargando...</div>}
        
        {!isLoading && filteredEntries.map(entry => (
          <button
            key={entry.id}
            onClick={() => onSelectEntry(entry.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex flex-col ${
              selectedEntryId === entry.id 
                ? 'bg-[#6366f1]/20 text-[#6366f1]' 
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            <div className="flex justify-between items-start w-full gap-2">
              <span className="font-medium truncate flex-1">{entry.name}</span>
              {entry.series_id ? (
                <Tooltip content="Global (Serie)"><Globe size={14} className={selectedEntryId === entry.id ? 'text-[#6366f1]' : 'text-purple-400'} /></Tooltip>
              ) : (
                <Tooltip content="Local (Libro)"><Book size={14} className={selectedEntryId === entry.id ? 'text-[#6366f1]' : 'text-blue-400'} /></Tooltip>
              )}
            </div>
            <span className={`text-xs ${selectedEntryId === entry.id ? 'text-[#6366f1]/80' : 'text-[var(--color-text-secondary)]'}`}>
              {entry.category}
            </span>
          </button>
        ))}
        
        {!isLoading && filteredEntries.length === 0 && (
          <div className="text-center p-4 text-sm text-[var(--color-text-secondary)]">
            No se encontraron resultados
          </div>
        )}
      </div>

      {/* Escáner IA Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 relative">
            <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Escaneando Documento</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-[200px]">
            La IA está extrayendo los personajes. Esto puede tomar hasta un minuto dependiendo del tamaño del texto.
          </p>
          <div className="px-4 py-2 bg-black/30 rounded-lg text-indigo-300 font-mono text-sm">
            Tiempo transcurrido: {scanTime}s
          </div>
        </div>
      )}
    </div>
  );
}
