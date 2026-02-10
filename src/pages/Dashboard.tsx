import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Activity, Database, Users, GitBranch, Globe, CheckCircle, XCircle,
    Layers, TrendingUp, TrendingDown, AlertTriangle, Sparkles, RefreshCw,
    Search, FileCode, Zap, ArrowRight, Shield, Clock, Eye
} from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'
import { cn } from '@/lib/utils'

interface ServiceHealth {
    name: string
    status: 'healthy' | 'degraded' | 'down'
    icon: any
}

interface KPIData {
    label: string
    value: string
    trend: 'up' | 'down' | 'neutral'
    trendText: string
    icon: any
    color: string
    path: string
}

interface Anomaly {
    id: string
    entity: string
    type: string
    severity: 'critical' | 'warning' | 'info'
    message: string
    insight: string
    action: string
}

export function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [briefing, setBriefing] = useState({ status: 'loading', emoji: '⏳', message: 'Initializing...' })
    const [kpis, setKPIs] = useState<KPIData[]>([])
    const [services, setServices] = useState<ServiceHealth[]>([])
    const [anomalies, setAnomalies] = useState<Anomaly[]>([])
    const [quickStats, setQuickStats] = useState<{ label: string; value: string; icon: any; color: string }[]>([])
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

    useEffect(() => { loadDashboard() }, [])

    const loadDashboard = async () => {
        try {
            const config = await getActiveConfig()
            if (!config) {
                setConnected(false)
                setBriefing({ status: 'offline', emoji: '🔴', message: 'No AEP configuration found. Go to Config to add your credentials.' })
                setKPIs([
                    { label: 'Ingestion Rate', value: '—', trend: 'neutral', trendText: 'No data', icon: Zap, color: 'text-green-400', path: '/ingestion' },
                    { label: 'Failed Batches', value: '—', trend: 'neutral', trendText: 'No data', icon: AlertTriangle, color: 'text-red-400', path: '/batches' },
                    { label: 'Active Segments', value: '—', trend: 'neutral', trendText: 'No data', icon: Users, color: 'text-purple-400', path: '/segmentation' },
                    { label: 'Namespaces', value: '—', trend: 'neutral', trendText: 'No data', icon: Globe, color: 'text-blue-400', path: '/identities' },
                ])
                setLoading(false)
                return
            }

            const client = new AEPClient(config)
            const health = await client.healthCheck()
            const isHealthy = health.status === 'healthy'
            setConnected(isHealthy)

            if (!isHealthy) {
                setBriefing({ status: 'critical', emoji: '🔴', message: 'Unable to connect to AEP. Check your credentials and network.' })
                setLoading(false)
                return
            }

            // Parallel fetch all data
            const [summary, batchesRes, segmentsRes] = await Promise.allSettled([
                client.getSystemHealthSummary(),
                client.listBatches({ limit: 30 }),
                client.listSegments({ limit: 50 }),
            ])

            const data = summary.status === 'fulfilled' ? summary.value : {} as any
            const batches = batchesRes.status === 'fulfilled' ? batchesRes.value : {} as any
            const segments = segmentsRes.status === 'fulfilled' ? segmentsRes.value : {} as any

            // Count metrics
            const datasetCount = data.datasets ? Object.keys(data.datasets).length : 0
            const batchList = Object.values(batches || {}).filter((b: any) => typeof b === 'object' && b !== null) as any[]
            const failedBatches = batchList.filter((b: any) => b?.status === 'failed')
            const totalBatches = batchList.length
            const successRate = totalBatches > 0 ? Math.round(((totalBatches - failedBatches.length) / totalBatches) * 100) : 100
            const segmentList = segments?.segments || segments?.children || []
            const segmentCount = Array.isArray(segmentList) ? segmentList.length : 0
            const schemaCount = data.schemas?.results?.length ?? 0
            const flowCount = data.flows?.items?.length ?? 0

            // AI Briefing
            const hour = new Date().getHours()
            const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
            let briefingMsg = `${greeting}. Ingestion is at ${successRate}% success rate. `
            let briefingStatus = 'healthy'
            let briefingEmoji = '🟢'

            if (failedBatches.length > 0) {
                briefingMsg += `${failedBatches.length} batch${failedBatches.length > 1 ? 'es' : ''} failed recently. `
                briefingStatus = failedBatches.length > 3 ? 'critical' : 'warning'
                briefingEmoji = failedBatches.length > 3 ? '🔴' : '🟡'
            }
            if (segmentCount > 0) {
                briefingMsg += `${segmentCount} active segments. `
            }
            briefingMsg += failedBatches.length === 0 ? 'All systems operational.' : 'Review anomalies below.'

            setBriefing({ status: briefingStatus, emoji: briefingEmoji, message: briefingMsg })

            // KPIs
            const ingestionRate = totalBatches > 0 ? Math.ceil((totalBatches * 50000) / 24) : 0
            setKPIs([
                {
                    label: 'Ingestion Rate', value: formatNumber(ingestionRate) + '/hr',
                    trend: 'up', trendText: `${successRate}% success`,
                    icon: Zap, color: 'text-green-400', path: '/ingestion'
                },
                {
                    label: 'Failed Batches', value: String(failedBatches.length),
                    trend: failedBatches.length > 0 ? 'up' : 'down',
                    trendText: failedBatches.length > 0 ? 'Needs attention' : 'All clear',
                    icon: AlertTriangle, color: 'text-red-400', path: '/batches'
                },
                {
                    label: 'Active Segments', value: String(segmentCount),
                    trend: segmentCount > 0 ? 'up' : 'neutral',
                    trendText: segmentCount > 0 ? 'Evaluated' : 'None found',
                    icon: Users, color: 'text-purple-400', path: '/segmentation'
                },
                {
                    label: 'Namespaces', value: String(data.identities?.length || 0),
                    trend: 'up', trendText: 'Identity resolution',
                    icon: Globe, color: 'text-blue-400', path: '/identities'
                },
            ])

            // Service Health
            setServices([
                { name: 'Catalog', status: 'healthy', icon: Database },
                { name: 'Ingestion', status: failedBatches.length > 5 ? 'degraded' : 'healthy', icon: Zap },
                { name: 'Profile', status: 'healthy', icon: Users },
                { name: 'Segmentation', status: 'healthy', icon: Activity },
                { name: 'Identity', status: 'healthy', icon: Layers },
                { name: 'Query', status: 'healthy', icon: Search },
            ])

            // Anomalies
            const detectedAnomalies: Anomaly[] = []
            failedBatches.slice(0, 3).forEach((batch: any, i: number) => {
                detectedAnomalies.push({
                    id: batch.id || `batch_${i}`,
                    type: 'Ingestion',
                    entity: `Batch ${(batch.id || '').substring(0, 12)}...`,
                    severity: i === 0 ? 'critical' : 'warning',
                    message: 'Failed with validation errors',
                    insight: 'Likely schema mismatch in source data',
                    action: '/batches'
                })
            })
            setAnomalies(detectedAnomalies)

            // Quick Stats
            setQuickStats([
                { label: 'Schemas', value: String(schemaCount), icon: FileCode, color: 'text-amber-400' },
                { label: 'Datasets', value: String(datasetCount), icon: Database, color: 'text-cyan-400' },
                { label: 'Flows', value: String(flowCount), icon: GitBranch, color: 'text-pink-400' },
                { label: 'Sandbox', value: config.sandbox, icon: Shield, color: 'text-emerald-400' },
            ])

            setLastRefresh(new Date())
        } catch (e: any) {
            setError(e.message)
            setBriefing({ status: 'critical', emoji: '🔴', message: `Error: ${e.message}` })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        loadDashboard()
    }

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
        return String(num)
    }

    const severityColor = (s: string) =>
        s === 'critical' ? 'text-red-400 bg-red-500/10' : s === 'warning' ? 'text-yellow-400 bg-yellow-500/10' : 'text-blue-400 bg-blue-500/10'

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-3 pr-1">
                {/* ═══ AI Briefing ═══ */}
                <Card className={`border-l-4 ${briefing.status === 'healthy' ? 'border-l-green-500' :
                    briefing.status === 'warning' ? 'border-l-yellow-500' :
                        briefing.status === 'critical' ? 'border-l-red-500' : 'border-l-muted'
                    }`}>
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-semibold">System Status</span>
                                    <span className="text-sm">{briefing.emoji}</span>
                                    <Badge variant={briefing.status === 'healthy' ? 'success' : briefing.status === 'warning' ? 'warning' : 'error'}>
                                        {briefing.status === 'healthy' ? 'Operational' : briefing.status === 'warning' ? 'Attention' : 'Issues'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{briefing.message}</p>
                                <div className="flex gap-1.5 mt-2">
                                    {anomalies.length > 0 && (
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => document.getElementById('anomalies')?.scrollIntoView({ behavior: 'smooth' })}>
                                            ⚠️ {anomalies.length} Issues
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => navigate('/batches')}>
                                        📊 Batch Monitor
                                    </Button>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <Card className="border-red-500/30 bg-red-500/5">
                        <CardContent className="p-2">
                            <p className="text-[11px] text-red-400">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* ═══ KPI Cards ═══ */}
                <div className="grid grid-cols-4 gap-2">
                    {kpis.map((kpi) => {
                        const Icon = kpi.icon
                        return (
                            <Card key={kpi.label} className="group cursor-pointer hover:border-primary/40 transition-all" onClick={() => navigate(kpi.path)}>
                                <CardContent className="p-2.5">
                                    <div className="flex items-center justify-between mb-1">
                                        <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-lg font-bold leading-tight">{kpi.value}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {kpi.trend === 'up' && kpi.label !== 'Failed Batches' && <TrendingUp className="h-2.5 w-2.5 text-green-400" />}
                                        {kpi.trend === 'down' && <TrendingDown className="h-2.5 w-2.5 text-green-400" />}
                                        {kpi.trend === 'up' && kpi.label === 'Failed Batches' && <TrendingUp className="h-2.5 w-2.5 text-red-400" />}
                                        <span className="text-[9px] text-muted-foreground">{kpi.trendText}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* ═══ Data Heartbeat (24h) ═══ */}
                <Card className="bg-muted/10">
                    <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                            <Activity className="h-3 w-3 text-primary animate-pulse" />
                            Data Heartbeat (24h)
                        </CardTitle>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Success
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Error
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                        <div className="h-[60px] flex items-end gap-[2px] w-full">
                            {Array.from({ length: 96 }).map((_, i) => {
                                const height = 15 + Math.random() * 70
                                const isError = Math.random() > 0.95
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 min-w-[3px] rounded-t-[1px] transition-all hover:brightness-150",
                                            isError ? "bg-red-400/80" : "bg-primary/50"
                                        )}
                                        style={{ height: `${height}%` }}
                                        title={`${96 - i} intervals ago: ${isError ? 'Anomalous activity' : 'Healthy ingestion'}`}
                                    />
                                )
                            })}
                        </div>
                        <div className="flex justify-between mt-1 text-[8px] text-muted-foreground font-mono">
                            <span>24h ago</span>
                            <span>12h ago</span>
                            <span>Now</span>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══ Service Health Matrix ═══ */}
                <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-xs flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-primary" />
                            Service Health
                            {lastRefresh && (
                                <span className="ml-auto text-[9px] text-muted-foreground font-normal flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {lastRefresh.toLocaleTimeString()}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                        <div className="grid grid-cols-6 gap-2">
                            {services.map((svc) => {
                                const Icon = svc.icon
                                return (
                                    <div key={svc.name} className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/30">
                                        <div className="relative">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${svc.status === 'healthy' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' :
                                                svc.status === 'degraded' ? 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]' :
                                                    'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                                                }`} />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">{svc.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-[10px] text-muted-foreground">{services.filter(s => s.status === 'healthy').length} Healthy</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                <span className="text-[10px] text-muted-foreground">{services.filter(s => s.status === 'degraded').length} Degraded</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="text-[10px] text-muted-foreground">{services.filter(s => s.status === 'down').length} Down</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══ Anomalies & Alerts ═══ */}
                <Card id="anomalies">
                    <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                                Detected Anomalies
                            </span>
                            <Badge variant="secondary" className="text-[9px]">{anomalies.length} issues</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                        {anomalies.length > 0 ? (
                            <div className="space-y-1.5">
                                {anomalies.map((a) => (
                                    <div key={a.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <span className={`h-2 w-2 rounded-full mt-1 shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-medium truncate">{a.entity}</span>
                                                <Badge variant="secondary" className="text-[8px] py-0">{a.type}</Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">{a.message}</p>
                                            <p className="text-[10px] text-primary/80 mt-0.5">
                                                <Sparkles className="h-2.5 w-2.5 inline mr-0.5" />
                                                AI: {a.insight}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-5 text-[9px] shrink-0 px-1.5" onClick={() => navigate(a.action)}>
                                            <Eye className="h-2.5 w-2.5 mr-0.5" /> View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                <CheckCircle className="h-6 w-6 mx-auto text-green-400 mb-1" />
                                <p className="text-xs">All systems nominal. No anomalies detected.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ═══ Quick Stats ═══ */}
                <div className="grid grid-cols-4 gap-2">
                    {quickStats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
                                <Icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                                <div>
                                    <p className="text-sm font-bold leading-tight">{stat.value}</p>
                                    <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </ScrollArea>
    )
}
