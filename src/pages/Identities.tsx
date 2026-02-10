import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layers, RefreshCw, Search, Network } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

export function Identities() {
    const [namespaces, setNamespaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Graph lookup
    const [graphNs, setGraphNs] = useState('email')
    const [graphId, setGraphId] = useState('')
    const [graphResult, setGraphResult] = useState<any>(null)
    const [graphLoading, setGraphLoading] = useState(false)

    useEffect(() => { loadNamespaces() }, [])

    const loadNamespaces = async () => {
        setLoading(true); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getIdentityNamespaces()
            setNamespaces(Array.isArray(result) ? result : [])
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    const lookupGraph = async () => {
        if (!graphId) return
        setGraphLoading(true); setGraphResult(null); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setGraphLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getIdentityGraph(graphNs, graphId)
            setGraphResult(result)
        } catch (e: any) { setError(e.message) }
        finally { setGraphLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Identity Service</h2>
                    <p className="text-xs text-muted-foreground">Namespaces and identity graph</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadNamespaces} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <Tabs defaultValue="namespaces">
                <TabsList>
                    <TabsTrigger value="namespaces"><Layers className="h-3 w-3 mr-1" /> Namespaces</TabsTrigger>
                    <TabsTrigger value="graph"><Network className="h-3 w-3 mr-1" /> Graph Lookup</TabsTrigger>
                </TabsList>

                <TabsContent value="namespaces">
                    <Card>
                        <CardContent className="pt-4">
                            {loading ? (
                                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                            ) : namespaces.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">No namespaces found</p>
                            ) : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {namespaces.map((ns: any) => (
                                            <TableRow key={ns.code}>
                                                <TableCell className="text-xs font-medium">{ns.name}</TableCell>
                                                <TableCell className="text-xs font-mono">{ns.code}</TableCell>
                                                <TableCell><Badge variant="secondary" className="text-[10px]">{ns.idType}</Badge></TableCell>
                                                <TableCell><Badge variant={ns.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">{ns.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="graph">
                    <Card>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Namespace</Label>
                                    <Input placeholder="email" value={graphNs} onChange={e => setGraphNs(e.target.value)} className="h-8 text-xs w-32" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Identity</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="Enter identity value..." value={graphId} onChange={e => setGraphId(e.target.value)} className="h-8 text-xs" onKeyDown={e => e.key === 'Enter' && lookupGraph()} />
                                        <Button size="sm" onClick={lookupGraph} disabled={graphLoading || !graphId}>
                                            {graphLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {graphLoading && <Skeleton className="h-32 w-full" />}
                            {graphResult && (
                                <pre className="text-[11px] bg-muted/30 p-3 rounded-md overflow-auto max-h-[250px] font-mono">
                                    {JSON.stringify(graphResult, null, 2)}
                                </pre>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
