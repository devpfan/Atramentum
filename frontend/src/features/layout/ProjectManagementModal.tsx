import React, { useState } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { X, FileText, Trash2, AlertTriangle, FileType2, Calendar, File, BookOpen, Folder } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ProjectManagementModalProps {
  onClose: () => void;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({ onClose }) => {
  const { books, deleteBook } = useManuscriptStore();
  const token = useAppStore(state => state.token);
  
  const [bookToDelete, setBookToDelete] = useState<{id: number, title: string} | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExport = (bookId: number, format: string) => {
    // We can use a direct window.open or fetch to trigger download
    // Direct window.open requires token in query string or cookie. 
    // Since we use Bearer token, we need to fetch and trigger download.
    fetch(`http://localhost:8000/api/v1/manuscript/books/${bookId}/export?format=${format}`, {
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
      // Extract filename from response headers if possible, otherwise use fallback
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

  const handleDelete = async () => {
    if (bookToDelete && deleteConfirmation === bookToDelete.title) {
      await deleteBook(bookToDelete.id);
      setBookToDelete(null);
      setDeleteConfirmation('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Gestión Avanzada de Proyectos
            </h2>
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm">
                <th className="pb-3 font-medium">Nombre del Proyecto</th>
                <th className="pb-3 font-medium text-center">Creación</th>
                <th className="pb-3 font-medium text-center">Exportar</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors group">
                  <td className="py-4">
                    <div className="font-semibold text-[var(--color-text-primary)]">{book.title}</div>
                    {book.previous_titles && book.previous_titles.length > 0 && (
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-1" title="Títulos Anteriores (Historial)">
                        <FileType2 className="w-3 h-3" />
                        {book.previous_titles.join(' → ')}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(book.created_at)}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative group/btn">
                        <button onClick={() => handleExport(book.id, 'md')} className="p-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded transition-colors"><FileText className="w-4 h-4" /></button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">Markdown</div>
                      </div>
                      <div className="relative group/btn">
                        <button onClick={() => handleExport(book.id, 'docx')} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded transition-colors"><File className="w-4 h-4" /></button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">Word (.docx)</div>
                      </div>
                      <div className="relative group/btn">
                        <button onClick={() => handleExport(book.id, 'pdf')} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors"><File className="w-4 h-4" /></button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">PDF</div>
                      </div>
                      <div className="relative group/btn">
                        <button onClick={() => handleExport(book.id, 'epub')} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition-colors"><BookOpen className="w-4 h-4" /></button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">EPUB</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => setBookToDelete({ id: book.id, title: book.title })}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar Proyecto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--color-text-secondary)]">No hay proyectos.</td>
                </tr>
              )}
            </tbody>
          </table>
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
