import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { formatDate, getStatusBgColor, truncate } from '@/lib/utils'

export function Ingestion() {
    const [flows, setFlows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getIngestionFlows()
            setFlows(result?.items || [])
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Data Ingestion</h2>
                    <p className="text-xs text-muted-foreground">Source flows and ingestion monitoring</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Ingestion Flows</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : flows.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No ingestion flows found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Name</TableHead><TableHead>State</TableHead><TableHead>Updated</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {flows.map((flow: any) => (
                                    <TableRow key={flow.id}>
                                        <TableCell className="text-xs font-medium">{truncate(flow.name || flow.id, 40)}</TableCell>
                                        <TableCell><Badge className={getStatusBgColor(flow.state || 'unknown')} variant="outline">{flow.state || 'unknown'}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{flow.updatedAt ? formatDate(flow.updatedAt) : '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
