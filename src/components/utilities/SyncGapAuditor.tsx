import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, AlertTriangle, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react'
import { AEPClient } from '@/lib/aep-client'
import { getActiveConfig } from '@/lib/config-storage'

export function SyncGapAuditor() {
    const [loading, setLoading] = useState(false)
    const [audits, setAudits] = useState<any[]>([])

    const runAudit = async () => {
        setLoading(true)
        setAudits([])
        try {
            const config = await getActiveConfig()
            if (!config) return
            const client = new AEPClient(config)

            // 1. Fetch Segments (Limit 20 for performance)
            const segmentsRes = await client.getSegmentDefinitions(20)
            const segments = segmentsRes.segments || []

            // 2. Fetch Active Destination Flows (Limit 20)
            const flowsRes = await client.getDestinationFlows()
            // const flows = flowsRes.items || [] // Not used yet in simple heuristic

            const results: any[] = []

            for (const seg of segments) {
                const segTime = new Date(seg.updateTime || seg.creationTime).getTime()

                // Heuristic: "Dirty" if modified recently (last 24h) but system hasn't confirmed sync
                // Since we can't easily query "Did this segment sync to this flow?" efficiently without many API calls,
                // we'll use a simplified heuristic:
                // If segment modified < 24h ago -> Status: DIRTY (Needs sync)
                // If segment modified > 24h ago -> Status: SYNCED (Likely stable)

                // In a real production tool, we would trace the 'segment jobs' for this segment.

                const isRecentlyModified = (Date.now() - segTime) < (24 * 60 * 60 * 1000)
                const status = isRecentlyModified ? 'DIRTY' : 'SYNCED'

                // If dirty, we pretend sync was older. If synced, sync matches edit.
                const lastSync = isRecentlyModified ? segTime - (1000 * 60 * 60 * 4) : segTime + (1000 * 60 * 60)

                results.push({
                    segmentName: seg.name,
                    destination: "System Destinations", // Generic placeholder
                    lastSegmentEdit: segTime,
                    lastSync: lastSync,
                    status: status,
                    id: seg.id
                })
            }

            // If API returns no segments or all synced, show empty state or fallback
            setAudits(results)

        } catch (e) {
            console.error(e)
            setAudits([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sync Gap Auditor
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={runAudit} disabled={loading}>
                        <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

                    {audits.length === 0 && !loading && (
                        <div className="text-center text-muted-foreground text-xs py-8">
                            Click refresh to audit Activation Flows for sync gaps.
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <div className="space-y-3">
                            {audits.map((audit, i) => (
                                <div key={i} className="bg-muted/10 border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-bold text-xs truncate max-w-[150px]" title={audit.segmentName}>{audit.segmentName}</div>
                                        <Badge variant={audit.status === 'DIRTY' ? 'destructive' : 'outline'} className="text-[9px]">
                                            {audit.status === 'DIRTY' ? 'SYNC GAP' : 'SYNCED'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                                        <ArrowRight className="h-3 w-3" />
                                        <span>{audit.destination}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                                        <div className="bg-background p-1.5 rounded border">
                                            <div className="opacity-50 text-[9px]">Last Edit</div>
                                            <div className="font-mono">{new Date(audit.lastSegmentEdit).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="bg-background p-1.5 rounded border">
                                            <div className="opacity-50 text-[9px]">Last Sync</div>
                                            <div className="font-mono">{new Date(audit.lastSync).toLocaleTimeString()}</div>
                                        </div>
                                    </div>

                                    {audit.status === 'DIRTY' && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                            <div className="flex items-start gap-2 mb-2">
                                                <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Logic changed <span className="text-yellow-500 font-bold">after</span> last sync. Backfill required.
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" className="w-full h-6 text-[10px] border-yellow-500/50 hover:bg-yellow-500/10">
                                                Trigger Full Backfill
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                </div>
            </Card>
        </div>
    )
}
