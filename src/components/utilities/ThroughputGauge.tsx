import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, AlertTriangle, RefreshCw, Zap } from 'lucide-react'
import { AEPClient } from '@/lib/aep-client'
import { getActiveConfig } from '@/lib/config-storage'

export function ThroughputGauge() {
    const [metrics, setMetrics] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<number[]>([])

    const fetchMetrics = async () => {
        setLoading(true)
        try {
            const config = await getActiveConfig()
            if (!config) return
            const client = new AEPClient(config)
            const data = await client.getStreamingMetrics()

            setMetrics(data)
            setHistory(prev => [...prev.slice(-19), data.rps]) // Keep last 20 points
        } catch (e) {
            console.error("Failed to fetch throughput metrics", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
        const interval = setInterval(fetchMetrics, 3000) // Poll every 3s
        return () => clearInterval(interval)
    }, [])

    if (!metrics) return <div className="p-4 text-xs text-center text-muted-foreground">Loading Metrics...</div>

    const usagePercent = Math.min(100, Math.round((metrics.rps / metrics.limit) * 100))
    const isCritical = usagePercent >= 80

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden border-orange-500/20">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Streaming Throughput
                    </CardTitle>
                    <Badge variant={isCritical ? "destructive" : "outline"} className="text-[10px]">
                        {isCritical ? "CRITICAL LOAD" : "NORMAL"}
                    </Badge>
                </CardHeader>
                <div className="flex-1 flex flex-col p-4 gap-6 overflow-hidden">

                    {/* Gauge Visual */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative w-40 h-20 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full rounded-t-full bg-muted/30"></div>
                            <div
                                className={`absolute top-0 left-0 w-full h-full rounded-t-full origin-bottom transition-transform duration-500 ease-out ${isCritical ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ transform: `rotate(${usagePercent * 1.8 - 180}deg)` }}
                            ></div>
                        </div>
                        <div className="text-3xl font-bold mt-[-20px] z-10">{metrics.rps.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Events / Sec</div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/10 rounded-md border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase">Contract Limit</div>
                            <div className="text-lg font-mono font-bold">{metrics.limit.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-muted/10 rounded-md border text-center">
                            <div className="text-[10px] text-muted-foreground uppercase">Utilization</div>
                            <div className={`text-lg font-mono font-bold ${isCritical ? 'text-red-500' : 'text-green-500'}`}>
                                {usagePercent}%
                            </div>
                        </div>
                    </div>

                    {/* Live Chart (Mini) */}
                    <div className="flex items-end gap-1 h-12 w-full mt-auto opacity-50">
                        {history.map((val, i) => {
                            const h = Math.max(10, Math.round((val / metrics.limit) * 100))
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t-sm transition-all ${val > metrics.limit * 0.8 ? 'bg-red-500' : 'bg-primary'}`}
                                    style={{ height: `${h}%` }}
                                />
                            )
                        })}
                    </div>

                    {isCritical && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded p-2 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold text-red-500">Approaching Capacity Limit</p>
                                <p className="text-muted-foreground">High latency likely. Consider scaling down "Chatty" sources.</p>
                                <Button variant="destructive" size="sm" className="h-6 mt-2 text-[10px] w-full">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Scan High-Volume Sources
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </Card>
        </div>
    )
}
