/**
 * AEP Agent Tools — defines callable tools for the AI copilot
 * Ported and adapted from aep-unified/lib/agent/tools.ts
 */

import { AEPClient } from '@/lib/aep-client'
import type { LLMToolDeclaration } from './llm-service'

export interface ToolDef {
    name: string
    description: string
    parameters: LLMToolDeclaration['parameters']
    requiresApproval?: boolean
    execute: (args: Record<string, any>) => Promise<unknown>
}

export function createTools(client: AEPClient): Record<string, ToolDef> {
    return {
        // ─── Datasets ───
        list_datasets: {
            name: 'list_datasets',
            description: 'List AEP datasets with optional limit',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max datasets to return (default 20)' } } },
            execute: async (args) => client.getDatasets(args.limit || 20),
        },
        get_dataset: {
            name: 'get_dataset',
            description: 'Get details of a specific dataset by ID',
            parameters: { type: 'object', properties: { datasetId: { type: 'string', description: 'Dataset ID' } }, required: ['datasetId'] },
            execute: async (args) => client.getDataset(args.datasetId),
        },

        // ─── Batches ───
        list_batches: {
            name: 'list_batches',
            description: 'List batches, optionally filtered by dataset',
            parameters: { type: 'object', properties: { datasetId: { type: 'string', description: 'Optional dataset ID filter' }, limit: { type: 'number', description: 'Max batches (default 50)' } } },
            execute: async (args) => client.getBatches(args.datasetId, args.limit || 50),
        },
        get_batch: {
            name: 'get_batch',
            description: 'Get details of a specific batch',
            parameters: { type: 'object', properties: { batchId: { type: 'string', description: 'Batch ID' } }, required: ['batchId'] },
            execute: async (args) => client.getBatch(args.batchId),
        },

        // ─── Segments ───
        list_segments: {
            name: 'list_segments',
            description: 'List segment definitions',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max segments (default 20)' } } },
            execute: async (args) => client.getSegmentDefinitions(args.limit || 20),
        },
        get_segment: {
            name: 'get_segment',
            description: 'Get details of a specific segment',
            parameters: { type: 'object', properties: { segmentId: { type: 'string', description: 'Segment ID' } }, required: ['segmentId'] },
            execute: async (args) => client.getSegmentDefinition(args.segmentId),
        },
        list_segment_jobs: {
            name: 'list_segment_jobs',
            description: 'List segment evaluation jobs',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max jobs (default 20)' } } },
            execute: async (args) => client.getSegmentJobs(args.limit || 20),
        },
        create_segment: {
            name: 'create_segment',
            description: 'Create a new segment definition with PQL expression',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Segment name' },
                    description: { type: 'string', description: 'Segment description' },
                    pql: { type: 'string', description: 'PQL expression' },
                },
                required: ['name', 'description', 'pql'],
            },
            requiresApproval: true,
            execute: async (args) => client.createSegment(args.name, args.description, args.pql),
        },

        // ─── Schemas ───
        list_schemas: {
            name: 'list_schemas',
            description: 'List XDM schemas from the schema registry',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max schemas (default 20)' } } },
            execute: async (args) => client.getSchemas('tenant', args.limit || 20),
        },
        get_schema: {
            name: 'get_schema',
            description: 'Get full details of a specific schema',
            parameters: { type: 'object', properties: { schemaId: { type: 'string', description: 'Schema $id' } }, required: ['schemaId'] },
            execute: async (args) => client.getSchema(args.schemaId),
        },
        search_schemas: {
            name: 'search_schemas',
            description: 'Search schemas by title',
            parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] },
            execute: async (args) => client.searchSchemas(args.query),
        },
        list_field_groups: {
            name: 'list_field_groups',
            description: 'List XDM field groups',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getFieldGroups(),
        },

        // ─── Identity ───
        list_identity_namespaces: {
            name: 'list_identity_namespaces',
            description: 'List all identity namespaces',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getIdentityNamespaces(),
        },
        get_identity_graph: {
            name: 'get_identity_graph',
            description: 'Get identity graph for a given identity',
            parameters: {
                type: 'object',
                properties: {
                    namespace: { type: 'string', description: 'Namespace code (e.g., email, ecid)' },
                    identity: { type: 'string', description: 'Identity value' },
                },
                required: ['namespace', 'identity'],
            },
            execute: async (args) => client.getIdentityGraph(args.namespace, args.identity),
        },

        // ─── Profiles ───
        lookup_profile: {
            name: 'lookup_profile',
            description: 'Look up a profile by identity namespace and value',
            parameters: {
                type: 'object',
                properties: {
                    namespace: { type: 'string', description: 'Identity namespace (e.g., email)' },
                    identity: { type: 'string', description: 'Identity value' },
                },
                required: ['namespace', 'identity'],
            },
            execute: async (args) => client.getProfile(args.namespace, args.identity),
        },
        list_merge_policies: {
            name: 'list_merge_policies',
            description: 'List profile merge policies',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getMergePolicies(),
        },

        // ─── Flows ───
        list_flows: {
            name: 'list_flows',
            description: 'List data flows',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max flows (default 20)' } } },
            execute: async (args) => client.getAllFlows(args.limit || 20),
        },
        get_flow: {
            name: 'get_flow',
            description: 'Get details of a specific flow',
            parameters: { type: 'object', properties: { flowId: { type: 'string', description: 'Flow ID' } }, required: ['flowId'] },
            execute: async (args) => client.getFlow(args.flowId),
        },
        get_flow_runs: {
            name: 'get_flow_runs',
            description: 'Get runs for a specific flow',
            parameters: { type: 'object', properties: { flowId: { type: 'string', description: 'Flow ID' } }, required: ['flowId'] },
            execute: async (args) => client.getFlowRuns(args.flowId),
        },

        // ─── Sources & Destinations ───
        list_source_connections: {
            name: 'list_source_connections',
            description: 'List source connections',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getSourceConnections(),
        },
        list_destination_connections: {
            name: 'list_destination_connections',
            description: 'List destination connections',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getDestinationConnections(),
        },

        // ─── Query Service ───
        execute_query: {
            name: 'execute_query',
            description: 'Execute a SQL query against AEP Query Service',
            parameters: {
                type: 'object',
                properties: { sql: { type: 'string', description: 'SQL query to execute' } },
                required: ['sql'],
            },
            requiresApproval: true,
            execute: async (args) => client.executeQuery(args.sql),
        },
        list_queries: {
            name: 'list_queries',
            description: 'List recent queries',
            parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max queries (default 10)' } } },
            execute: async (args) => client.getQueries(args.limit || 10),
        },

        // ─── Platform Health ───
        health_check: {
            name: 'health_check',
            description: 'Check AEP platform connectivity status',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.healthCheck(),
        },
        system_health_summary: {
            name: 'system_health_summary',
            description: 'Get a comprehensive health summary of the AEP instance',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getSystemHealthSummary(),
        },

        // ─── Export Jobs ───
        list_export_jobs: {
            name: 'list_export_jobs',
            description: 'List profile export jobs',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getProfileExportJobs(),
        },

        // ─── Sandboxes ───
        list_sandboxes: {
            name: 'list_sandboxes',
            description: 'List available AEP sandboxes',
            parameters: { type: 'object', properties: {} },
            execute: async () => client.getSandboxes(),
        },
    }
}

export function getToolDeclarations(tools: Record<string, ToolDef>): LLMToolDeclaration[] {
    return Object.values(tools).map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
    }))
}

export function requiresApproval(tools: Record<string, ToolDef>, toolName: string): boolean {
    return tools[toolName]?.requiresApproval ?? false
}
