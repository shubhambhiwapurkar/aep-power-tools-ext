import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, GitMerge, Layout, Shield, RefreshCw, Layers, ArrowLeftRight } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

interface Sandbox {
    id: string
    name: string
    title: string
    type: string
    region: string
    state: string
}

export function Sandboxes() {
    const [loading, setLoading] = useState(true)
    const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
    const [comparing, setComparing] = useState(false)

    useEffect(() => { loadSandboxes() }, [])

    const loadSandboxes = async () => {
        try {
            setLoading(true)
            const config = await getActiveConfig()
            if (!config) return

            const client = new AEPClient(config)
            const res = await client.getSandboxes()
            setSandboxes(res.sandboxes || [])
            setLoading(false)
        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">Sandbox Management</h2>
                    <p className="text-xs text-muted-foreground">Manage and compare AEP environments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={loadSandboxes}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </Button>
                    <Button variant="secondary" size="sm" className="h-9 gap-1.5" onClick={() => setComparing(!comparing)}>
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        {comparing ? 'Exit Compare' : 'Compare Sandboxes'}
                    </Button>
                </div>
            </div>

            {comparing && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                            <GitMerge className="h-3.5 w-3.5" />
                            Sandbox Comparison
                        </CardTitle>
                        <Badge variant="outline">Select up to 2</Badge>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-md bg-background border border-border">
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Base Sandbox</p>
                                <p className="text-sm font-bold">prod</p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span>Datasets</span>
                                        <span className="font-mono">142</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>Schemas</span>
                                        <span className="font-mono">81</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>Segments</span>
                                        <span className="font-mono">215</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-md bg-background border border-border dashed border-primary/40">
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Compare With</p>
                                <p className="text-sm text-muted-foreground italic">Select a sandbox below...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Sandbox Name</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sandboxes.length > 0 ? (
                                sandboxes.map((s) => (
                                    <TableRow key={s.id} className="text-xs">
                                        <TableCell className="font-bold flex items-center gap-2">
                                            <Shield className={cn("h-3.5 w-3.5", s.name === 'prod' ? 'text-amber-400' : 'text-blue-400')} />
                                            {s.name}
                                        </TableCell>
                                        <TableCell>{s.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase">{s.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground uppercase">{s.region}</TableCell>
                                        <TableCell>
                                            <Badge variant={s.state === 'active' ? 'success' : 'secondary'} className="capitalize">
                                                {s.state}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                                                {comparing ? 'Select' : 'Details'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No sandboxes found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-muted/20">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold">Production</span>
                        </div>
                        <p className="text-lg font-bold">1/1</p>
                        <p className="text-[10px] text-muted-foreground">Prod sandbox count</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Layout className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold">Development</span>
                        </div>
                        <p className="text-lg font-bold">{sandboxes.filter(s => s.type === 'development').length}/70</p>
                        <p className="text-[10px] text-muted-foreground">Dev sandbox usage</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold">Regions</span>
                        </div>
                        <p className="text-lg font-bold">{new Set(sandboxes.map(s => s.region)).size}</p>
                        <p className="text-[10px] text-muted-foreground">Active regions</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
