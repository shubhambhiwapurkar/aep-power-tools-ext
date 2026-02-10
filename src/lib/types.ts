export interface AEPConfig {
    id?: string
    name: string
    clientId: string
    clientSecret: string
    orgId: string
    sandbox: string
    sandboxId: string
    authToken: string
    isActive: boolean
    createdAt: number
    updatedAt: number
}

export interface AIProviderConfig {
    provider: AIProvider
    apiKey: string
    model: string
    baseUrl?: string     // For Azure OpenAI, Ollama, Custom
    azureDeployment?: string  // Azure OpenAI specific
    temperature?: number
    maxTokens?: number
}

export type AIProvider =
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'azure-openai'
    | 'ollama'
    | 'openrouter'
    | 'custom'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    toolsUsed?: string[]
    requiresApproval?: boolean
    pendingAction?: {
        tool: string
        args: Record<string, unknown>
        description: string
    }
    timestamp: number
}

export interface AgentResponse {
    content: string
    data?: unknown
    toolsUsed: string[]
    requiresApproval?: boolean
    pendingAction?: {
        toolName: string
        toolArguments: Record<string, unknown>
        description: string
    }
}

// AEP API response types
export interface AEPBatch {
    id: string
    status: string
    created: number
    updated: number
    relatedObjects?: Array<{ id: string; type: string }>
    metrics?: Record<string, unknown>
}

export interface AEPDataset {
    id: string
    name: string
    description?: string
    created: number
    updated: number
    schemaRef?: { id: string; contentType: string }
    tags?: Record<string, string[]>
}

export interface AEPSegment {
    id: string
    name: string
    description?: string
    expression?: { type: string; value: string }
    evaluationInfo?: Record<string, unknown>
    creationTime?: number
    updateTime?: number
}

export interface AEPFlow {
    id: string
    name: string
    state: string
    createdAt?: string
    updatedAt?: string
    sourceConnectionIds?: string[]
    targetConnectionIds?: string[]
}

export interface AEPSchema {
    $id: string
    title: string
    description?: string
    type: string
    meta?: Record<string, unknown>
}

export interface AEPIdentityNamespace {
    id?: number
    code: string
    name: string
    description?: string
    idType: string
    status: string
}

export interface HealthCheckResult {
    service: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTime?: number
    message?: string
}
