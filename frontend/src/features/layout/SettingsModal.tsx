import { useState, useEffect } from 'react';
import { X, Save, Bot, Palette, Type, User, RefreshCw, Check } from 'lucide-react';
import { authApi } from '../../api/auth';
import type { AISettings } from '../../api/auth';
import { aiApi } from '../../api/ai';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props {
  onClose: () => void;
}

const FONTS = [
  { value: 'Merriweather, serif', label: 'Merriweather (Serif)' },
  { value: '"Playfair Display", serif', label: 'Playfair Display (Serif)' },
  { value: 'Lora, serif', label: 'Lora (Serif)' },
  { value: '"Crimson Text", serif', label: 'Crimson Text (Serif)' },
  { value: '"EB Garamond", serif', label: 'EB Garamond (Serif)' },
  { value: '"PT Serif", serif', label: 'PT Serif (Serif)' },
  { value: 'Inter, sans-serif', label: 'Inter (Sans-serif)' },
  { value: 'Roboto, sans-serif', label: 'Roboto (Sans-serif)' },
  { value: 'Nunito, sans-serif', label: 'Nunito (Sans-serif)' },
  { value: '"Fira Code", monospace', label: 'Fira Code (Mono)' },
  { value: 'Courier, monospace', label: 'Courier (Mono)' },
  { value: 'Inconsolata, monospace', label: 'Inconsolata (Mono)' },
  { value: 'custom', label: 'Personalizada (Instalada localmente)...' }
];

export default function SettingsModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'account'>('account');
  
  // AI State
  const [aiSettings, setAiSettings] = useState<AISettings>({ provider: 'gemini' });
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Account State
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Appearance State (from Zustand, local to component before saving)
  const { theme, editorFontFamily, editorFontSize, editorLineHeight, setTheme, setEditorFontFamily, setEditorFontSize, setEditorLineHeight, resetToDefault } = useSettingsStore();
  
  const [localTheme, setLocalTheme] = useState(theme);
  const [localFontFamily, setLocalFontFamily] = useState(editorFontFamily);
  const [localFontSize, setLocalFontSize] = useState(editorFontSize);
  const [localLineHeight, setLocalLineHeight] = useState(editorLineHeight);

  useEffect(() => {
    // Fetch AI Settings
    authApi.getAISettings()
      .then(data => {
        setAiSettings(data);
        setIsLoadingAi(false);
        if (data.provider === 'local') {
          fetchLocalModels(data.local_url, data.local_model);
        }
      })
      .catch(err => {
        console.error("Error loading AI settings", err);
        setIsLoadingAi(false);
      });
      
    // Fetch User Info
    authApi.getMe()
      .then(data => {
        setCurrentEmail(data.email);
        setNewEmail(data.email);
      })
      .catch(err => {
        console.error("Error loading user info", err);
      });
  }, []);

  const fetchLocalModels = async (url?: string, currentSelectedModel?: string) => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const targetUrl = url || aiSettings.local_url || 'http://localhost:11434';
      const res = await aiApi.getLocalModels(targetUrl);
      if (res.models && res.models.length > 0) {
        setLocalModels(res.models);
        const selected = currentSelectedModel || aiSettings.local_model;
        if (!selected || !res.models.includes(selected)) {
          setAiSettings(prev => ({ ...prev, local_model: res.models[0] }));
        }
      } else {
        setLocalModels([]);
        setModelsError(res.error || 'No se detectaron modelos descargados en Ollama.');
      }
    } catch (err) {
      setLocalModels([]);
      setModelsError('No se pudo conectar con Ollama. Verifica que esté activo.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveAll = async () => {
    // Save AI Settings to Backend
    if (activeTab === 'ai') {
      setIsSavingAi(true);
      try {
        await authApi.updateAISettings(aiSettings);
      } catch (err) {
        console.error("Error saving AI settings", err);
        alert("Error al guardar la configuración de IA");
      } finally {
        setIsSavingAi(false);
      }
    }

    // Save Account Settings
    if (activeTab === 'account') {
      setAccountError('');
      setAccountSuccess('');
      setIsSavingAccount(true);
      try {
        if (newEmail !== currentEmail) {
          await authApi.updateEmail(newEmail);
          setCurrentEmail(newEmail);
          setAccountSuccess('Correo actualizado correctamente. ');
        }
        
        if (currentPassword && newPassword) {
          if (newPassword !== confirmPassword) {
            setAccountError('Las contraseñas nuevas no coinciden.');
            setIsSavingAccount(false);
            return;
          }
          await authApi.updatePassword(currentPassword, newPassword);
          setAccountSuccess(prev => prev + 'Contraseña actualizada correctamente.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } catch (err: any) {
        console.error("Error saving account settings", err);
        setAccountError(err.response?.data?.detail || "Error al actualizar la cuenta");
        setIsSavingAccount(false);
        return;
      }
      setIsSavingAccount(false);
    }

    // Save Appearance to Zustand (Local Storage)
    if (activeTab === 'appearance') {
      setTheme(localTheme);
      setEditorFontFamily(localFontFamily);
      setEditorFontSize(localFontSize);
      setEditorLineHeight(localLineHeight);
      
      // Toggle classes on document
      document.documentElement.classList.remove('dark', 'sepia', 'ocean', 'forest', 'rose', 'lavender');
      if (localTheme !== 'light') {
        document.documentElement.classList.add(localTheme);
      }
    }

    // Only close if it's not the account tab (to let them see the success message)
    if (activeTab !== 'account') {
      onClose();
    }
  };

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAiSettings(prev => ({ ...prev, [name]: value }));
    if (name === 'provider' && value === 'local') {
      fetchLocalModels(aiSettings.local_url);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar los ajustes de apariencia por defecto?')) {
      resetToDefault();
      setLocalTheme('dark');
      setLocalFontFamily('Merriweather, serif');
      setLocalFontSize(16);
      setLocalLineHeight(1.6);
      document.documentElement.classList.remove('sepia', 'ocean', 'forest', 'rose', 'lavender', 'light');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg w-full max-w-2xl shadow-2xl flex max-h-[90vh] overflow-hidden">
        
        {/* Sidebar Tabs */}
        <div className="w-48 border-r border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 px-2">Configuración</h2>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
          >
            <User size={16} /> Cuenta
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
          >
            <Palette size={16} /> Apariencia
          </button>
          
          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
          >
            <Bot size={16} /> Asistente IA
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {activeTab === 'appearance' ? 'Apariencia y Editor' : 
               activeTab === 'ai' ? 'Configuración de Inteligencia Artificial' : 'Opciones de Cuenta'}
            </h3>
            <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {accountSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-sm">
                {accountSuccess}
              </div>
            )}
            {accountError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                {accountError}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">Actualizar Correo Electrónico</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Correo Electrónico Actual</label>
                      <input 
                        type="email" 
                        value={currentEmail}
                        disabled
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-md py-2 px-3 focus:outline-none opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Nuevo Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nuevo@correo.com"
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--color-border)] pt-6">
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">Cambiar Contraseña</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Contraseña Actual</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Confirmar Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Tema de la Aplicación
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setLocalTheme('dark')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'dark' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gray-900 border border-gray-600"></div> Oscuro
                    </button>
                    <button 
                      onClick={() => setLocalTheme('light')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'light' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div> Claro
                    </button>
                    <button 
                      onClick={() => setLocalTheme('sepia')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'sepia' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#eee8d5] border border-[#d5c8b5]"></div> Sepia
                    </button>
                    <button 
                      onClick={() => setLocalTheme('ocean')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'ocean' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#082f49] border border-[#0369a1]"></div> Océano
                    </button>
                    <button 
                      onClick={() => setLocalTheme('forest')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'forest' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#064e3b] border border-[#047857]"></div> Bosque
                    </button>
                    <button 
                      onClick={() => setLocalTheme('rose')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'rose' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#4c0519] border border-[#be123c]"></div> Vino
                    </button>
                    <button 
                      onClick={() => setLocalTheme('lavender')}
                      className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 transition-all min-w-[120px] ${localTheme === 'lavender' ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#fae8ff] border border-[#e879f9]"></div> Lavanda
                    </button>
                  </div>
                </div>

                <div className="border-t border-[var(--color-border)] pt-6">
                  <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 flex items-center gap-2"><Type size={16}/> Tipografía del Editor</h4>
                  
                    <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Fuente</label>
                      <select 
                        value={FONTS.some(f => f.value === localFontFamily) ? localFontFamily : 'custom'} 
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setLocalFontFamily('Times New Roman, serif'); // default for custom
                          } else {
                            setLocalFontFamily(e.target.value);
                          }
                        }}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1] mb-2"
                        style={{ fontFamily: FONTS.some(f => f.value === localFontFamily) ? localFontFamily : 'inherit' }}
                      >
                        {FONTS.map(f => (
                          <option key={f.value} value={f.value} style={f.value !== 'custom' ? { fontFamily: f.value } : {}}>{f.label}</option>
                        ))}
                      </select>

                      {!FONTS.some(f => f.value === localFontFamily) && (
                        <div className="mt-2 p-3 bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-md">
                          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Nombre de la fuente instalada en tu equipo:</label>
                          <input 
                            type="text" 
                            value={localFontFamily}
                            onChange={(e) => setLocalFontFamily(e.target.value)}
                            placeholder="Ej. Arial, Helvetica, sans-serif"
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-1.5 px-3 focus:outline-none focus:border-[#6366f1] text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Tamaño: {localFontSize}px</label>
                        <input 
                          type="range" min="12" max="32" step="1" 
                          value={localFontSize} 
                          onChange={(e) => setLocalFontSize(Number(e.target.value))}
                          className="w-full accent-[#6366f1]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Interlineado: {localLineHeight}</label>
                        <input 
                          type="range" min="1.0" max="2.5" step="0.1" 
                          value={localLineHeight} 
                          onChange={(e) => setLocalLineHeight(Number(e.target.value))}
                          className="w-full accent-[#6366f1]"
                        />
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="mt-4 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)]">
                      <p className="text-[var(--color-text-secondary)] text-xs mb-2">Vista Previa:</p>
                      <div 
                        className="text-[var(--color-text-primary)]"
                        style={{ 
                          fontFamily: localFontFamily, 
                          fontSize: `${localFontSize}px`, 
                          lineHeight: localLineHeight 
                        }}
                      >
                        El viento aullaba entre los viejos pinos, llevando consigo el eco de promesas olvidadas. Atrás quedaba la ciudad, adelante solo el misterio.
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                {isLoadingAi ? (
                  <div className="text-center text-[var(--color-text-secondary)] py-8">Cargando...</div>
                ) : (
                  <>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300 flex items-start gap-2.5">
                      <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-indigo-200">Respaldo Global del Servidor:</span> Si dejas los campos de clave vacíos, Atramentum utilizará automáticamente la Inteligencia Artificial por defecto configurada en el servidor. Solo ingresa una clave si deseas usar tu propia cuenta personal.
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        Proveedor de Modelos LLM
                      </label>
                      <select 
                        name="provider" 
                        value={aiSettings.provider} 
                        onChange={handleAiChange}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                      >
                        <option value="gemini">Google Gemini (Por defecto global)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="local">Modelo Local (Ollama / Offline)</option>
                      </select>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Elige qué proveedor usará el Asistente de Escritura.
                      </p>
                    </div>

                    {aiSettings.provider === 'gemini' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          API Key de Gemini
                        </label>
                        <input 
                          type="password" 
                          name="gemini_key" 
                          value={aiSettings.gemini_key || ''} 
                          onChange={handleAiChange}
                          placeholder="Dejar vacío para usar clave del servidor (o ingresar propia AIzaSy...)"
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    )}

                    {aiSettings.provider === 'openai' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          API Key de OpenAI
                        </label>
                        <input 
                          type="password" 
                          name="openai_key" 
                          value={aiSettings.openai_key || ''} 
                          onChange={handleAiChange}
                          placeholder="Dejar vacío para usar clave del servidor (o ingresar propia sk-...)"
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    )}

                    {aiSettings.provider === 'anthropic' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          API Key de Anthropic
                        </label>
                        <input 
                          type="password" 
                          name="anthropic_key" 
                          value={aiSettings.anthropic_key || ''} 
                          onChange={handleAiChange}
                          placeholder="Dejar vacío para usar clave del servidor (o ingresar propia sk-ant-...)"
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    )}

                    {aiSettings.provider === 'local' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            URL del Servidor Local
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              name="local_url" 
                              value={aiSettings.local_url || ''} 
                              onChange={handleAiChange}
                              placeholder="http://localhost:11434"
                              className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                            />
                            <button
                              type="button"
                              onClick={() => fetchLocalModels(aiSettings.local_url)}
                              disabled={isLoadingModels}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[var(--color-text-primary)] rounded-md border border-[var(--color-border)] flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
                              title="Buscar modelos disponibles"
                            >
                              <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin text-[#6366f1]' : ''}`} />
                              <span>{isLoadingModels ? 'Buscando...' : 'Detectar'}</span>
                            </button>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            Por defecto: http://localhost:11434 (Ollama)
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                              Modelo Local
                            </label>
                            {localModels.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setIsCustomModel(!isCustomModel)}
                                className="text-xs text-[#6366f1] hover:underline"
                              >
                                {isCustomModel ? 'Usar lista detectada' : 'Escribir a mano...'}
                              </button>
                            )}
                          </div>

                          {localModels.length > 0 && !isCustomModel ? (
                            <div className="relative">
                              <select
                                name="local_model"
                                value={aiSettings.local_model || localModels[0]}
                                onChange={handleAiChange}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1] appearance-none cursor-pointer"
                              >
                                {localModels.map((m) => (
                                  <option key={m} value={m} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                    {m} (instalado en Ollama)
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)] text-xs">
                                ▼
                              </div>
                            </div>
                          ) : (
                            <input 
                              type="text" 
                              name="local_model" 
                              value={aiSettings.local_model || ''} 
                              onChange={handleAiChange}
                              placeholder="llama3:8b"
                              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-2 px-3 focus:outline-none focus:border-[#6366f1]"
                            />
                          )}

                          {localModels.length > 0 && (
                            <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> {localModels.length} modelo(s) detectado(s) en Ollama
                            </p>
                          )}

                          {modelsError && (
                            <p className="text-xs text-amber-400 mt-1.5">
                              ⚠️ {modelsError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)] flex justify-between items-center">
            {activeTab === 'appearance' ? (
              <button 
                onClick={handleResetDefaults}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Restaurar por Defecto
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={isLoadingAi || isSavingAi || isSavingAccount}
                className="px-4 py-2 text-sm font-medium bg-[#6366f1] text-white rounded-md hover:bg-[#4f46e5] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> {(isSavingAi || isSavingAccount) ? "Guardando..." : "Guardar Todo"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
