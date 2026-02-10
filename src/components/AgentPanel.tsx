import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, X, Loader2, Sparkles, CheckCircle, AlertCircle, Trash2, Wrench } from 'lucide-react'
import { processAgentMessage } from '@/lib/agent/agent-service'
import { getActiveConfig, getAISettings } from '@/lib/config-storage'
import type { ChatMessage, AEPConfig, AIProviderConfig } from '@/lib/types'
import type { LLMMessage } from '@/lib/agent/llm-service'

interface AgentPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function AgentPanel({ isOpen, onClose }: AgentPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [aepConfig, setAepConfig] = useState<AEPConfig | null>(null)
    const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadConfigs()
    }, [isOpen])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConfigs = async () => {
        const aep = await getActiveConfig()
        const ai = await getAISettings()
        setAepConfig(aep)
        setAiConfig(ai)
    }

    const sendMessage = async () => {
        if (!input.trim() || loading) return
        if (!aepConfig) { setError('No AEP configuration. Go to Config to add one.'); return }
        if (!aiConfig) { setError('No AI provider configured. Go to AI Settings.'); return }

        const userMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)
        setError(null)

        try {
            const history: LLMMessage[] = messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }))

            const response = await processAgentMessage({
                message: userMsg.content,
                aepConfig,
                aiConfig,
                history,
            })

            const assistantMsg: ChatMessage = {
                id: `msg_${Date.now()}_resp`,
                role: 'assistant',
                content: response.content,
                toolsUsed: response.toolsUsed,
                requiresApproval: response.requiresApproval,
                pendingAction: response.pendingAction ? {
                    tool: response.pendingAction.toolName,
                    args: response.pendingAction.toolArguments,
                    description: response.pendingAction.description,
                } : undefined,
                timestamp: Date.now(),
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const executeApprovedAction = async (msg: ChatMessage) => {
        if (!msg.pendingAction || !aepConfig || !aiConfig) return
        setLoading(true)

        try {
            const history: LLMMessage[] = messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }))

            const response = await processAgentMessage({
                message: `Execute the approved action: ${msg.pendingAction.tool}`,
                aepConfig,
                aiConfig,
                history,
                approvedAction: { toolName: msg.pendingAction.tool, toolArguments: msg.pendingAction.args },
            })

            const resultMsg: ChatMessage = {
                id: `msg_${Date.now()}_action`,
                role: 'assistant',
                content: response.content,
                toolsUsed: response.toolsUsed,
                timestamp: Date.now(),
            }
            setMessages(prev => [...prev, resultMsg])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const clearHistory = () => {
        setMessages([])
        setError(null)
    }

    if (!isOpen) return null

    return (
        <div className="absolute right-0 top-0 h-[600px] w-[350px] border-l border-border bg-background shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold">AI Copilot</span>
                        {aiConfig && (
                            <Badge variant="secondary" className="text-[9px] ml-1.5 py-0">
                                {aiConfig.provider}/{aiConfig.model?.split('/').pop()?.split(':')[0]}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearHistory} title="Clear history">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {messages.length === 0 && !error && (
                        <div className="text-center py-8 space-y-2">
                            <Sparkles className="h-8 w-8 mx-auto text-primary/50" />
                            <p className="text-xs text-muted-foreground">Ask me anything about your AEP instance</p>
                            <div className="flex flex-wrap gap-1 justify-center">
                                {['List my datasets', 'Show segment jobs', 'Check platform health', 'List schemas'].map(q => (
                                    <button key={q} onClick={() => { setInput(q); }} className="text-[10px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors cursor-pointer">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardContent className="p-2">
                                <p className="text-[11px] text-red-400 flex items-start gap-1.5">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    {error}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }`}>
                                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                                {/* Tool badges */}
                                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {msg.toolsUsed.map((tool, i) => (
                                            <Badge key={i} variant="outline" className="text-[9px] py-0 gap-0.5">
                                                <Wrench className="h-2.5 w-2.5" /> {tool}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Approval buttons */}
                                {msg.requiresApproval && msg.pendingAction && (
                                    <div className="flex gap-1 mt-2">
                                        <Button size="sm" className="h-6 text-[10px]" onClick={() => executeApprovedAction(msg)}>
                                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                            Deny
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-2 border-t border-border shrink-0">
                {!aiConfig ? (
                    <p className="text-[10px] text-muted-foreground text-center py-1">Configure an AI provider in <strong>AI Settings</strong></p>
                ) : (
                    <div className="flex gap-1.5">
                        <Input
                            placeholder="Ask about your AEP instance..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            className="h-8 text-xs"
                            disabled={loading}
                        />
                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendMessage} disabled={loading || !input.trim()}>
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
