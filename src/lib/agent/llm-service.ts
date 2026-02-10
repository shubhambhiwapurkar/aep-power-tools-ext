/**
 * Multi-provider LLM Service — supports all major AI providers
 * Like Cline extension: users choose their preferred provider and model
 */

import type { AIProviderConfig, AIProvider } from '@/lib/types'

export interface LLMMessage {
    role: 'user' | 'assistant' | 'system' | 'model'
    content: string
}

export interface LLMToolDeclaration {
    name: string
    description: string
    parameters: {
        type: string
        properties: Record<string, { type: string; description: string; enum?: string[] }>
        required?: string[]
    }
}

export interface LLMResponse {
    text?: string
    toolCalls?: Array<{ name: string; args: Record<string, unknown> }>
}

// ─── Provider Implementations ───

async function callOpenAI(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const msgs: any[] = []
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
    msgs.push(...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })))

    const body: any = { model: config.model, messages: msgs, max_tokens: config.maxTokens || 4096, temperature: config.temperature ?? 0.7 }
    if (tools?.length) {
        body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `OpenAI error: ${res.status}`)
    const choice = data.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
        return { toolCalls: choice.message.tool_calls.map((tc: any) => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}') })) }
    }
    return { text: choice?.message?.content || '' }
}

async function callAnthropic(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const msgs = messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role === 'system' ? 'user' : m.role, content: m.content }))

    const body: any = { model: config.model, max_tokens: config.maxTokens || 4096, messages: msgs }
    if (systemPrompt) body.system = systemPrompt
    if (tools?.length) {
        body.tools = tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters }))
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `Anthropic error: ${res.status}`)

    const toolUse = data.content?.find((c: any) => c.type === 'tool_use')
    if (toolUse) {
        return { toolCalls: [{ name: toolUse.name, args: toolUse.input || {} }] }
    }
    const textBlock = data.content?.find((c: any) => c.type === 'text')
    return { text: textBlock?.text || '' }
}

async function callGemini(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const contents = messages.map(m => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const body: any = { contents }
    if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] }
    if (tools?.length) {
        body.tools = [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })) }]
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `Gemini error: ${res.status}`)

    const candidate = data.candidates?.[0]
    const parts = candidate?.content?.parts || []
    const fnCall = parts.find((p: any) => p.functionCall)
    if (fnCall) {
        return { toolCalls: [{ name: fnCall.functionCall.name, args: fnCall.functionCall.args || {} }] }
    }
    const text = parts.map((p: any) => p.text || '').join('')
    return { text }
}

async function callOllama(config: AIProviderConfig, messages: LLMMessage[], _tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const msgs: any[] = []
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
    msgs.push(...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })))

    const res = await fetch(`${config.baseUrl || 'http://localhost:11434'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages: msgs, stream: false, options: { temperature: config.temperature ?? 0.7 } }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
    return { text: data.message?.content || '' }
}

async function callOpenRouter(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const msgs: any[] = []
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
    msgs.push(...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })))

    const body: any = { model: config.model, messages: msgs, max_tokens: config.maxTokens || 4096 }
    if (tools?.length) {
        body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `OpenRouter error: ${res.status}`)
    const choice = data.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
        return { toolCalls: choice.message.tool_calls.map((tc: any) => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}') })) }
    }
    return { text: choice?.message?.content || '' }
}

async function callAzureOpenAI(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const msgs: any[] = []
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
    msgs.push(...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })))

    const body: any = { messages: msgs, max_tokens: config.maxTokens || 4096, temperature: config.temperature ?? 0.7 }
    if (tools?.length) {
        body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
    }

    const url = `${config.baseUrl}/openai/deployments/${config.azureDeployment}/chat/completions?api-version=2024-02-15-preview`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `Azure OpenAI error: ${res.status}`)
    const choice = data.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
        return { toolCalls: choice.message.tool_calls.map((tc: any) => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}') })) }
    }
    return { text: choice?.message?.content || '' }
}

async function callCustom(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    // OpenAI-compatible endpoint
    const msgs: any[] = []
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
    msgs.push(...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })))

    const body: any = { model: config.model, messages: msgs, max_tokens: config.maxTokens || 4096 }
    if (tools?.length) {
        body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
    }

    const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || `Custom error: ${res.status}`)
    const choice = data.choices?.[0]
    if (choice?.message?.tool_calls?.length) {
        return { toolCalls: choice.message.tool_calls.map((tc: any) => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}') })) }
    }
    return { text: choice?.message?.content || '' }
}

// ─── Unified LLM Call ───

const PROVIDER_MAP: Record<AIProvider, (config: AIProviderConfig, msgs: LLMMessage[], tools?: LLMToolDeclaration[], sys?: string) => Promise<LLMResponse>> = {
    openai: callOpenAI,
    anthropic: callAnthropic,
    gemini: callGemini,
    ollama: callOllama,
    openrouter: callOpenRouter,
    'azure-openai': callAzureOpenAI,
    custom: callCustom,
}

export async function callLLM(config: AIProviderConfig, messages: LLMMessage[], tools?: LLMToolDeclaration[], systemPrompt?: string): Promise<LLMResponse> {
    const handler = PROVIDER_MAP[config.provider]
    if (!handler) throw new Error(`Unsupported provider: ${config.provider}`)
    return handler(config, messages, tools, systemPrompt)
}

export async function summarizeWithLLM(config: AIProviderConfig, text: string): Promise<string> {
    const response = await callLLM(config, [{ role: 'user', content: `Summarize the following data concisely:\n\n${text}` }], undefined, 'You are a helpful assistant that summarizes AEP platform data.')
    return response.text || text
}
