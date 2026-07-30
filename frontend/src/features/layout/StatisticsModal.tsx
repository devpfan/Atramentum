import React, { useState, useEffect } from 'react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { X, Target, BarChart2, Hash, BookOpen } from 'lucide-react';

interface StatisticsModalProps {
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ onClose }) => {
  const { tree, books, activeBookId, updateBook } = useManuscriptStore();
  const [wordCount, setWordCount] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [localGoal, setLocalGoal] = useState('50000');

  const currentBook = books.find(b => b.id === activeBookId);

  useEffect(() => {
    if (tree) {
      let totalWords = 0;
      tree.chapters.forEach(chapter => {
        chapter.scenes.forEach(scene => {
          if (scene.content) {
            // Remove HTML tags
            const textContent = scene.content.replace(/<[^>]*>?/gm, ' ');
            // Count words by splitting on whitespace
            const words = textContent.trim().split(/\s+/);
            if (words.length > 0 && words[0] !== '') {
              totalWords += words.length;
            }
          }
        });
      });
      setWordCount(totalWords);
    }
  }, [tree]);

  useEffect(() => {
    if (currentBook) {
      setLocalGoal(currentBook.target_word_count?.toString() || '50000');
    }
  }, [currentBook]);

  if (!currentBook) return null;

  const targetWords = parseInt(localGoal) || 50000;
  const progressPercentage = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const handleSaveGoal = async () => {
    const goalNum = parseInt(localGoal);
    if (goalNum > 0) {
      await updateBook(currentBook.id, { target_word_count: goalNum });
      setIsEditingGoal(false);
    }
  };

  const stats = [
    {
      label: 'Palabras Totales',
      value: wordCount.toLocaleString(),
      icon: <Hash className="w-5 h-5 text-indigo-500" />
    },
    {
      label: 'Capítulos',
      value: tree?.chapters.length || 0,
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />
    },
    {
      label: 'Escenas',
      value: tree?.chapters.reduce((acc, chap) => acc + chap.scenes.length, 0) || 0,
      icon: <BarChart2 className="w-5 h-5 text-indigo-500" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] w-full max-w-lg rounded-xl shadow-2xl border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Estadísticas del Proyecto
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
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          
          {/* Goal Section */}
          <div className="bg-[var(--color-background)] rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Meta de Escritura</h3>
              </div>
              
              {isEditingGoal ? (
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={localGoal}
                    onChange={(e) => setLocalGoal(e.target.value)}
                    className="bg-[var(--color-surface)] border rounded px-2 py-1 w-24 text-[var(--color-text-primary)] text-sm"
                  />
                  <button 
                    onClick={handleSaveGoal}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  className="text-sm text-indigo-500 hover:text-indigo-400 font-medium"
                >
                  Editar meta
                </button>
              )}
            </div>

            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Progreso actual:</span>
              <span className="text-[var(--color-text-primary)] font-bold">{wordCount.toLocaleString()} / {targetWords.toLocaleString()} palabras</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-4 w-full bg-[var(--color-surface)] rounded-full overflow-hidden border">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="mt-2 text-right text-xs text-[var(--color-text-secondary)] font-medium">
              {progressPercentage}% completado
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-[var(--color-background)] rounded-xl p-4 border flex flex-col gap-2 items-center text-center">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg border">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
