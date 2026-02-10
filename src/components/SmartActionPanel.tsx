import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PostmanAction, postmanEngine } from '@/lib/postman-engine'
import { ArrowRight, Play, Loader2, CheckCircle, AlertCircle, Terminal } from 'lucide-react'

interface SmartActionPanelProps {
    entityType: 'dataset' | 'schema' | 'batch' | 'segment'
    entityId: string
    context: Record<string, string>
}

export function SmartActionPanel({ entityType, entityId, context }: SmartActionPanelProps) {
    const [actions, setActions] = useState<PostmanAction[]>([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [activeAction, setActiveAction] = useState<PostmanAction | null>(null)

    useEffect(() => {
        const matched = postmanEngine.getActionsForContext(entityType, entityId)
        setActions(matched)
    }, [entityType, entityId])

    const handleExecute = async (action: PostmanAction) => {
        setLoading(true)
        setActiveAction(action)
        setResult(null)
        try {
            const res = await postmanEngine.executeAction(action, context)
            setResult(res)
        } catch (e) {
            setResult({ error: e })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5" />
                        Smart Actions ({actions.length})
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/3 border-r overflow-y-auto p-2 space-y-2">
                        {actions.map(action => (
                            <div
                                key={action.id}
                                className={`p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${activeAction?.id === action.id ? 'bg-muted border-primary/50' : 'bg-background'}`}
                                onClick={() => setActiveAction(action)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">{action.method}</Badge>
                                </div>
                                <p className="text-xs font-medium truncate" title={action.name}>{action.name}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        {activeAction ? (
                            <>
                                <div className="mb-4">
                                    <h3 className="font-bold text-sm mb-1">{activeAction.name}</h3>
                                    <p className="text-xs text-muted-foreground font-mono break-all">{activeAction.url}</p>
                                    <Button
                                        size="sm"
                                        className="mt-3 w-full gap-2"
                                        onClick={() => handleExecute(activeAction)}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                        Run Action
                                    </Button>
                                </div>

                                {result && (
                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        <div className="flex item-center mb-1 gap-2">
                                            <span className="text-xs font-semibold">Response Result</span>
                                            {result.error ? <Badge variant="destructive" className="h-4 px-1 text-[9px]">Error</Badge> : <Badge variant="success" className="h-4 px-1 text-[9px]">200 OK</Badge>}
                                        </div>
                                        <ScrollArea className="flex-1 rounded-md border bg-muted/10 p-2">
                                            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">
                                                {JSON.stringify(result, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Select an action to execute
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
