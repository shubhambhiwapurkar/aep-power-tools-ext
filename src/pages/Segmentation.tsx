import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, RefreshCw, Calendar, PlayCircle } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { formatDate, truncate } from '@/lib/utils'

export function Segmentation() {
    const [definitions, setDefinitions] = useState<any[]>([])
    const [jobs, setJobs] = useState<any[]>([])
    const [schedules, setSchedules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true); setError(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const [defs, jbs, schds] = await Promise.allSettled([
                client.getSegmentDefinitions(50),
                client.getSegmentJobs(20),
                client.getSegmentSchedules(20),
            ])
            setDefinitions(defs.status === 'fulfilled' ? (defs.value?.segments || defs.value?.children || []) : [])
            setJobs(jbs.status === 'fulfilled' ? (jbs.value?.segments || jbs.value?.children || []) : [])
            setSchedules(schds.status === 'fulfilled' ? (schds.value?.children || []) : [])
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Segmentation</h2>
                    <p className="text-xs text-muted-foreground">Segment definitions, jobs, and schedules</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            <Tabs defaultValue="definitions">
                <TabsList>
                    <TabsTrigger value="definitions"><Users className="h-3 w-3 mr-1" /> Definitions ({definitions.length})</TabsTrigger>
                    <TabsTrigger value="jobs"><PlayCircle className="h-3 w-3 mr-1" /> Jobs ({jobs.length})</TabsTrigger>
                    <TabsTrigger value="schedules"><Calendar className="h-3 w-3 mr-1" /> Schedules ({schedules.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="definitions">
                    <Card>
                        <CardContent className="pt-4">
                            {loading ? <LoadingSkeleton /> : definitions.length === 0 ? <EmptyState msg="No segment definitions" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {definitions.map((s: any) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="text-xs font-medium">{truncate(s.name || s.id, 35)}</TableCell>
                                                <TableCell><Badge variant="secondary" className="text-[10px]">{s.expression?.type || 'PQL'}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{s.updateTime ? formatDate(s.updateTime) : '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="jobs">
                    <Card>
                        <CardContent className="pt-4">
                            {loading ? <LoadingSkeleton /> : jobs.length === 0 ? <EmptyState msg="No segment jobs" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {jobs.map((j: any) => (
                                            <TableRow key={j.id}>
                                                <TableCell className="text-xs font-mono">{truncate(j.id || '', 25)}</TableCell>
                                                <TableCell><Badge variant={j.status === 'SUCCEEDED' ? 'success' : j.status === 'FAILED' ? 'error' : 'secondary'} className="text-[10px]">{j.status}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{j.creationTime ? formatDate(j.creationTime) : '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedules">
                    <Card>
                        <CardContent className="pt-4">
                            {loading ? <LoadingSkeleton /> : schedules.length === 0 ? <EmptyState msg="No schedules" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Schedule ID</TableHead><TableHead>Type</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {schedules.map((s: any) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="text-xs font-mono">{truncate(s.id || '', 25)}</TableCell>
                                                <TableCell className="text-xs">{s.type || '—'}</TableCell>
                                                <TableCell><Badge variant={s.state === 'active' ? 'success' : 'secondary'} className="text-[10px]">{s.state}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function LoadingSkeleton() { return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div> }
function EmptyState({ msg }: { msg: string }) { return <p className="text-xs text-muted-foreground py-8 text-center">{msg}</p> }
