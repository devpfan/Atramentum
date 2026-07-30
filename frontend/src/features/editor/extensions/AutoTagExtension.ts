import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
import { useCodexStore } from '../../../store/useCodexStore';

export const AutoTagExtension = Extension.create({
  name: 'autoTag',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoTag'),
        state: {
          init(_, { doc }) {
            return getDecorations(doc);
          },
          apply(tr, oldState) {
            // Re-calcular decoraciones si el documento cambió o si se forzó la actualización (ej. al cargar el codex)
            if (tr.docChanged || tr.getMeta('forceUpdate')) {
              return getDecorations(tr.doc);
            }
            return oldState;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

function getDecorations(doc: Node) {
  const decorations: Decoration[] = [];
  
  // Obtenemos el diccionario en vivo desde Zustand fuera del ciclo de React
  const aliasMap = useCodexStore.getState().getAliasMap();
  const searchTerms = Object.keys(aliasMap).filter(term => term.length > 2);

  if (searchTerms.length === 0) {
    return DecorationSet.empty;
  }

  // Escapar caracteres especiales para RegEx
  const escapedTerms = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  // Usar lookarounds modernos para lidiar con acentos y límites de palabras, fallback a \b
  const regexString = `(^|\\W)(${escapedTerms.join('|')})(?=\\W|$)`;
  const regex = new RegExp(regexString, 'gi');

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      let match;
      // Reseteamos el regex porque es global
      regex.lastIndex = 0;
      
      while ((match = regex.exec(node.text)) !== null) {
        // match[1] es el prefijo (boundary/espacio)
        // match[2] es la palabra coincidente
        const prefix = match[1];
        const word = match[2];
        
        const start = pos + match.index + prefix.length;
        const end = start + word.length;
        
        const entry = aliasMap[word.toLowerCase()];
        
        if (entry) {
          decorations.push(
            Decoration.inline(start, end, {
              class: `codex-tag codex-category-${entry.category.toLowerCase()}`,
              'data-codex-id': entry.id.toString(),
            })
          );
        }
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}
