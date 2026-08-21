import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  Maximize, 
  Wand2, 
  BookOpen, 
  Highlighter, 
  Quote, 
  List, 
  ListOrdered,
  Folder
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenAiMenu?: () => void;
  onFetchSynonyms?: () => void;
  onToggleMobileIndex?: () => void;
  isAiLoading?: boolean;
  isSingleWord?: boolean;
  hasSelection?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export default function EditorToolbar({ 
  editor, 
  onOpenAiMenu, 
  onFetchSynonyms, 
  onToggleMobileIndex,
  isAiLoading = false,
  isSingleWord = false,
  hasSelection = false,
  saveStatus = 'idle'
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 py-1.5 select-none w-full overflow-x-auto no-scrollbar">
      
      {/* Botón de Índice (Móvil) */}
      {onToggleMobileIndex && (
        <button
          onClick={onToggleMobileIndex}
          className="md:hidden flex items-center shrink-0 gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold mr-1"
          title="Ver Índice de Capítulos"
        >
          <Folder size={14} />
          <span>Índice</span>
        </button>
      )}

      {/* --- HERRAMIENTAS INTELIGENTES DE IA Y LÉXICO --- */}
      <div className="flex items-center shrink-0 gap-1 bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-0.5 mr-1">
        <button
          onClick={onOpenAiMenu}
          disabled={isAiLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            hasSelection 
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 animate-pulse' 
              : 'text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200'
          } disabled:opacity-50`}
          title={hasSelection ? "Mejorar o transformar texto seleccionado con IA" : "Asistente IA de Escritura"}
        >
          <Wand2 size={14} className={isAiLoading ? "animate-spin" : ""} />
          <span>{isAiLoading ? 'Pensando...' : hasSelection ? '✨ Mejorar con IA' : 'Asistente IA'}</span>
        </button>

        {isSingleWord && onFetchSynonyms && (
          <button
            onClick={onFetchSynonyms}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
            title="Buscar sinónimos para la palabra seleccionada"
          >
            <BookOpen size={14} />
            <span>Sinónimos</span>
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      {/* --- FORMATO BÁSICO --- */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Negrita (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Cursiva (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('underline') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Subrayado (Ctrl+U)"
      >
        <UnderlineIcon size={16} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>

      {/* --- RESALTADOR --- */}
      <button
        onClick={() => editor.chain().focus().toggleHighlight({ color: '#fbbf24' }).run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${
          editor.isActive('highlight') 
            ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40' 
            : 'text-[var(--color-text-secondary)] hover:bg-amber-500/15 hover:text-amber-300'
        }`}
        title="Resaltar / Marcar nota"
      >
        <Highlighter size={16} />
      </button>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      {/* --- ENCABEZADOS --- */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-md text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-md text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded-md text-xs font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Título 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      {/* --- LISTAS & CITAS --- */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Lista de viñetas"
      >
        <List size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 shrink-0 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
        title="Cita en bloque"
      >
        <Quote size={16} />
      </button>

      <div className="flex-1 min-w-[8px]" />

      {/* --- ESTADO DE GUARDADO --- */}
      {saveStatus !== 'idle' && (
        <div className="shrink-0 text-xs font-medium px-2 py-1 select-none">
          {saveStatus === 'saving' && <span className="text-amber-400 animate-pulse">Guardando...</span>}
          {saveStatus === 'saved' && <span className="text-emerald-400">Guardado ✓</span>}
          {saveStatus === 'error' && <span className="text-rose-400">Error al guardar</span>}
        </div>
      )}

      {/* --- MODO CONCENTRACIÓN --- */}
      <button
        onClick={() => {
          const isFocus = useAppStore.getState().isFocusMode;
          if (!isFocus) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
            useAppStore.getState().toggleFocusMode(true);
          }
        }}
        className="flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
        title="Modo Concentración (F11)"
      >
        <Maximize size={15} />
        <span className="hidden sm:inline">Modo Zen</span>
      </button>
    </div>
  );
}
