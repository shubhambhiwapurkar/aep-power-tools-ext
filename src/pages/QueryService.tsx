import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, Play, RefreshCw, Clock } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { formatDate, truncate } from '@/lib/utils'

export function QueryService() {
    const [sql, setSql] = useState('')
    const [result, setResult] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const executeQuery = async () => {
        if (!sql.trim()) return
        setLoading(true); setError(null); setResult(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const res = await client.executeQuery(sql)
            setResult(res)
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    const loadHistory = async () => {
        setHistoryLoading(true); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setHistoryLoading(false); return }
            const client = new AEPClient(config)
            const res = await client.getQueries(20)
            setHistory(res?.queries || [])
        } catch (e: any) { setError(e.message) }
        finally { setHistoryLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Query Service</h2>
                <p className="text-xs text-muted-foreground">Execute SQL queries against AEP datasets</p>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">SQL Editor</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Textarea
                        placeholder="SELECT * FROM dataset_name LIMIT 10"
                        value={sql} onChange={e => setSql(e.target.value)}
                        className="font-mono text-xs min-h-[80px] bg-muted/20"
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={executeQuery} disabled={loading || !sql.trim()}>
                            {loading ? <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                            Execute
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                            <Clock className="h-3.5 w-3.5 mr-1" /> History
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading && <Card><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>}

            {result && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Query Result</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-[11px] bg-muted/30 p-3 rounded-md overflow-auto max-h-[250px] font-mono">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {history.length > 0 && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Query History</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Query</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {history.map((q: any) => (
                                    <TableRow key={q.id} className="cursor-pointer" onClick={() => setSql(q.sql)}>
                                        <TableCell className="text-xs font-mono">{truncate(q.sql || '', 40)}</TableCell>
                                        <TableCell><Badge variant={q.state === 'SUCCESS' ? 'success' : q.state === 'FAILED' ? 'error' : 'secondary'} className="text-[10px]">{q.state}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{q.created ? formatDate(q.created) : '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
