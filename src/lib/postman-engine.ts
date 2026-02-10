import collection from '@/assets/postman_collection.json'
import { AEPClient } from './aep-client'
import { getActiveConfig } from './config-storage'

export interface PostmanAction {
    id: string
    name: string
    description?: string
    method: string
    url: string
    body?: string
    headers: Record<string, string>
    folder: string[]
}

export interface ActionContext {
    DATASET_ID?: string
    SCHEMA_ID?: string
    BATCH_ID?: string
    SEGMENT_ID?: string
    SANDBOX_NAME?: string
    IMS_ORG?: string
    [key: string]: string | undefined
}

class PostmanActionEngine {
    private actions: PostmanAction[] = []
    private initialized = false

    constructor() {
        this.indexCollection()
    }

    private indexCollection() {
        if (this.initialized) return

        const traverse = (items: any[], path: string[]) => {
            items.forEach(item => {
                if (item.item) {
                    // Folder
                    traverse(item.item, [...path, item.name])
                } else if (item.request) {
                    // Request
                    const url = item.request.url?.raw || item.request.url
                    if (!url) return

                    this.actions.push({
                        id: item.name + '_' + Math.random().toString(36).substr(2, 9),
                        name: item.name,
                        description: item.request.description,
                        method: item.request.method,
                        url: url,
                        body: item.request.body?.mode === 'raw' ? item.request.body.raw : undefined,
                        headers: item.request.header?.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}) || {},
                        folder: path
                    })
                }
            })
        }

        traverse(collection.item, [])
        this.initialized = true
        console.log(`Indexed ${this.actions.length} Postman actions`)
    }

    getActionsForContext(entityType: 'dataset' | 'schema' | 'batch' | 'segment', entityId: string): PostmanAction[] {
        // Simple heuristic matching based on URL patterns or folder names
        // This can be enhanced with AI or more specific rules
        return this.actions.filter(action => {
            const url = action.url.toLowerCase()
            const name = action.name.toLowerCase()
            const folder = action.folder.join('/').toLowerCase()

            if (entityType === 'dataset') {
                return (url.includes('dataset') || folder.includes('catalog')) &&
                    (url.includes('{{dataset') || url.includes(':dataset') || name.includes('dataset'))
            }
            if (entityType === 'schema') {
                return (url.includes('schema') || folder.includes('registry')) &&
                    (url.includes('{{schema') || url.includes(':schema') || name.includes('schema'))
            }
            if (entityType === 'batch') {
                return (url.includes('batch') || folder.includes('catalog')) &&
                    (url.includes('{{batch') || url.includes(':batch') || name.includes('batch'))
            }
            if (entityType === 'segment') {
                return (url.includes('segment') || folder.includes('segmentation')) &&
                    (url.includes('{{segment') || url.includes(':segment') || name.includes('segment'))
            }
            return false
        })
    }

    async executeAction(action: PostmanAction, context: ActionContext): Promise<any> {
        const config = await getActiveConfig()
        if (!config) throw new Error("No active configuration")

        // 1. Variable Substitution
        let url = action.url
        let body = action.body
        let headers = { ...action.headers }

        const fullContext: Record<string, string | undefined> = {
            ...context,
            ACCESS_TOKEN: config.authToken,
            API_KEY: config.clientId,
            IMS_ORG: config.orgId,
            SANDBOX_NAME: config.sandbox,
            items: '10' // Default limit
        }

        // Replace {{VAR}} patterns
        const replaceVars = (str: string) => {
            return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
                const val = fullContext[key] || fullContext[key.toUpperCase()]
                return val || `{{${key}}}` // Leave generic if missing
            })
        }

        url = replaceVars(url)
        if (body) body = replaceVars(body)

        // Handle Headers
        Object.keys(headers).forEach(key => {
            headers[key] = replaceVars(headers[key])
            if (headers[key].includes('{{')) delete headers[key] // Remove unresolved
        })

        // 2. Execution via AEPClient (piggybacking on its fetch logic? No, generic fetch)
        // We'll use a direct fetch wrapper to handle auth if mostly resolved

        // Clean URL protocol if Postman has it weird
        if (!url.startsWith('http')) url = 'https://' + url

        try {
            const res = await fetch(url, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: ['GET', 'HEAD'].includes(action.method) ? undefined : body
            })

            const text = await res.text()
            try {
                return JSON.parse(text)
            } catch {
                return text
            }
        } catch (e: any) {
            console.error("Action execution failed", e)
            return { error: e.message }
        }
    }

    getAllActions() {
        return this.actions
    }
}

export const postmanEngine = new PostmanActionEngine()
