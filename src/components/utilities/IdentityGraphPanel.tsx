import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Network, Search, AlertTriangle, Plus, Link, User } from 'lucide-react'
import { AEPClient } from '@/lib/aep-client'
import { getActiveConfig } from '@/lib/config-storage'

// Simple node renderer for the graph
const GraphNode = ({ x, y, label, type, isRisk }: any) => (
    <g transform={`translate(${x},${y})`}>
        <circle
            r="18"
            className={`${isRisk ? 'fill-red-500/20 stroke-red-500' : type === 'ECID' ? 'fill-blue-500/20 stroke-blue-500' : 'fill-green-500/20 stroke-green-500'} stroke-2`}
        />
        <text y="4" textAnchor="middle" className="text-[8px] fill-current font-mono pointer-events-none">
            {type}
        </text>
        <text y="28" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono pointer-events-none">
            {label.substring(0, 8)}...
        </text>
    </g>
)

const GraphLink = ({ x1, y1, x2, y2 }: any) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-muted-foreground/30 stroke-2" />
)

export function IdentityGraphPanel() {
    const [identity, setIdentity] = useState('')
    const [namespace, setNamespace] = useState('ECID')
    const [graphData, setGraphData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [riskAlert, setRiskAlert] = useState<string | null>(null)

    const analyzeGraph = async () => {
        if (!identity) return
        setLoading(true)
        setRiskAlert(null)
        setGraphData(null)

        try {
            const config = await getActiveConfig()
            if (!config) return
            const client = new AEPClient(config)

            // Fetch Real Identity Graph
            const res = await client.getIdentityGraph(namespace, identity)

            if (!res.xids || res.xids.length === 0) {
                setGraphData({ nodes: [], links: [] })
                setRiskAlert("No identities found for this query.")
                return
            }

            const nodes: any[] = []
            const links: any[] = []
            const centerId = 'root_center'

            // Central Query Node (You)
            nodes.push({ id: centerId, type: namespace, label: identity, x: 200, y: 150 })

            // Map returned identities form API response
            res.xids.forEach((xid: any, i: number) => {
                const idVal = xid.identity.id
                const nsCode = xid.identity.namespace.code

                // Skip if it is the query node itself to avoid self-loop visual clutter
                if (idVal === identity && nsCode === namespace) return

                const angle = (i / res.xids.length) * 2 * Math.PI
                const radius = 100
                const nodeId = `node-${i}`

                nodes.push({
                    id: nodeId,
                    type: nsCode,
                    label: idVal,
                    x: 200 + Math.cos(angle) * radius,
                    y: 150 + Math.sin(angle) * radius,
                    isRisk: false
                })

                links.push({ source: centerId, target: nodeId })
            })

            setGraphData({ nodes, links })

            if (nodes.length > 50) {
                setRiskAlert(`Graph Complexity Warning: ${nodes.length} linked identities detected.`)
            }

        } catch (e: any) {
            console.error("Identity Graph Error", e)
            setRiskAlert(`API Error: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Identity Risk Analyzer
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

                    <div className="flex gap-2">
                        <Input
                            value={identity}
                            onChange={(e) => setIdentity(e.target.value)}
                            placeholder="Enter Identity (e.g., ECID)"
                            className="h-8 text-xs font-mono"
                        />
                        <Button size="sm" onClick={analyzeGraph} disabled={loading} className="h-8">
                            {loading ? 'Analyzing...' : <Search className="h-3 w-3" />}
                        </Button>
                    </div>

                    <div className="flex-1 relative border rounded-md bg-muted/5 overflow-hidden flex items-center justify-center">
                        {graphData ? (
                            <>
                                <svg width="400" height="300" className="w-full h-full">
                                    {graphData.links.map((link: any, i: number) => {
                                        const source = graphData.nodes.find((n: any) => n.id === link.source)
                                        const target = graphData.nodes.find((n: any) => n.id === link.target)
                                        return <GraphLink key={i} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
                                    })}
                                    {graphData.nodes.map((node: any) => (
                                        <GraphNode key={node.id} {...node} />
                                    ))}
                                </svg>
                                <div className="absolute bottom-2 right-2 bg-background/80 p-1 rounded border text-[10px] space-y-1">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ECID</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> CRM ID</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Risk</div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground text-xs opacity-50">
                                <Network className="h-10 w-10 mx-auto mb-2" />
                                Visualize Identity Cluster
                            </div>
                        )}
                    </div>

                    {riskAlert && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded p-2 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold text-red-500">Graph Risk Alert</p>
                                <p className="text-muted-foreground">{riskAlert}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
