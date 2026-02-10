import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Search, Filter, Clock, User, Shield, AlertCircle } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

interface AuditEntry {
    id: string
    timestamp: string
    user: string
    action: string
    resource: string
    type: string
    status: 'success' | 'failure'
}

export function AuditLog() {
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => { loadAuditLog() }, [])

    const loadAuditLog = async () => {
        try {
            const config = await getActiveConfig()
            if (!config) return

            // In a real app, we'd fetch from AEP Audit API
            // For now, we simulate with realistic data since it's a "Command Center" feature
            setTimeout(() => {
                setEntries([
                    { id: '1', timestamp: new Date().toISOString(), user: 'admin@org.com', action: 'CREATE', resource: 'Segment: Females 30+', type: 'Segmentation', status: 'success' },
                    { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'system', action: 'INGEST', resource: 'Batch 01JGH...', type: 'Ingestion', status: 'failure' },
                    { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'marketer@org.com', action: 'UPDATE', resource: 'Dataset: Web SDK Events', type: 'Catalog', status: 'success' },
                    { id: '4', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'admin@org.com', action: 'DELETE', resource: 'Schema: Temporary Field Group', type: 'Schema Registry', status: 'success' },
                    { id: '5', timestamp: new Date(Date.now() - 90000000).toISOString(), user: 'system', action: 'ACTIVATE', resource: 'Destination: Facebook Custom Audience', type: 'Destinations', status: 'success' },
                ])
                setLoading(false)
            }, 800)
        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    const filtered = entries.filter(e =>
        e.resource.toLowerCase().includes(search.toLowerCase()) ||
        e.user.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">Audit Log</h2>
                    <p className="text-xs text-muted-foreground">Governance and activity tracking</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter activity..."
                            className="pl-9 h-9 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Badge variant="outline" className="flex gap-1 h-9">
                        <Filter className="h-3.5 w-3.5" />
                        Filter
                    </Badge>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map((e) => (
                                    <TableRow key={e.id} className="text-xs">
                                        <TableCell className="text-muted-foreground font-mono">
                                            {new Date(e.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {e.user}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                {e.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{e.resource}</span>
                                                <span className="text-[10px] text-muted-foreground">{e.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {e.status === 'success' ? (
                                                <Badge variant="success" className="gap-1">
                                                    <Shield className="h-2.5 w-2.5" /> Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="error" className="gap-1">
                                                    <AlertCircle className="h-2.5 w-2.5" /> Failure
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No audit entries found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
