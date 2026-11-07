import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, AlertTriangle, RefreshCcw } from 'lucide-react'
import { AEPClient } from '@/lib/aep-client'
import { getActiveConfig } from '@/lib/config-storage'

type Audit = {
    id: string
    segmentName: string
    evaluation: 'batch' | 'streaming' | 'edge'
    lastEdit: number
    lastEvaluation: number | null
    status: 'STALE' | 'CURRENT' | 'NEVER' | 'CONTINUOUS'
}

const ts = (v: unknown) => (typeof v === 'number' ? v : Date.parse(String(v)) || 0)

/**
 * Finds batch audiences whose definition changed after their last successful evaluation job.
 * Until the next evaluation, destinations keep receiving the old membership.
 * Uses real data only: segment definitions + /segment/jobs.
 */
export function SyncGapAuditor() {
    const [loading, setLoading] = useState(false)
    const [audits, setAudits] = useState<Audit[]>([])
    const [error, setError] = useState('')

    const runAudit = async () => {
        setLoading(true)
        setAudits([])
        setError('')
        try {
            const config = await getActiveConfig()
            if (!config) throw new Error('Configure an AEP connection first.')
            const client = new AEPClient(config)

            const [segmentsRes, jobsRes] = await Promise.all([
                client.getSegmentDefinitions(50),
                client.getSegmentJobs(100)
            ])
            const lastEval = new Map<string, number>()
            for (const job of jobsRes?.children || []) {
                if (String(job.status).toUpperCase() !== 'SUCCEEDED') continue
                for (const s of job.segments || []) {
                    lastEval.set(s.segmentId, Math.max(lastEval.get(s.segmentId) || 0, ts(job.updateTime)))
                }
            }

            const results: Audit[] = (segmentsRes?.segments || []).map((seg: any) => {
                const evaluation = seg.evaluationInfo?.continuous?.enabled ? 'streaming' : seg.evaluationInfo?.synchronous?.enabled ? 'edge' : 'batch'
                const lastEdit = ts(seg.updateTime || seg.creationTime)
                const evaluated = lastEval.get(seg.id) ?? null
                const status: Audit['status'] = evaluation !== 'batch' ? 'CONTINUOUS'
                    : evaluated === null ? 'NEVER'
                    : lastEdit > evaluated + 60_000 ? 'STALE' : 'CURRENT'
                return { id: seg.id, segmentName: seg.name, evaluation, lastEdit, lastEvaluation: evaluated, status }
            })
            const order = { STALE: 0, NEVER: 1, CURRENT: 2, CONTINUOUS: 3 }
            setAudits(results.sort((a, b) => order[a.status] - order[b.status]))
        } catch (e: any) {
            setError(e?.message || String(e))
        } finally {
            setLoading(false)
        }
    }

    const fmt = (t: number | null) => (t ? new Date(t).toLocaleString() : '—')

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Evaluation Gap Auditor
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={runAudit} disabled={loading}>
                        <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                    {error && <div className="text-xs text-red-500">{error}</div>}
                    {audits.length === 0 && !loading && !error && (
                        <div className="text-center text-muted-foreground text-xs py-8">
                            Click refresh to find batch audiences edited after their last successful evaluation.
                        </div>
                    )}
                    <ScrollArea className="flex-1">
                        <div className="space-y-3">
                            {audits.map((audit) => (
                                <div key={audit.id} className="bg-muted/10 border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-bold text-xs truncate max-w-[180px]" title={audit.segmentName}>{audit.segmentName}</div>
                                        <Badge variant={audit.status === 'STALE' ? 'destructive' : 'outline'} className="text-[9px]">
                                            {audit.status === 'STALE' ? 'EDITED SINCE EVAL' : audit.status === 'NEVER' ? 'NO RECENT EVAL' : audit.status === 'CONTINUOUS' ? audit.evaluation.toUpperCase() : 'CURRENT'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-background p-1.5 rounded border">
                                            <div className="opacity-50 text-[9px]">Last edit</div>
                                            <div className="font-mono">{fmt(audit.lastEdit)}</div>
                                        </div>
                                        <div className="bg-background p-1.5 rounded border">
                                            <div className="opacity-50 text-[9px]">Last successful evaluation</div>
                                            <div className="font-mono">{audit.status === 'CONTINUOUS' ? 'continuous' : fmt(audit.lastEvaluation)}</div>
                                        </div>
                                    </div>
                                    {audit.status === 'STALE' && (
                                        <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2 flex items-start gap-2">
                                            <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                                            <p className="text-[10px] text-muted-foreground">
                                                The rule changed after the last evaluation. Destinations keep the old membership until the next daily run, or run an on-demand evaluation in AEP.
                                            </p>
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
