// AEP API Client — unified client ported from aep-unified/lib/aep-client.ts
// Direct API calls from Chrome Extension to platform.adobe.io

export class AEPClient {
    private baseUrl = 'https://platform.adobe.io'
    private accessToken: string | null = null
    private clientId: string
    private clientSecret: string
    private orgId: string
    private sandbox: string
    private sandboxId?: string
    private preGeneratedToken?: string

    constructor(config: {
        clientId: string; clientSecret: string; orgId: string
        sandbox: string; sandboxId?: string; authToken?: string
    }) {
        this.clientId = config.clientId
        this.clientSecret = config.clientSecret
        this.orgId = config.orgId
        this.sandbox = config.sandbox
        this.sandboxId = config.sandboxId
        this.preGeneratedToken = config.authToken
        if (!this.orgId) throw new Error('Organization ID is required')
    }

    private async getAccessToken(): Promise<string> {
        if (this.preGeneratedToken) return this.preGeneratedToken
        if (this.accessToken) return this.accessToken
        try {
            const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    scope: 'openid,AdobeID,read_organizations,additional_info.projectedProductContext,additional_info.job_function,https://ns.adobe.com/s/ent_platform_apis,acp.foundation.catalog',
                }),
            })
            if (!response.ok) throw new Error(`Token request failed: ${response.status}`)
            const data = await response.json()
            this.accessToken = data.access_token
            setTimeout(() => { this.accessToken = null }, 23 * 60 * 60 * 1000)
            return this.accessToken!
        } catch (error) {
            console.error('[aep-client] Failed to get access token:', error)
            throw error
        }
    }

    async makeRequest(endpoint: string, options: RequestInit = {}) {
        const token = await this.getAccessToken()
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-api-key': this.clientId,
            'x-gw-ims-org-id': this.orgId,
            'x-sandbox-name': this.sandbox,
            ...(options.headers as Record<string, string>),
        }
        if (!this.preGeneratedToken && this.sandboxId && this.sandbox !== 'prod') {
            headers['x-sandbox-id'] = this.sandboxId
        }
        const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`AEP API error: ${response.status} ${response.statusText} — ${errorText.substring(0, 200)}`)
        }
        return response.json()
    }

    // ─── Health Check ───
    async healthCheck() {
        try {
            await this.makeRequest('/data/foundation/catalog/datasets?limit=1')
            return { status: 'healthy' as const }
        } catch {
            return { status: 'unhealthy' as const }
        }
    }

    // ─── Profiles ───
    async getProfile(namespace: string, identity: string) {
        return this.makeRequest(`/data/core/ups/access/entities?schema.name=_xdm.context.profile&entityId=${encodeURIComponent(identity)}&entityIdNS=${encodeURIComponent(namespace)}`)
    }
    async getMergePolicies(limit = 20) {
        return this.makeRequest(`/data/core/ups/config/mergePolicies?limit=${limit}`)
    }
    async getMergePolicy(id: string) {
        return this.makeRequest(`/data/core/ups/config/mergePolicies/${id}`)
    }

    // ─── Segments ───
    async getSegmentJobs(limit = 20) {
        return this.makeRequest(`/data/core/ups/segment/jobs?limit=${limit}`)
    }
    async getSegmentJob(jobId: string) {
        return this.makeRequest(`/data/core/ups/segment/jobs/${jobId}`)
    }
    async getSegmentDefinitions(limit = 20) {
        return this.makeRequest(`/data/core/ups/segment/definitions?limit=${limit}`)
    }
    async getSegmentDefinition(segmentId: string) {
        return this.makeRequest(`/data/core/ups/segment/definitions/${segmentId}`)
    }
    async getSegmentSchedules(limit = 20) {
        return this.makeRequest(`/data/core/ups/config/schedules?limit=${limit}`)
    }
    async createSegment(name: string, description: string, pql: string) {
        return this.makeRequest('/data/core/ups/segment/definitions', {
            method: 'POST',
            body: JSON.stringify({
                name, description,
                expression: { type: 'PQL', format: 'pql/text', value: pql },
                schema: { name: '_xdm.context.profile' },
            }),
        })
    }
    async getSegmentJobsForSegment(segmentId: string, limit = 20) {
        const encoded = encodeURIComponent(`'${segmentId}'`)
        return this.makeRequest(`/data/core/ups/segment/jobs?property=segments==${encoded}&limit=${limit}&sort=creationTime:desc`)
    }

    // ─── Datasets ───
    async getDatasets(limit = 20) {
        return this.makeRequest(`/data/foundation/catalog/datasets?limit=${limit}&orderBy=desc:created`)
    }
    async getDataset(datasetId: string) {
        return this.makeRequest(`/data/foundation/catalog/datasets/${datasetId}`)
    }

    // ─── Batches ───
    async getBatches(datasetId?: string, limit = 50) {
        let endpoint = `/data/foundation/catalog/batches?limit=${limit}&orderBy=desc:created`
        if (datasetId) endpoint = `/data/foundation/catalog/batches?property=relatedObjects.id==${encodeURIComponent(datasetId)}&limit=${limit}&orderBy=desc:created`
        return this.makeRequest(endpoint)
    }
    async getBatch(batchId: string) {
        return this.makeRequest(`/data/foundation/catalog/batches/${batchId}`)
    }
    async getRelatedBatches(batchId: string) {
        return this.makeRequest(`/data/foundation/catalog/batches?batch=${batchId}`)
    }

    // ─── Schemas ───
    async getSchemas(container = 'tenant', limit = 20) {
        return this.makeRequest(`/data/foundation/schemaregistry/tenant/schemas?limit=${limit}`, {
            headers: { Accept: 'application/vnd.adobe.xed-id+json' },
        })
    }
    async getSchema(schemaId: string, container = 'tenant') {
        return this.makeRequest(`/data/foundation/schemaregistry/${container}/schemas/${encodeURIComponent(schemaId)}`, {
            headers: { Accept: 'application/vnd.adobe.xed-full+json' },
        })
    }
    async getFieldGroups(container = 'tenant', limit = 20) {
        return this.makeRequest(`/data/foundation/schemaregistry/${container}/fieldgroups?limit=${limit}`, {
            headers: { Accept: 'application/vnd.adobe.xed-id+json' },
        })
    }
    async searchSchemas(query: string, container = 'tenant') {
        return this.makeRequest(`/data/foundation/schemaregistry/${container}/schemas?property=title~${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/vnd.adobe.xed-id+json' },
        })
    }

    // ─── Identity ───
    async getIdentityNamespaces() {
        return this.makeRequest('/data/core/idnamespace/identities')
    }
    async getIdentityGraph(namespace: string, identity: string) {
        return this.makeRequest(`/data/core/identity/cluster/members?xid.id=${encodeURIComponent(identity)}&xid.namespace.code=${encodeURIComponent(namespace)}&graph-type=coop`)
    }
    async getIdentityHistory(namespace: string, identity: string) {
        return this.makeRequest(`/data/core/identity/cluster/history?xid.id=${encodeURIComponent(identity)}&xid.namespace.code=${encodeURIComponent(namespace)}`)
    }

    async getIdentityCluster(namespace: string, id: string) {
        // Identity Service API
        // https://platform.adobe.io/data/core/idnamespace/identities
        return this.makeRequest(`/data/core/idnamespace/identities?namespace=${namespace}&id=${id}`)
    }

    // ─── Sources / Flows ───
    async getSourceConnections() {
        return this.makeRequest('/data/foundation/flowservice/connections?property=connectionSpec.id==8a9c3494-9708-43d7-ae3f-cda01e5030e1')
    }
    async getSourceConnection(id: string) {
        return this.makeRequest(`/data/foundation/flowservice/connections/${id}`)
    }
    async getAllFlows(limit = 20) {
        return this.makeRequest(`/data/foundation/flowservice/flows?limit=${limit}`)
    }
    async getFlow(flowId: string) {
        return this.makeRequest(`/data/foundation/flowservice/flows/${flowId}`)
    }
    async getFlowRuns(flowId: string, limit: number = 5) {
        return this.makeRequest(`/data/foundation/flowservice/runs?flowId=${flowId}&limit=${limit}`)
    }
    async getAllFlowRuns(limit = 20) {
        return this.makeRequest(`/data/foundation/flowservice/runs?limit=${limit}&orderBy=createdAt:desc`)
    }
    async getFlowSpec(flowSpecId: string) {
        return this.makeRequest(`/data/foundation/flowservice/flowSpecs/${flowSpecId}`)
    }

    // ─── Destinations ───
    async getDestinationConnections() {
        return this.makeRequest('/data/foundation/flowservice/connections?property=connectionSpec.id!=8a9c3494-9708-43d7-ae3f-cda01e5030e1')
    }
    async getDestinationConnection(id: string) {
        return this.makeRequest(`/data/foundation/flowservice/connections/${id}`)
    }
    async getDestinationFlows() {
        return this.makeRequest('/data/foundation/flowservice/flows')
    }
    async getConnectionSpecs() {
        return this.makeRequest('/data/foundation/flowservice/connectionSpecs')
    }

    // ─── Query Service ───
    async getQueries(limit = 10) {
        return this.makeRequest(`/data/foundation/query/queries?limit=${limit}&orderBy=-created`)
    }
    async executeQuery(sql: string, name?: string) {
        return this.makeRequest('/data/foundation/query/queries', {
            method: 'POST',
            body: JSON.stringify({ dbName: `${this.orgId}:${this.sandbox}`, sql, name: name || `query_${Date.now()}` }),
        })
    }

    // ─── Sandboxes ───
    async getSandboxes() {
        return this.makeRequest('/data/foundation/sandbox-management/sandboxes')
    }

    // ─── Batch Segmentation ───
    async getBatchSegmentationSchedules() {
        const response = await this.makeRequest('/data/core/ups/config/schedules')
        if (response?.children) {
            const active = response.children.filter((s: any) => s.type === 'batch_segmentation' && s.state === 'active')
            return { children: active }
        }
        return response
    }

    // ─── Export Jobs ───
    async getProfileExportJobs(limit = 20) {
        return this.makeRequest(`/data/core/ups/export/jobs/?showSegmentMetrics=true&limit=${limit}&sort=creationTime:desc`)
    }
    async getExportSchedules() {
        return this.makeRequest('/data/core/ups/config/schedules')
    }

    // ─── Ingestion ───
    async getIngestionFlows() {
        return this.makeRequest('/data/foundation/flowservice/flows')
    }
    async getIngestionFlowRuns(limit = 20) {
        return this.makeRequest(`/data/foundation/flowservice/runs?limit=${limit}&orderBy=createdAt:desc`)
    }
    async getIngestionDatasets() {
        return this.makeRequest('/data/foundation/catalog/datasets?limit=50&orderBy=desc:created')
    }

    // ─── Observability (Mock) ───
    async getStreamingMetrics() {
        return {
            rps: Math.floor(Math.random() * 2000),
            limit: 2500,
            status: 'HEALTHY'
        }
    }

    // ─── Platform Health ───
    async getSystemHealthSummary() {
        const results: Record<string, any> = {}
        try {
            const [datasets, batches, segments, flows] = await Promise.allSettled([
                this.getDatasets(5),
                this.getBatches(undefined, 5),
                this.getSegmentDefinitions(5),
                this.getAllFlows(5),
            ])
            results.datasets = datasets.status === 'fulfilled' ? datasets.value : null
            results.batches = batches.status === 'fulfilled' ? batches.value : null
            results.segments = segments.status === 'fulfilled' ? segments.value : null
            results.flows = flows.status === 'fulfilled' ? flows.value : null
            return results
        } catch (error) {
            console.error('[aep-client] Health summary failed:', error)
            return results
        }
    }

    // ─── Aliases for compatibility ───
    async listBatches(options: { limit?: number } = {}) {
        return this.getBatches(undefined, options.limit)
    }
    async listSegments(options: { limit?: number } = {}) {
        return this.getSegmentDefinitions(options.limit)
    }
    async listDatasets(options: { limit?: number } = {}) {
        return this.getDatasets(options.limit)
    }
    async listSchemas(options: { limit?: number } = {}) {
        return this.getSchemas('tenant', options.limit)
    }
}

// Factory
export async function createAEPClient(config: {
    clientId: string; clientSecret: string; orgId: string
    sandbox: string; sandboxId?: string; authToken?: string
}): Promise<AEPClient> {
    return new AEPClient(config)
}
