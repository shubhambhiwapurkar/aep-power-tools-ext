/**
 * Agent Service — orchestrates AI copilot interactions
 * Ported from aep-unified, updated for multi-provider support
 */

import { AEPClient } from '@/lib/aep-client'
import { callLLM, summarizeWithLLM, type LLMMessage } from './llm-service'
import { createTools, getToolDeclarations, requiresApproval, type ToolDef } from './tools'
import { safeStringifyForLLM, redactPII } from './privacy-filter'
import type { AIProviderConfig, AgentResponse, AEPConfig } from '@/lib/types'

const SYSTEM_PROMPT = `You are an expert Adobe Experience Platform (AEP) assistant built into the AEP Power Tools Chrome Extension.

You help users monitor, manage, and troubleshoot their AEP instance through natural language.

You have access to tools that interact with AEP APIs. Use them to answer questions about:
- Datasets, batches, and data ingestion
- Segments (definitions, jobs, schedules)
- Schemas and field groups
- Identity namespaces and graphs
- Profile lookups
- Data flows and flow runs
- Destinations and connections
- Query Service (SQL execution)
- Platform health and status

Guidelines:
- Always use tools to fetch real data rather than making assumptions
- Present data in a clear, organized way
- If an API call fails, explain the error and suggest alternatives
- Protect PII — never expose raw personal data
- For destructive operations (creating segments, running queries), explain what will happen first
- Be concise but informative`

export async function processAgentMessage({
    message,
    aepConfig,
    aiConfig,
    history = [],
    autoMode = false,
    approvedAction = null,
}: {
    message: string
    aepConfig: AEPConfig
    aiConfig: AIProviderConfig
    history?: LLMMessage[]
    autoMode?: boolean
    approvedAction?: { toolName: string; toolArguments: Record<string, unknown> } | null
}): Promise<AgentResponse> {
    try {
        const client = new AEPClient(aepConfig)
        const tools = createTools(client)
        const toolDeclarations = getToolDeclarations(tools)
        const toolsUsed: string[] = []

        // If there's an approved action, execute it directly
        if (approvedAction) {
            const toolDef = tools[approvedAction.toolName]
            if (toolDef) {
                const result = await toolDef.execute(approvedAction.toolArguments as any)
                const safeResult = safeStringifyForLLM(result)
                toolsUsed.push(approvedAction.toolName)

                // Send result back to LLM for summary
                const resultMessages: LLMMessage[] = [
                    ...history,
                    { role: 'user', content: message },
                    { role: 'assistant', content: `I executed ${approvedAction.toolName} and got the following result:` },
                    { role: 'user', content: `Tool result for ${approvedAction.toolName}: ${safeResult}\n\nPlease summarize this result for the user.` },
                ]
                const summary = await callLLM(aiConfig, resultMessages, undefined, SYSTEM_PROMPT)
                return { content: summary.text || safeResult, toolsUsed, data: result }
            }
        }

        // Normal message flow
        const messages: LLMMessage[] = [...history, { role: 'user', content: message }]

        // Call LLM with tools
        const response = await callLLM(aiConfig, messages, toolDeclarations, SYSTEM_PROMPT)

        // If LLM wants to call a tool
        if (response.toolCalls?.length) {
            const toolCall = response.toolCalls[0]
            const toolDef = tools[toolCall.name]

            if (!toolDef) {
                return { content: `Unknown tool: ${toolCall.name}`, toolsUsed }
            }

            // Check if tool needs approval
            if (requiresApproval(tools, toolCall.name) && !autoMode) {
                return {
                    content: `I'd like to execute **${toolCall.name}** with the following parameters:\n\n\`\`\`json\n${JSON.stringify(toolCall.args, null, 2)}\n\`\`\`\n\nDo you want me to proceed?`,
                    toolsUsed,
                    requiresApproval: true,
                    pendingAction: {
                        toolName: toolCall.name,
                        toolArguments: toolCall.args,
                        description: toolDef.description,
                    },
                }
            }

            // Execute the tool
            try {
                const result = await toolDef.execute(toolCall.args as any)
                const safeResult = safeStringifyForLLM(result)
                toolsUsed.push(toolCall.name)

                // Send result back to LLM for interpretation
                const followupMessages: LLMMessage[] = [
                    ...messages,
                    { role: 'assistant', content: `I'll use the ${toolCall.name} tool to help with that.` },
                    { role: 'user', content: `Tool "${toolCall.name}" returned:\n${safeResult}\n\nPlease interpret this result and provide a helpful summary.` },
                ]
                const interpretation = await callLLM(aiConfig, followupMessages, undefined, SYSTEM_PROMPT)
                return { content: interpretation.text || safeResult, toolsUsed, data: result }
            } catch (toolError: any) {
                toolsUsed.push(toolCall.name)
                return {
                    content: `Error executing **${toolCall.name}**: ${toolError.message}\n\nThis could be due to invalid parameters, permissions, or connectivity issues.`,
                    toolsUsed,
                }
            }
        }

        // Plain text response
        return { content: response.text || 'I didn\'t get a response. Please try again.', toolsUsed }
    } catch (error: any) {
        return { content: `Error: ${error.message}`, toolsUsed: [] }
    }
}
