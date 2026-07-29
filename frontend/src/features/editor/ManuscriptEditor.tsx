import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AutoTagExtension } from './extensions/AutoTagExtension';
import { useCodexStore } from '../../store/useCodexStore';

export default function ManuscriptEditor() {
  const { fetchEntries, isLoading } = useCodexStore();

  // Cargar el Codex al inicializar el editor para que el AutoTag tenga la data
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      AutoTagExtension,
    ],
    content: `
      <h2>Capítulo 1: El Comienzo</h2>
      <p>Había una vez un rey llamado Arturo que gobernaba con justicia. Su espada, Excalibur, brillaba en la oscuridad de la sala. Sin embargo, en el reino de Camelot, oscuros secretos acechaban.</p>
      <p>Prueba a escribir el nombre de tu personaje para ver la magia.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  if (isLoading) {
    return <div className="animate-pulse flex space-x-4 p-8">Cargando base de datos del Codex...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-full">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 shadow-xl min-h-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
