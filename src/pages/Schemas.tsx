import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileCode, RefreshCw, Search } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { truncate } from '@/lib/utils'

export function Schemas() {
    const [schemas, setSchemas] = useState<any[]>([])
    const [filteredSchemas, setFilteredSchemas] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { loadData() }, [])
    useEffect(() => {
        if (!search) { setFilteredSchemas(schemas); return }
        setFilteredSchemas(schemas.filter(s =>
            (s.title || s.$id || '').toLowerCase().includes(search.toLowerCase())
        ))
    }, [search, schemas])

    const loadData = async () => {
        setLoading(true); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getSchemas('tenant', 100)
            setSchemas(result?.results || [])
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><FileCode className="h-5 w-5 text-primary" /> Schema Registry</h2>
                    <p className="text-xs text-muted-foreground">Browse and search XDM schemas</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search schemas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>

            <Card>
                <CardContent className="pt-4">
                    {loading ? (
                        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : filteredSchemas.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">{search ? 'No schemas match your search' : 'No schemas found'}</p>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>ID</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredSchemas.map((s: any, i: number) => (
                                    <TableRow key={s.$id || i}>
                                        <TableCell className="text-xs font-medium">{truncate(s.title || 'Untitled', 35)}</TableCell>
                                        <TableCell><Badge variant="secondary" className="text-[10px]">{s.type || 'object'}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">{truncate(s.$id || '', 30)}</TableCell>
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
