import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { QueryOptimizer } from './QueryOptimizer'
import { ThroughputGauge } from './ThroughputGauge'
import { IdentityGraphPanel } from './IdentityGraphPanel'
import { SyncGapAuditor } from './SyncGapAuditor'
import { Activity, Database, Network, Clock } from 'lucide-react'

export function UtilitiesPanel() {
    const [activeTool, setActiveTool] = useState('sql')

    return (
        <div className="h-full flex flex-col">
            <div className="shrink-0 mb-4">
                <h2 className="text-lg font-bold">Advanced Utilities</h2>
                <p className="text-xs text-muted-foreground">Specialized tools for Developers & Marketers</p>
            </div>

            <Tabs value={activeTool} onValueChange={setActiveTool} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-4 h-8 shrink-0">
                    <TabsTrigger value="sql" className="text-[10px] gap-1"><Database className="h-3 w-3" /> SQL</TabsTrigger>
                    <TabsTrigger value="identity" className="text-[10px] gap-1"><Network className="h-3 w-3" /> Graph</TabsTrigger>
                    <TabsTrigger value="throughput" className="text-[10px] gap-1"><Activity className="h-3 w-3" /> RPS</TabsTrigger>
                    <TabsTrigger value="sync" className="text-[10px] gap-1"><Clock className="h-3 w-3" /> Sync</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden mt-4">
                    <TabsContent value="sql" className="h-full m-0 data-[state=active]:flex flex-col">
                        <QueryOptimizer />
                    </TabsContent>
                    <TabsContent value="identity" className="h-full m-0 data-[state=active]:flex flex-col">
                        <IdentityGraphPanel />
                    </TabsContent>
                    <TabsContent value="throughput" className="h-full m-0 data-[state=active]:flex flex-col">
                        <ThroughputGauge />
                    </TabsContent>
                    <TabsContent value="sync" className="h-full m-0 data-[state=active]:flex flex-col">
                        <SyncGapAuditor />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
