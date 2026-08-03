import React, { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { X, FileText, Trash2, AlertTriangle, FileType2, Calendar, File as FileIcon, BookOpen, Folder, Plus, Upload, Film, Palette } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { manuscriptApi, type ProjectType } from '../../api/manuscript';
import { Tooltip } from '../../components/Tooltip';

interface ProjectManagementModalProps {
  onClose: () => void;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({ onClose }) => {
  const { books, deleteBook, series, fetchSeries, createSeries, deleteSeries, updateBook, createBook } = useManuscriptStore();
  const token = useAppStore(state => state.token);
  
  const [bookToDelete, setBookToDelete] = useState<{id: number, title: string} | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectSynopsis, setNewProjectSynopsis] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('novel');
  const [newProjectSeriesId, setNewProjectSeriesId] = useState<number | undefined>(undefined);
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleCreateSeries = async () => {
    if (newSeriesTitle.trim()) {
      await createSeries(newSeriesTitle);
      setNewSeriesTitle('');
      setIsCreatingSeries(false);
    }
  };

  const handleCreateProject = async () => {
    if (newProjectTitle.trim()) {
      await createBook(newProjectTitle.trim(), newProjectSynopsis.trim() || undefined, newProjectType, newProjectSeriesId);
      setNewProjectTitle('');
      setNewProjectSynopsis('');
      setNewProjectType('novel');
      setNewProjectSeriesId(undefined);
      setIsCreatingProject(false);
    }
  };

  const handleExport = (bookId: number, format: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
    fetch(`${baseUrl}/manuscript/books/${bookId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      let ext = format;
      if (format === 'word') ext = 'docx';
      a.download = `manuscript.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error exporting book:', error);
      alert("Hubo un error al exportar el libro.");
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      await manuscriptApi.importBook(file);
      await useManuscriptStore.getState().fetchBooks();
    } catch (err) {
      console.error("Error importando libro:", err);
      alert("Hubo un error al importar el documento. Asegúrate de que es un formato soportado.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (bookToDelete && deleteConfirmation === bookToDelete.title) {
      await deleteBook(bookToDelete.id);
      setBookToDelete(null);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] w-full max-w-4xl rounded-xl shadow-2xl border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Atramentum Studio
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Gestión de Proyectos, Guiones y Series</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Tus Proyectos y Universos</h3>
            <div className="flex flex-wrap gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".txt,.md,.docx,.doc,.odt"
                onChange={handleImport} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-background)] rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isImporting ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
                Importar
              </button>
              <button 
                onClick={() => { setIsCreatingSeries(true); setIsCreatingProject(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Nueva Serie
              </button>
              <button 
                onClick={() => { setIsCreatingProject(true); setIsCreatingSeries(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-indigo-600/20"
              >
                <Plus size={16} />
                Nuevo Proyecto
              </button>
            </div>
          </div>

          {/* Formulario de Creación de Proyecto */}
          {isCreatingProject && (
            <div className="mb-6 p-5 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Plus size={16} /> Crear Nuevo Proyecto Creativo
                </h4>
                <button onClick={() => setIsCreatingProject(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs">Cerrar</button>
              </div>

              {/* Selector de Tipo de Proyecto */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                  Selecciona el formato de tu proyecto:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    onClick={() => setNewProjectType('novel')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newProjectType === 'novel' 
                        ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20' 
                        : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className={`w-4 h-4 ${newProjectType === 'novel' ? 'text-blue-400' : 'text-[var(--color-text-secondary)]'}`} />
                      <span className={`text-sm font-bold ${newProjectType === 'novel' ? 'text-blue-400' : 'text-[var(--color-text-primary)]'}`}>Novela / Prosa</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Manuscrito en prosa, capítulos, escenas y beats literarios.</p>
                  </div>

                  <div 
                    onClick={() => setNewProjectType('screenplay')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newProjectType === 'screenplay' 
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20' 
                        : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Film className={`w-4 h-4 ${newProjectType === 'screenplay' ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'}`} />
                      <span className={`text-sm font-bold ${newProjectType === 'screenplay' ? 'text-amber-400' : 'text-[var(--color-text-primary)]'}`}>Guion Cine / TV</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Formato de guion profesional (INT./EXT., Diálogos y Secuencias).</p>
                  </div>

                  <div 
                    onClick={() => setNewProjectType('manga')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newProjectType === 'manga' 
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm shadow-purple-500/20' 
                        : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Palette className={`w-4 h-4 ${newProjectType === 'manga' ? 'text-purple-400' : 'text-[var(--color-text-secondary)]'}`} />
                      <span className={`text-sm font-bold ${newProjectType === 'manga' ? 'text-purple-400' : 'text-[var(--color-text-primary)]'}`}>Manga / Cómic</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Guion de viñetas, globos de diálogo y visor de dibujos del artista.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Título del Proyecto *</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                    placeholder="Ej: El Despertar del Titán"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Universo / Serie (Opcional)</label>
                  <select
                    value={newProjectSeriesId || ''}
                    onChange={(e) => setNewProjectSeriesId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Proyecto Independiente --</option>
                    {series.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Sinopsis o Premisa (Opcional)</label>
                <textarea 
                  value={newProjectSynopsis}
                  onChange={(e) => setNewProjectSynopsis(e.target.value)}
                  rows={2}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Breve resumen de la trama o argumento..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsCreatingProject(false)} 
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg text-sm hover:bg-[var(--color-background)] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateProject} 
                  disabled={!newProjectTitle.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Crear Proyecto
                </button>
              </div>
            </div>
          )}
          
          {isCreatingSeries && (
            <div className="mb-6 p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-lg flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nombre de la Serie</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="Ej: Universo Sci-Fi"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateSeries(); if (e.key === 'Escape') setIsCreatingSeries(false); }}
                />
              </div>
              <button onClick={handleCreateSeries} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">Guardar</button>
              <button onClick={() => setIsCreatingSeries(false)} className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg text-sm hover:bg-[var(--color-background)] transition-colors">Cancelar</button>
            </div>
          )}

          <div className="space-y-8">
            {/* Primero mostramos las Series */}
            {series.map(s => {
              const seriesBooks = books.filter(b => b.series_id === s.id);
              return (
                <div key={`series-${s.id}`} className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <div className="bg-[var(--color-surface-hover)] p-4 flex justify-between items-center border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-bold text-[var(--color-text-primary)]">{s.title}</h4>
                      <span className="text-xs px-2 py-0.5 bg-black/20 rounded-full text-[var(--color-text-secondary)]">{seriesBooks.length} proyectos</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm(`¿Eliminar la serie "${s.title}"? Los libros no se borrarán, solo quedarán sueltos.`)) {
                          deleteSeries(s.id);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar Serie
                    </button>
                  </div>
                  
                  {seriesBooks.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <BookTableBody books={seriesBooks} onExport={handleExport} onDelete={(b) => setBookToDelete({id: b.id, title: b.title})} seriesList={series} onAssignSeries={updateBook} />
                    </table>
                  ) : (
                    <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">No hay proyectos en esta serie. Puedes asignar proyectos desde la lista de abajo.</div>
                  )}
                </div>
              );
            })}

            {/* Libros sin serie */}
            {books.filter(b => !b.series_id).length > 0 && (
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--color-surface-hover)] p-4 flex items-center gap-2 border-b border-[var(--color-border)]">
                  <BookOpen className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <h4 className="font-bold text-[var(--color-text-primary)]">Proyectos Independientes</h4>
                </div>
                <table className="w-full text-left border-collapse">
                  <BookTableBody books={books.filter(b => !b.series_id)} onExport={handleExport} onDelete={(b) => setBookToDelete({id: b.id, title: b.title})} seriesList={series} onAssignSeries={updateBook} />
                </table>
              </div>
            )}
            
            {books.length === 0 && series.length === 0 && !isCreatingProject && (
              <div className="text-center py-10 text-[var(--color-text-secondary)] space-y-3">
                <p>No tienes ningún proyecto o serie aún.</p>
                <button 
                  onClick={() => setIsCreatingProject(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Crear mi primer proyecto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-red-900/50 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-red-500/10 p-6 flex flex-col items-center text-center border-b border-red-900/30">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-500 mb-2">Zona de Peligro</h3>
              <p className="text-sm text-gray-400">
                Estás a punto de eliminar permanentemente el proyecto <strong className="text-white">"{bookToDelete.title}"</strong>. 
                Esta acción borrará todos sus capítulos y escenas. <strong>No se puede deshacer.</strong>
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm text-gray-300 mb-2">
                Para confirmar, escribe el nombre del proyecto exactamente como aparece arriba:
              </label>
              <input 
                type="text" 
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder={bookToDelete.title}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 mb-6"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => { setBookToDelete(null); setDeleteConfirmation(''); }}
                  className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleteConfirmation !== bookToDelete.title}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to render the table body for books
const BookTableBody = ({ books, onExport, onDelete, seriesList, onAssignSeries }: { 
  books: any[], 
  onExport: (id: number, format: string) => void, 
  onDelete: (book: any) => void,
  seriesList: any[],
  onAssignSeries: (id: number, data: any) => void
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderFormatBadge = (type: string) => {
    if (type === 'screenplay') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Film className="w-3 h-3" /> Guion
        </span>
      );
    }
    if (type === 'manga') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Palette className="w-3 h-3" /> Manga
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <BookOpen className="w-3 h-3" /> Novela
      </span>
    );
  };

  return (
    <>
      <thead>
        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm">
          <th className="pb-3 pl-4 font-medium w-1/3">Nombre del Proyecto</th>
          <th className="pb-3 font-medium text-center">Formato</th>
          <th className="pb-3 font-medium text-center">Creación</th>
          <th className="pb-3 font-medium text-center">Exportar</th>
          <th className="pb-3 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {books.map(book => (
          <tr key={book.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors group">
            <td className="py-4 pl-4">
              <div className="font-semibold text-[var(--color-text-primary)]">{book.title}</div>
              {book.previous_titles && book.previous_titles.length > 0 && (
                <Tooltip content="Títulos Anteriores (Historial)" position="top">
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
                    <FileType2 className="w-3 h-3" />
                    {book.previous_titles.join(' → ')}
                  </div>
                </Tooltip>
              )}
              {/* Selector de Serie */}
              <select 
                className="mt-2 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-secondary)] focus:outline-none focus:border-indigo-500 max-w-[200px]"
                value={book.series_id || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  onAssignSeries(book.id, { series_id: val });
                }}
              >
                <option value="">-- Sin Serie --</option>
                {seriesList.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </td>
            <td className="py-4 text-center">
              {renderFormatBadge(book.project_type || 'novel')}
            </td>
            <td className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(book.created_at)}
              </div>
            </td>
            <td className="py-4">
              <div className="flex items-center justify-center gap-2">
                <Tooltip content="Markdown" position="top">
                  <button onClick={() => onExport(book.id, 'md')} className="p-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded transition-colors"><FileText className="w-4 h-4" /></button>
                </Tooltip>
                <Tooltip content="Word (.docx)" position="top">
                  <button onClick={() => onExport(book.id, 'docx')} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded transition-colors"><FileIcon className="w-4 h-4" /></button>
                </Tooltip>
                <Tooltip content="PDF" position="top">
                  <button onClick={() => onExport(book.id, 'pdf')} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors"><FileIcon className="w-4 h-4" /></button>
                </Tooltip>
                <Tooltip content="EPUB" position="top">
                  <button onClick={() => onExport(book.id, 'epub')} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition-colors"><BookOpen className="w-4 h-4" /></button>
                </Tooltip>
              </div>
            </td>
            <td className="py-4 pr-4 text-right">
              <Tooltip content="Eliminar Proyecto" position="left">
                <button 
                  onClick={() => onDelete(book)}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Tooltip>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

