import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GitBranch, RefreshCw, Search } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { formatDate, truncate, getStatusBgColor } from '@/lib/utils'

export function Batches() {
    const [batches, setBatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [datasetFilter, setDatasetFilter] = useState('')

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getBatches(datasetFilter || undefined, 50)
            const batchList = result ? Object.entries(result).map(([id, data]: [string, any]) => ({ id, ...data })) : []
            setBatches(batchList)
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Batch Monitor</h2>
                    <p className="text-xs text-muted-foreground">Batch ingestion status and details</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Filter by dataset ID..." value={datasetFilter} onChange={e => setDatasetFilter(e.target.value)} className="pl-8 h-8 text-xs" onKeyDown={e => e.key === 'Enter' && loadData()} />
                </div>
                <Button size="sm" variant="secondary" onClick={loadData}>Filter</Button>
            </div>

            <Card>
                <CardContent className="pt-4">
                    {loading ? (
                        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : batches.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No batches found</p>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Batch ID</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {batches.slice(0, 50).map((b: any) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="text-xs font-mono">{truncate(b.id, 25)}</TableCell>
                                        <TableCell><Badge className={getStatusBgColor(b.status || 'unknown')} variant="outline">{b.status || 'unknown'}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{b.created ? formatDate(b.created) : '—'}</TableCell>
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
