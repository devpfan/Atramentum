import React, { useState, useEffect } from 'react';
import { useCodexStore } from '../../store/useCodexStore';
import type { CodexEntry } from '../../api/codex';
import { Save, Trash2, X, Plus } from 'lucide-react';

interface CodexEditorProps {
  entry: CodexEntry | null;
  onClose: () => void;
}

export default function CodexEditor({ entry, onClose }: CodexEditorProps) {
  const { createEntry, updateEntry, deleteEntry, isLoading } = useCodexStore();
  
  const isNew = !entry;
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Character',
    description: '',
    aliases: [] as string[],
    attributes: {} as Record<string, any>
  });

  const [aliasInput, setAliasInput] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // Sincronizar el formulario con la entrada seleccionada
  useEffect(() => {
    if (entry) {
      setFormData({
        name: entry.name,
        category: entry.category,
        description: entry.description || '',
        aliases: entry.aliases ? entry.aliases.map(a => a.alias_name) : [],
        attributes: entry.attributes || {}
      });
    } else {
      setFormData({
        name: '',
        category: 'Character',
        description: '',
        aliases: [],
        attributes: {}
      });
    }
  }, [entry]);

  const handleSave = async () => {
    try {
      const currentData = { ...formData };
      
      // Auto-añadir atributo si hay algo escrito en los inputs
      if (newAttrKey.trim() && newAttrVal.trim()) {
        currentData.attributes = { 
          ...currentData.attributes, 
          [newAttrKey.trim()]: newAttrVal.trim() 
        };
        setNewAttrKey('');
        setNewAttrVal('');
      }

      // Auto-añadir alias si hay algo escrito
      if (aliasInput.trim() && !currentData.aliases.includes(aliasInput.trim())) {
        currentData.aliases = [...currentData.aliases, aliasInput.trim()];
        setAliasInput('');
      }

      if (isNew) {
        await createEntry(currentData);
      } else {
        await updateEntry(entry.id, currentData);
      }
      onClose(); // Optional: close or keep open? Usually better to keep open, but if it was new, maybe we let state sync.
    } catch (e) {
      console.error(e);
      alert('Error guardando la entrada');
    }
  };

  const handleDelete = async () => {
    if (!isNew && confirm(`¿Estás seguro de que quieres eliminar a ${entry.name}?`)) {
      try {
        await deleteEntry(entry.id);
        onClose();
      } catch (e) {
        console.error(e);
        alert('Error eliminando la entrada');
      }
    }
  };

  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && aliasInput.trim()) {
      e.preventDefault();
      if (!formData.aliases.includes(aliasInput.trim())) {
        setFormData(prev => ({ ...prev, aliases: [...prev.aliases, aliasInput.trim()] }));
      }
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter(a => a !== aliasToRemove)
    }));
  };

  const handleAddAttribute = () => {
    if (newAttrKey.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [newAttrKey.trim()]: newAttrVal }
      }));
      setNewAttrKey('');
      setNewAttrVal('');
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttrs = { ...formData.attributes };
    delete newAttrs[key];
    setFormData(prev => ({ ...prev, attributes: newAttrs }));
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0 bg-[var(--color-surface)]">
        <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
          {isNew ? 'Nueva Entrada' : `Editando: ${entry.name}`}
        </h3>
        <div className="flex gap-2">
          {!isNew && (
            <button 
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#6366f1] text-white hover:bg-[#4f46e5] rounded-lg transition-colors"
          >
            <Save size={16} /> {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Nombre Principal</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md py-2 px-3 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
              placeholder="Ej: Gandalf"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Categoría</label>
            <select 
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md py-2 px-3 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
            >
              <option value="Character">Personaje (Character)</option>
              <option value="Location">Lugar (Location)</option>
              <option value="Item">Objeto (Item)</option>
              <option value="Lore">Lore / Concepto</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Alias (Presiona Enter para añadir)
          </label>
          <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-2 flex flex-wrap gap-2 items-center">
            {formData.aliases.map(alias => (
              <span key={alias} className="inline-flex items-center gap-1 bg-[#6366f1]/20 text-[#6366f1] px-2 py-1 rounded text-sm font-medium">
                {alias}
                <button onClick={() => handleRemoveAlias(alias)} className="hover:text-red-400">
                  <X size={14} />
                </button>
              </span>
            ))}
            <input 
              type="text" 
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={handleAddAlias}
              className="bg-transparent border-none focus:outline-none min-w-[150px] text-sm py-1 text-[var(--color-text-primary)]"
              placeholder={formData.aliases.length === 0 ? "Ej: Mithrandir, El Peregrino Gris..." : "Añadir alias..."}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Descripción General</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md py-2 px-3 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] resize-y"
            placeholder="Describe quién es o qué es..."
          />
        </div>

        {/* Dynamic Attributes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Atributos Dinámicos (Clave/Valor)</h4>
          </div>
          
          <div className="space-y-3">
            {Object.entries(formData.attributes).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value={key} 
                  className="w-1/3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md py-1.5 px-3 text-sm text-[var(--color-text-secondary)] opacity-75" 
                />
                <input 
                  type="text" 
                  value={typeof val === 'string' ? val : JSON.stringify(val)} 
                  onChange={e => setFormData(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                  className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]" 
                />
                <button 
                  onClick={() => handleRemoveAttribute(key)}
                  className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Fila para nuevo atributo */}
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="text" 
                placeholder="Nueva Clave (ej: Edad)" 
                value={newAttrKey}
                onChange={e => setNewAttrKey(e.target.value)}
                className="w-1/3 bg-[var(--color-background)] border border-[var(--color-border)] border-dashed rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]" 
              />
              <input 
                type="text" 
                placeholder="Valor (ej: 45)" 
                value={newAttrVal}
                onChange={e => setNewAttrVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAttribute()}
                className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] border-dashed rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]" 
              />
              <button 
                onClick={handleAddAttribute}
                disabled={!newAttrKey.trim()}
                className="p-1.5 text-white bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
