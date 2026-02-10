import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Search, Database, Users, GitBranch, Globe, FileCode,
    Plus, History, Activity, Shield, Layers, SearchCode, Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

interface SearchResult {
    id: string
    name: string
    type: 'dataset' | 'schema' | 'segment' | 'flow' | 'batch' | 'identity' | 'action'
    path: string
}

export function CommandPalette({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)

    // Pre-defined quick actions
    const quickActions: SearchResult[] = [
        { id: 'act-dashboard', name: 'Go to Dashboard', type: 'action', path: '/' },
        { id: 'act-query', name: 'Open Query Service', type: 'action', path: '/query-service' },
        { id: 'act-profile', name: 'Lookup Profile', type: 'action', path: '/profiles' },
        { id: 'act-config', name: 'Manage Configuration', type: 'action', path: '/configuration' },
        { id: 'act-settings', name: 'AI Settings', type: 'action', path: '/settings' },
    ]

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsOpen(!isOpen)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [isOpen, setIsOpen])

    const handleSelect = useCallback((result: SearchResult) => {
        setIsOpen(false)
        navigate(result.path)
    }, [navigate, setIsOpen])

    useEffect(() => {
        if (!search || search.length < 2) {
            setResults([])
            return
        }

        const debounce = setTimeout(async () => {
            setLoading(true)
            try {
                const config = await getActiveConfig()
                if (!config) return

                const client = new AEPClient(config)
                // In a real app, we'd search across all services
                // For this demo, let's mock search based on common entities
                // or fetch a small subset if search is active
                const datasets = await client.listDatasets({ limit: 10 })
                const schemas = await client.listSchemas({ limit: 10 })

                const filteredResults: SearchResult[] = [
                    ...datasets.results.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        type: 'dataset' as const,
                        path: `/batches` // Usually link to details, but we go to list
                    })),
                    ...schemas.results.map((s: any) => ({
                        id: s.$id,
                        name: s.title,
                        type: 'schema' as const,
                        path: `/schemas`
                    }))
                ].filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

                setResults(filteredResults)
            } catch (e) {
                console.error('Search failed:', e)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(debounce)
    }, [search])

    return (
        <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
            <CommandInput
                placeholder="Search datasets, schemas, segments, or type a command..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px]">
                <CommandEmpty>{loading ? 'Searching...' : 'No results found.'}</CommandEmpty>

                {search.length < 2 && (
                    <CommandGroup heading="Quick Actions">
                        {quickActions.map((action) => (
                            <CommandItem
                                key={action.id}
                                onSelect={() => handleSelect(action)}
                                className="cursor-pointer"
                            >
                                <Zap className="mr-2 h-4 w-4 text-yellow-400" />
                                <span>{action.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.length > 0 && (
                    <CommandGroup heading="Search Results">
                        {results.map((result) => {
                            const Icon = result.type === 'dataset' ? Database :
                                result.type === 'schema' ? FileCode :
                                    result.type === 'segment' ? Users : GitBranch
                            return (
                                <CommandItem
                                    key={result.id}
                                    onSelect={() => handleSelect(result)}
                                    className="cursor-pointer"
                                >
                                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{result.name}</span>
                                    <Badge variant="outline" className="ml-auto text-[10px] py-0">
                                        {result.type}
                                    </Badge>
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                )}

                <CommandSeparator />
                <CommandGroup heading="Pages">
                    <CommandItem onSelect={() => handleSelect({ id: 'p1', name: 'Dashboard', type: 'action', path: '/' })}>
                        <Activity className="mr-2 h-4 w-4" /> Dashboard
                    </CommandItem>
                    <CommandItem onSelect={() => handleSelect({ id: 'p2', name: 'Ingestion', type: 'action', path: '/ingestion' })}>
                        <Layers className="mr-2 h-4 w-4" /> Ingestion
                    </CommandItem>
                    <CommandItem onSelect={() => handleSelect({ id: 'p3', name: 'Segmentation', type: 'action', path: '/segmentation' })}>
                        <Users className="mr-2 h-4 w-4" /> Segments
                    </CommandItem>
                    <CommandItem onSelect={() => handleSelect({ id: 'p4', name: 'Profiles', type: 'action', path: '/profiles' })}>
                        <SearchCode className="mr-2 h-4 w-4" /> Profiles
                    </CommandItem>
                    <CommandItem onSelect={() => handleSelect({ id: 'p5', name: 'Query Service', type: 'action', path: '/query-service' })}>
                        <Shield className="mr-2 h-4 w-4" /> Security & Governance
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
