import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Database, FileCode, Users, Search, FolderOpen, ArrowRight, Wrench } from 'lucide-react'
import { AEPClient } from '@/lib/aep-client'
import { getActiveConfig } from '@/lib/config-storage'
import { SmartActionPanel } from './SmartActionPanel'
import { UtilitiesPanel } from '@/components/utilities/UtilitiesPanel'
import { ScrollArea } from '@/components/ui/scroll-area'

export function EntityExplorer() {
    const [activeTab, setActiveTab] = useState('datasets')
    const [items, setItems] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(300)
    const [isResizing, setIsResizing] = useState(false)

    useEffect(() => {
        if (activeTab === 'utilities') return
        loadItems()
    }, [activeTab])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            setSidebarWidth(Math.max(200, Math.min(600, e.clientX)))
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    const loadItems = async () => {
        setLoading(true)
        setSelectedItem(null)
        try {
            const config = await getActiveConfig()
            if (!config) return
            const client = new AEPClient(config)

            let res: any = {}
            if (activeTab === 'datasets') res = await client.getDatasets()
            else if (activeTab === 'schemas') res = await client.getSchemas()
            else if (activeTab === 'batches') res = await client.getBatches()
            else if (activeTab === 'segments') res = await client.getSegmentDefinitions()

            const list = Object.values(res).flat().filter((i: any) => typeof i === 'object') || []
            // Normalize list
            const normalized = list.map((item: any) => ({
                id: item.id || item.$id || item.batchId,
                name: item.name || item.title || item.batchId,
                type: activeTab.slice(0, -1) // remove 's'
            }))

            setItems(normalized)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="flex h-full overflow-hidden select-none">
            {/* Master List (Resizable) */}
            <div
                className="flex flex-col space-y-4 shrink-0 transition-none"
                style={{ width: sidebarWidth }}
            >
                <div>
                    <h2 className="text-lg font-bold">Explorer</h2>
                    <p className="text-xs text-muted-foreground">Deep dive into AEP entities</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-5 h-8 shrink-0">
                        <TabsTrigger value="datasets" className="text-[10px]"><Database className="h-3 w-3" /></TabsTrigger>
                        <TabsTrigger value="schemas" className="text-[10px]"><FileCode className="h-3 w-3" /></TabsTrigger>
                        <TabsTrigger value="batches" className="text-[10px]"><FolderOpen className="h-3 w-3" /></TabsTrigger>
                        <TabsTrigger value="segments" className="text-[10px]"><Users className="h-3 w-3" /></TabsTrigger>
                        <TabsTrigger value="utilities" className="text-[10px]"><Wrench className="h-3 w-3" /></TabsTrigger>
                    </TabsList>

                    {activeTab === 'utilities' ? (
                        <div className="flex-1 border rounded-md p-2 mt-4 overflow-hidden">
                            <UtilitiesPanel />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col space-y-4 mt-4 overflow-hidden">
                            <Input
                                placeholder="Search..."
                                className="h-8 text-xs shrink-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <ScrollArea className="flex-1 border rounded-md">
                                <div className="p-2 space-y-1">
                                    {loading ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                                    ) : filteredItems.length > 0 ? (
                                        filteredItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between p-2 rounded-sm cursor-pointer hover:bg-muted/50 text-xs ${selectedItem?.id === item.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <span className="truncate flex-1">{item.name}</span>
                                                {selectedItem?.id === item.id && <ArrowRight className="h-3 w-3" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-muted-foreground">No items found</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </Tabs>
            </div>

            {/* Drag Handle */}
            <div
                className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors flex items-center justify-center group shrink-0"
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="w-[1px] h-8 bg-border group-hover:bg-primary transition-colors" />
            </div>

            {/* Detail & Action Panel */}
            <div className="flex-1 flex flex-col overflow-hidden pl-4">
                {activeTab === 'utilities' ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/5 rounded-md border border-dashed">
                        <div className="text-center p-8">
                            <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <h3 className="font-bold">Utility Mode</h3>
                            <p className="text-xs">Select a tool from the left panel.</p>
                        </div>
                    </div>
                ) : selectedItem ? (
                    <div className="h-full flex flex-col space-y-4">
                        <Card className="shrink-0 bg-muted/10">
                            <CardContent className="p-3">
                                <h3 className="font-bold">{selectedItem.name}</h3>
                                <p className="text-xs font-mono text-muted-foreground">{selectedItem.id}</p>
                            </CardContent>
                        </Card>

                        <SmartActionPanel
                            entityType={selectedItem.type as any}
                            entityId={selectedItem.id}
                            context={{
                                DATASET_ID: selectedItem.id,
                                SCHEMA_ID: selectedItem.id,
                                BATCH_ID: selectedItem.id,
                                SEGMENT_ID: selectedItem.id
                            }}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>Select an item to view actions</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
