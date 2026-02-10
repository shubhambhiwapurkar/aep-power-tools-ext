// IndexedDB utility for storing AEP configurations locally in the browser

import type { AEPConfig, AIProviderConfig } from './types'

const DB_NAME = 'AEPPowerToolsDB'
const CONFIG_STORE = 'configurations'
const AI_STORE = 'ai_settings'
const DB_VERSION = 2

let dbInstance: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            dbInstance = request.result
            resolve(request.result)
        }
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(CONFIG_STORE)) {
                const store = db.createObjectStore(CONFIG_STORE, { keyPath: 'id', autoIncrement: false })
                store.createIndex('name', 'name', { unique: false })
                store.createIndex('isActive', 'isActive', { unique: false })
                store.createIndex('createdAt', 'createdAt', { unique: false })
            }
            if (!db.objectStoreNames.contains(AI_STORE)) {
                db.createObjectStore(AI_STORE, { keyPath: 'id', autoIncrement: false })
            }
        }
    })
}

function generateId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export async function saveConfig(config: Partial<AEPConfig> & { name: string }): Promise<string> {
    const db = await initDB()
    const id = config.id || generateId()
    const now = Date.now()

    if (config.isActive) {
        const allConfigs = await getConfigs()
        for (const existing of allConfigs) {
            if (existing.id !== id && existing.isActive) {
                const tx = db.transaction([CONFIG_STORE], 'readwrite')
                tx.objectStore(CONFIG_STORE).put({ ...existing, isActive: false, updatedAt: now })
            }
        }
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction([CONFIG_STORE], 'readwrite')
        const store = tx.objectStore(CONFIG_STORE)
        const getReq = store.get(id)
        getReq.onsuccess = () => {
            const existing = getReq.result
            const configToSave: AEPConfig = {
                id,
                name: config.name,
                clientId: config.clientId || '',
                clientSecret: config.clientSecret || '',
                orgId: config.orgId || '',
                sandbox: config.sandbox || 'prod',
                sandboxId: config.sandboxId || '',
                authToken: config.authToken || '',
                isActive: config.isActive ?? false,
                createdAt: existing?.createdAt || now,
                updatedAt: now,
            }
            const putReq = store.put(configToSave)
            putReq.onsuccess = () => resolve(id)
            putReq.onerror = () => reject(putReq.error)
        }
        getReq.onerror = () => reject(getReq.error)
    })
}

export async function getConfigs(): Promise<AEPConfig[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CONFIG_STORE], 'readonly')
        const req = tx.objectStore(CONFIG_STORE).getAll()
        req.onsuccess = () => {
            const configs = (req.result as AEPConfig[]).sort((a, b) => b.createdAt - a.createdAt)
            resolve(configs)
        }
        req.onerror = () => reject(req.error)
    })
}

export async function getConfig(id: string): Promise<AEPConfig | null> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CONFIG_STORE], 'readonly')
        const req = tx.objectStore(CONFIG_STORE).get(id)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
    })
}

export async function deleteConfig(id: string): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CONFIG_STORE], 'readwrite')
        const req = tx.objectStore(CONFIG_STORE).delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}

export async function getActiveConfig(): Promise<AEPConfig | null> {
    const configs = await getConfigs()
    return configs.find((c) => c.isActive) || null
}

export async function setActiveConfig(id: string): Promise<void> {
    const config = await getConfig(id)
    if (!config) throw new Error('Configuration not found')
    await saveConfig({ ...config, isActive: true })
}

// ─── AI Provider Settings ───

export async function saveAISettings(settings: AIProviderConfig): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([AI_STORE], 'readwrite')
        const req = tx.objectStore(AI_STORE).put({ id: 'default', ...settings })
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}

export async function getAISettings(): Promise<AIProviderConfig | null> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([AI_STORE], 'readonly')
        const req = tx.objectStore(AI_STORE).get('default')
        req.onsuccess = () => {
            if (req.result) {
                const { id: _id, ...settings } = req.result
                resolve(settings as AIProviderConfig)
            } else {
                resolve(null)
            }
        }
        req.onerror = () => reject(req.error)
    })
}
