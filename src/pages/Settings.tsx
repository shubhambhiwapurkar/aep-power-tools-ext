import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { saveAISettings, getAISettings } from '@/lib/config-storage'
import type { AIProvider, AIProviderConfig } from '@/lib/types'

const PROVIDERS: { id: AIProvider; name: string; description: string; models: string[]; needsApiKey: boolean; needsBaseUrl: boolean; needsDeployment: boolean }[] = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4 Turbo, GPT-3.5', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'], needsApiKey: true, needsBaseUrl: false, needsDeployment: false },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Opus/Haiku', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'], needsApiKey: true, needsBaseUrl: false, needsDeployment: false },
    { id: 'gemini', name: 'Google Gemini', description: 'Gemini 2.0 Flash, Gemini Pro', models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'], needsApiKey: true, needsBaseUrl: false, needsDeployment: false },
    { id: 'azure-openai', name: 'Azure OpenAI', description: 'Any deployed Azure OpenAI model', models: ['gpt-4o', 'gpt-4', 'gpt-35-turbo'], needsApiKey: true, needsBaseUrl: true, needsDeployment: true },
    { id: 'ollama', name: 'Ollama (Local)', description: 'Llama 3, Mistral, CodeGemma, etc.', models: ['llama3:latest', 'mistral:latest', 'gemma:latest', 'codellama:latest', 'phi3:latest'], needsApiKey: false, needsBaseUrl: true, needsDeployment: false },
    { id: 'openrouter', name: 'OpenRouter', description: 'Access 100+ models via OpenRouter', models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro', 'meta-llama/llama-3-70b-instruct'], needsApiKey: true, needsBaseUrl: false, needsDeployment: false },
    { id: 'custom', name: 'Custom (OpenAI-Compatible)', description: 'Any OpenAI-compatible API endpoint', models: ['custom-model'], needsApiKey: true, needsBaseUrl: true, needsDeployment: false },
]

export function Settings() {
    const [provider, setProvider] = useState<AIProvider>('gemini')
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [azureDeployment, setAzureDeployment] = useState('')
    const [temperature, setTemperature] = useState('0.7')
    const [maxTokens, setMaxTokens] = useState('4096')
    const [saved, setSaved] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

    useEffect(() => { loadSettings() }, [])

    const loadSettings = async () => {
        const settings = await getAISettings()
        if (settings) {
            setProvider(settings.provider)
            setApiKey(settings.apiKey)
            setModel(settings.model)
            setBaseUrl(settings.baseUrl || '')
            setAzureDeployment(settings.azureDeployment || '')
            setTemperature(String(settings.temperature ?? 0.7))
            setMaxTokens(String(settings.maxTokens ?? 4096))
        }
    }

    const handleProviderChange = (p: string) => {
        setProvider(p as AIProvider)
        const providerDef = PROVIDERS.find(pr => pr.id === p)
        if (providerDef) setModel(providerDef.models[0])
        if (p === 'ollama') setBaseUrl('http://localhost:11434')
        else if (p === 'openrouter') setBaseUrl('')
        else if (p === 'custom') setBaseUrl('')
        setTestResult(null)
    }

    const handleSave = async () => {
        await saveAISettings({
            provider, apiKey, model,
            baseUrl: baseUrl || undefined,
            azureDeployment: azureDeployment || undefined,
            temperature: parseFloat(temperature),
            maxTokens: parseInt(maxTokens),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleTest = async () => {
        setTesting(true); setTestResult(null)
        try {
            // Quick test for each provider
            let url = '', headers: Record<string, string> = {}, body = ''

            if (provider === 'gemini') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
                headers = { 'Content-Type': 'application/json' }
                body = JSON.stringify({ contents: [{ parts: [{ text: 'Say "hello"' }] }] })
            } else if (provider === 'openai') {
                url = 'https://api.openai.com/v1/chat/completions'
                headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
                body = JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "hello"' }], max_tokens: 5 })
            } else if (provider === 'anthropic') {
                url = 'https://api.anthropic.com/v1/messages'
                headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
                body = JSON.stringify({ model, max_tokens: 5, messages: [{ role: 'user', content: 'Say "hello"' }] })
            } else if (provider === 'ollama') {
                url = `${baseUrl}/api/generate`
                headers = { 'Content-Type': 'application/json' }
                body = JSON.stringify({ model, prompt: 'Say hello', stream: false })
            } else if (provider === 'openrouter') {
                url = 'https://openrouter.ai/api/v1/chat/completions'
                headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
                body = JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "hello"' }], max_tokens: 5 })
            } else if (provider === 'azure-openai') {
                url = `${baseUrl}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-02-15-preview`
                headers = { 'Content-Type': 'application/json', 'api-key': apiKey }
                body = JSON.stringify({ messages: [{ role: 'user', content: 'Say "hello"' }], max_tokens: 5 })
            } else {
                url = `${baseUrl}/v1/chat/completions`
                headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
                body = JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "hello"' }], max_tokens: 5 })
            }

            const res = await fetch(url, { method: 'POST', headers, body })
            setTestResult(res.ok ? 'success' : 'error')
        } catch { setTestResult('error') }
        finally { setTesting(false) }
    }

    const currentProvider = PROVIDERS.find(p => p.id === provider)!

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your AI provider for the copilot</p>
            </div>

            {/* Provider Selection */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Provider</CardTitle>
                    <CardDescription className="text-xs">Choose any AI provider — like Cline, use the model you prefer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {PROVIDERS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handleProviderChange(p.id)}
                                className={`text-left p-2 rounded-md border text-xs transition-colors cursor-pointer ${provider === p.id
                                        ? 'border-primary bg-primary/5 text-foreground'
                                        : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <div className="font-medium">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Provider Config */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{currentProvider.name} Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentProvider.needsApiKey && (
                        <div className="space-y-1">
                            <Label className="text-xs">API Key</Label>
                            <Input type="password" className="h-8 text-xs font-mono" placeholder={`Enter ${currentProvider.name} API key...`} value={apiKey} onChange={e => setApiKey(e.target.value)} />
                        </div>
                    )}

                    {currentProvider.needsBaseUrl && (
                        <div className="space-y-1">
                            <Label className="text-xs">Base URL</Label>
                            <Input className="h-8 text-xs font-mono" placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://your-endpoint.com'} value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
                        </div>
                    )}

                    {currentProvider.needsDeployment && (
                        <div className="space-y-1">
                            <Label className="text-xs">Deployment Name</Label>
                            <Input className="h-8 text-xs" placeholder="my-gpt4-deployment" value={azureDeployment} onChange={e => setAzureDeployment(e.target.value)} />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs">Model</Label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {currentProvider.models.map(m => (
                                    <SelectItem key={m} value={m}><span className="text-xs">{m}</span></SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Temperature</Label>
                            <Input type="number" step="0.1" min="0" max="2" className="h-8 text-xs" value={temperature} onChange={e => setTemperature(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Max Tokens</Label>
                            <Input type="number" step="256" min="256" max="32768" className="h-8 text-xs" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={handleSave}>
                            {saved ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            {saved ? 'Saved!' : 'Save Settings'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
                            {testing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                            Test Connection
                        </Button>
                        {testResult === 'success' && <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Connected</Badge>}
                        {testResult === 'error' && <Badge variant="error"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
