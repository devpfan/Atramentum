import { useState, useEffect } from 'react';
import { adminService, type AIStatusResponse, type AITestResponse } from '../../api/admin';
import { aiApi } from '../../api/ai';
import { Save, Server, ShieldCheck, RefreshCw, Check, Zap, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // AI Status & Live Test
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<AITestResponse | null>(null);

  const loadData = () => {
    setIsLoadingSettings(true);
    adminService.getSettings().then(data => {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.key] = s.value);
      setSettings(map);
      if (map['global_ai_provider'] === 'local' || map['global_local_url']) {
        fetchLocalModels(map['global_local_url'], map['global_local_model']);
      }
    }).finally(() => setIsLoadingSettings(false));

    adminService.getAiStatus().then(status => {
      setAiStatus(status);
    }).catch(err => {
      console.error("Error loading AI status", err);
    });
  };


  useEffect(() => {
    loadData();
  }, []);

  const fetchLocalModels = async (url?: string, currentModel?: string) => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const targetUrl = url || settings['global_local_url'] || 'http://localhost:11434';
      const res = await aiApi.getLocalModels(targetUrl);
      if (res.models && res.models.length > 0) {
        setLocalModels(res.models);
        const selected = currentModel || settings['global_local_model'];
        if (!selected || !res.models.includes(selected)) {
          setSettings(prev => ({ ...prev, global_local_model: res.models[0] }));
        }
      } else {
        setLocalModels([]);
        setModelsError(res.error || 'No se detectaron modelos descargados en Ollama.');
      }
    } catch (err) {
      setLocalModels([]);
      setModelsError('No se pudo conectar con Ollama.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'global_ai_provider' && value === 'local') {
      fetchLocalModels(settings['global_local_url']);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingAi(true);
    setTestResult(null);
    const activeProv = settings['global_ai_provider'] || aiStatus?.active_provider || 'gemini';
    const getApiKey = () => {
      switch(activeProv) {
        case 'openai': return settings['global_openai_key'];
        case 'anthropic': return settings['global_anthropic_key'];
        case 'groq': return settings['global_groq_key'];
        case 'openrouter': return settings['global_openrouter_key'];
        case 'gemini': default: return settings['global_gemini_key'];
      }
    };
    
    try {
      const res = await adminService.testAiConnection({
        provider: activeProv,
        api_key: getApiKey(),
        local_url: settings['global_local_url'],
        local_model: settings['global_local_model']
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        ok: false,
        provider: activeProv,
        model: 'unknown',
        latency_ms: 0,
        error: e?.response?.data?.detail || e.message || 'Error de conexión'
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await adminService.updateSetting({ key, value });
      }
      alert("Configuraciones guardadas con éxito");
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error guardando configuraciones");
    } finally {
      setIsSaving(false);
    }
  };

  const activeProviderKey = settings['global_ai_provider'] || aiStatus?.active_provider || 'gemini';
  const activeProviderInfo = aiStatus?.providers[activeProviderKey as keyof typeof aiStatus.providers];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Configuración Global</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Ajustes a nivel de servidor que aplican a todos los usuarios.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#6366f1] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4f46e5] transition-colors disabled:opacity-50 shrink-0"
        >
          <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Seguridad */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-green-500" size={20} />
            <h2 className="text-lg font-bold">Seguridad y Apariencia Pública</h2>
          </div>
          
          <div className="space-y-6">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                disabled={isLoadingSettings}
                checked={settings['allow_public_registration'] !== undefined ? settings['allow_public_registration'] === 'true' : true} 
                onChange={(e) => handleChange('allow_public_registration', e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 rounded border-[var(--color-border)] text-[#6366f1] focus:ring-[#6366f1] bg-[var(--color-background)] disabled:opacity-50"
              />
              <div>
                <div className="font-medium">Permitir Registro Público</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Si se desactiva, solo los administradores podrán crear nuevas cuentas.</div>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">Tema del Inicio de Sesión (Global)</label>
              <select 
                value={settings['login_theme'] || 'parchment'} 
                onChange={(e) => handleChange('login_theme', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              >
                <option value="modern">Moderno (Cristal Índigo)</option>
                <option value="parchment">Clásico (Papiro Oscuro)</option>
                <option value="grimoire">Fantasía (Libro de Hechizos)</option>
                <option value="neon">Sci-Fi (Cristal de Neón)</option>
              </select>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Este tema se aplicará automáticamente a todos los usuarios en la pantalla de login.</p>
            </div>
          </div>
        </div>

        {/* IA Global */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="text-blue-500" size={20} />
              <h2 className="text-lg font-bold">Servidor de IA (Llave Maestra)</h2>
            </div>
            {aiStatus && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Servidor Conectado
              </span>
            )}
          </div>
          
          <p className="text-sm text-[var(--color-text-secondary)]">
            Estas configuraciones se usarán como respaldo para todos los usuarios que no tengan su propia API Key configurada.
          </p>

          {/* Tarjeta de Estado Activo y Prueba en Vivo */}
          <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold mb-0.5">
                  Proveedor Global en Uso
                </div>
                <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="text-base">{activeProviderInfo?.name || activeProviderKey.toUpperCase()}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] bg-white/5 px-2 py-0.5 rounded border border-[var(--color-border)] font-mono">
                    {activeProviderInfo?.model || aiStatus?.active_model || 'default'}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {activeProviderInfo?.source === 'env' && (
                    <span className="text-emerald-400 font-medium">✓ Utilizando clave configurada en el archivo .env del servidor</span>
                  )}
                  {activeProviderInfo?.source === 'db' && (
                    <span className="text-indigo-400 font-medium">✓ Utilizando clave guardada en la base de datos</span>
                  )}
                  {activeProviderInfo?.source === 'none' && (
                    <span className="text-amber-400 font-medium">⚠️ No se ha detectado clave para este proveedor</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingAi}
                className="self-start sm:self-center px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isTestingAi ? 'Probando respuesta...' : '⚡ Probar Conexión'}</span>
              </button>
            </div>

            {/* Resultado de la prueba */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.ok 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{testResult.ok ? 'Prueba exitosa' : 'Fallo en la prueba'}</div>
                  <div className="mt-0.5 opacity-90">{testResult.message || testResult.error}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor Global por Defecto</label>
              <select 
                value={settings['global_ai_provider'] || 'gemini'} 
                onChange={(e) => handleChange('global_ai_provider', e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
                <option value="local">Ollama (Local / Offline)</option>
              </select>
            </div>

            {/* Gemini */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">API Key de Gemini</label>
                {aiStatus?.providers.gemini && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    aiStatus.providers.gemini.source === 'env'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : (aiStatus.providers.gemini.source === 'db'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'text-[var(--color-text-secondary)] border-transparent')
                  }`}>
                    {aiStatus.providers.gemini.source === 'env' && `✓ Detectada en .env (${aiStatus.providers.gemini.masked_key})`}
                    {aiStatus.providers.gemini.source === 'db' && `✓ Guardada en BD (${aiStatus.providers.gemini.masked_key})`}
                    {aiStatus.providers.gemini.source === 'none' && '⚪ Sin configurar'}
                  </span>
                )}
              </div>
              <input 
                type="password"
                value={settings['global_gemini_key'] || ''}
                onChange={(e) => handleChange('global_gemini_key', e.target.value)}
                placeholder={aiStatus?.providers.gemini.source === 'env' ? `Usando clave de .env (${aiStatus.providers.gemini.masked_key})` : 'AIzaSy...'}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Modelo de Gemini</label>
                <select 
                  value={settings['global_gemini_model'] || 'gemini/gemini-2.5-flash'} 
                  onChange={(e) => handleChange('global_gemini_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="gemini/gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini/gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini/gemini-flash-lite-latest">Gemini Flash Lite</option>
                </select>
              </div>
              {aiStatus?.providers.gemini.source === 'env' && !settings['global_gemini_key'] && (
                <p className="text-xs text-emerald-400 mt-1">
                  💡 Clave activa desde el archivo <code className="bg-white/5 px-1 py-0.5 rounded">.env</code>. No es necesario escribirla de nuevo a menos que quieras anularla.
                </p>
              )}
            </div>
            
            {/* OpenAI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">API Key de OpenAI</label>
                {aiStatus?.providers.openai && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    aiStatus.providers.openai.source === 'env'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : (aiStatus.providers.openai.source === 'db'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'text-[var(--color-text-secondary)] border-transparent')
                  }`}>
                    {aiStatus.providers.openai.source === 'env' && `✓ Detectada en .env (${aiStatus.providers.openai.masked_key})`}
                    {aiStatus.providers.openai.source === 'db' && `✓ Guardada en BD (${aiStatus.providers.openai.masked_key})`}
                    {aiStatus.providers.openai.source === 'none' && '⚪ Sin configurar'}
                  </span>
                )}
              </div>
              <input 
                type="password"
                value={settings['global_openai_key'] || ''}
                onChange={(e) => handleChange('global_openai_key', e.target.value)}
                placeholder={aiStatus?.providers.openai.source === 'env' ? `Usando clave de .env (${aiStatus.providers.openai.masked_key})` : 'sk-...'}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Modelo de OpenAI</label>
                <select 
                  value={settings['global_openai_model'] || 'gpt-4o-mini'} 
                  onChange={(e) => handleChange('global_openai_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Rápido)</option>
                  <option value="gpt-4o">GPT-4o (Avanzado)</option>
                  <option value="o1-mini">o1-mini (Razonamiento)</option>
                </select>
              </div>
            </div>

            {/* Anthropic */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">API Key de Anthropic (Claude)</label>
                {aiStatus?.providers.anthropic && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    aiStatus.providers.anthropic.source === 'env'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : (aiStatus.providers.anthropic.source === 'db'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'text-[var(--color-text-secondary)] border-transparent')
                  }`}>
                    {aiStatus.providers.anthropic.source === 'env' && `✓ Detectada en .env (${aiStatus.providers.anthropic.masked_key})`}
                    {aiStatus.providers.anthropic.source === 'db' && `✓ Guardada en BD (${aiStatus.providers.anthropic.masked_key})`}
                    {aiStatus.providers.anthropic.source === 'none' && '⚪ Sin configurar'}
                  </span>
                )}
              </div>
              <input 
                type="password"
                value={settings['global_anthropic_key'] || ''}
                onChange={(e) => handleChange('global_anthropic_key', e.target.value)}
                placeholder={aiStatus?.providers.anthropic.source === 'env' ? `Usando clave de .env (${aiStatus.providers.anthropic.masked_key})` : 'sk-ant-...'}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Modelo de Anthropic</label>
                <select 
                  value={settings['global_anthropic_model'] || 'claude-3-5-haiku-latest'} 
                  onChange={(e) => handleChange('global_anthropic_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Rápido)</option>
                  <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Recomendado)</option>
                  <option value="claude-3-opus-latest">Claude 3 Opus (Potente)</option>
                </select>
              </div>
            </div>

            {/* Groq */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">API Key de Groq</label>
                {aiStatus?.providers.groq && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    aiStatus.providers.groq.source === 'env'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : (aiStatus.providers.groq.source === 'db'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'text-[var(--color-text-secondary)] border-transparent')
                  }`}>
                    {aiStatus.providers.groq.source === 'env' && `✓ Detectada en .env (${aiStatus.providers.groq.masked_key})`}
                    {aiStatus.providers.groq.source === 'db' && `✓ Guardada en BD (${aiStatus.providers.groq.masked_key})`}
                    {aiStatus.providers.groq.source === 'none' && '⚪ Sin configurar'}
                  </span>
                )}
              </div>
              <input 
                type="password"
                value={settings['global_groq_key'] || ''}
                onChange={(e) => handleChange('global_groq_key', e.target.value)}
                placeholder={aiStatus?.providers.groq?.source === 'env' ? `Usando clave de .env (${aiStatus.providers.groq.masked_key})` : 'gsk_...'}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Modelo de Groq</label>
                <select 
                  value={settings['global_groq_model'] || 'groq/llama-3.3-70b-versatile'} 
                  onChange={(e) => handleChange('global_groq_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="groq/llama-3.3-70b-versatile">Llama 3.3 70B (Versátil)</option>
                  <option value="groq/llama-3.1-8b-instant">Llama 3.1 8B (Instantáneo)</option>
                  <option value="groq/mixtral-8x7b-32768">Mixtral 8x7B (32K Contexto)</option>
                </select>
              </div>
            </div>

            {/* OpenRouter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">API Key de OpenRouter</label>
                {aiStatus?.providers.openrouter && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    aiStatus.providers.openrouter.source === 'env'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : (aiStatus.providers.openrouter.source === 'db'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'text-[var(--color-text-secondary)] border-transparent')
                  }`}>
                    {aiStatus.providers.openrouter.source === 'env' && `✓ Detectada en .env (${aiStatus.providers.openrouter.masked_key})`}
                    {aiStatus.providers.openrouter.source === 'db' && `✓ Guardada en BD (${aiStatus.providers.openrouter.masked_key})`}
                    {aiStatus.providers.openrouter.source === 'none' && '⚪ Sin configurar'}
                  </span>
                )}
              </div>
              <input 
                type="password"
                value={settings['global_openrouter_key'] || ''}
                onChange={(e) => handleChange('global_openrouter_key', e.target.value)}
                placeholder={aiStatus?.providers.openrouter?.source === 'env' ? `Usando clave de .env (${aiStatus.providers.openrouter.masked_key})` : 'sk-or-...'}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
              />
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Modelo de OpenRouter</label>
                <select 
                  value={settings['global_openrouter_model'] || 'openrouter/meta-llama/llama-3.3-70b-instruct'} 
                  onChange={(e) => handleChange('global_openrouter_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="openrouter/meta-llama/llama-3.3-70b-instruct">Meta: Llama 3.3 70B</option>
                  <option value="openrouter/anthropic/claude-3.5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
                  <option value="openrouter/google/gemini-2.5-pro">Google: Gemini 2.5 Pro</option>
                </select>
              </div>
            </div>

            {/* Ollama URL */}
            <div>
              <label className="block text-sm font-medium mb-1">URL Base de Ollama (Offline)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="http://localhost:11434"
                  value={settings['global_local_url'] || ''} 
                  onChange={(e) => handleChange('global_local_url', e.target.value)}
                  className="flex-1 min-w-0 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => fetchLocalModels(settings['global_local_url'])}
                  disabled={isLoadingModels}
                  className="shrink-0 px-3 py-2 bg-white/5 hover:bg-white/10 text-[var(--color-text-primary)] rounded-md border border-[var(--color-border)] flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
                  title="Detectar modelos disponibles"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin text-[#6366f1]' : ''}`} />
                  <span>{isLoadingModels ? 'Buscando...' : 'Detectar'}</span>
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Ejemplo: http://127.0.0.1:11434 o http://localhost:11434</p>
            </div>

            {/* Ollama Model */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Modelo por Defecto de Ollama</label>
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
                    value={settings['global_local_model'] || localModels[0]}
                    onChange={(e) => handleChange('global_local_model', e.target.value)}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)] appearance-none cursor-pointer"
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
                  placeholder="llama3:8b"
                  value={settings['global_local_model'] || ''} 
                  onChange={(e) => handleChange('global_local_model', e.target.value)}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-text-primary)]"
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
        </div>
        
      </div>
    </div>
  );
}
