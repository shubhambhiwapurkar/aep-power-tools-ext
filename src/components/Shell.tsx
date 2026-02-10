import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    Activity, LayoutDashboard, Download, Users, Globe,
    Database, Search, Layers, GitBranch, Settings, Bot,
    CheckCircle, XCircle, ChevronDown, Sparkles, FileCode,
    Bell, MessageSquare, Shield, SearchIcon, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AgentPanel } from '@/components/AgentPanel'
import { HealthBar } from '@/components/HealthBar'
import { CommandPalette } from '@/components/CommandPalette'
import { getConfigs, getActiveConfig, setActiveConfig } from '@/lib/config-storage'
import type { AEPConfig } from '@/lib/types'

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/explorer', label: 'Explorer', icon: Globe },
    { path: '/utilities', label: 'Utilities', icon: Wrench },
    { path: '/ingestion', label: 'Ingestion', icon: Download },
    { path: '/segmentation', label: 'Segments', icon: Users },
    { path: '/destinations', label: 'Destinations', icon: Globe },
    { path: '/schemas', label: 'Schemas', icon: FileCode },
    { path: '/profiles', label: 'Profiles', icon: Search },
    { path: '/identities', label: 'Identities', icon: Layers },
    { path: '/query-service', label: 'Queries', icon: Database },
    { path: '/batches', label: 'Batches', icon: GitBranch },
    { path: '/flows', label: 'Flows', icon: Activity },
    { path: '/sandboxes', label: 'Sandboxes', icon: Layers },
    { path: '/audit-log', label: 'Audit Log', icon: Shield },
    { path: '/privacy-governance', label: 'Privacy', icon: Bot },
    { path: '/configuration', label: 'Config', icon: Settings },
    { path: '/settings', label: 'AI Settings', icon: Sparkles },
]

export function Shell({ children }: { children: ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [configs, setConfigs] = useState<AEPConfig[]>([])
    const [activeConfig, setActiveConfigState] = useState<AEPConfig | null>(null)
    const [isLive, setIsLive] = useState(false)
    const [agentOpen, setAgentOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        try {
            const all = await getConfigs()
            const active = await getActiveConfig()
            setConfigs(all)
            setActiveConfigState(active)
            setIsLive(!!active?.authToken)
        } catch (e) {
            console.error('Failed to load configs:', e)
        }
    }

    const handleConfigChange = async (configId: string) => {
        try {
            await setActiveConfig(configId)
            await loadConfigs()
            window.location.reload()
        } catch (e) {
            console.error('Failed to switch config:', e)
        }
    }

    return (
        <div className="relative flex h-[600px] w-[780px] bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[180px] border-r border-border bg-sidebar flex flex-col shrink-0">
                {/* Brand */}
                <div className="p-3 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">AEP Power Tools</h1>
                            <p className="text-[10px] text-muted-foreground">Adobe Experience Platform</p>
                        </div>
                    </div>
                </div>

                {/* Quick Search trigger */}
                <div className="p-2 border-b border-sidebar-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] h-7 justify-start gap-2 bg-sidebar-accent/30 hover:bg-sidebar-accent/50 text-muted-foreground"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <Search className="h-3 w-3" />
                        <span>Search...</span>
                        <span className="ml-auto bg-muted px-1 rounded border border-border">⌘K</span>
                    </Button>
                </div>

                {/* Config selector */}
                <div className="p-2 border-b border-sidebar-border">
                    {configs.length > 0 ? (
                        <Select value={activeConfig?.id || ''} onValueChange={handleConfigChange}>
                            <SelectTrigger className="h-7 text-xs bg-sidebar border-sidebar-border">
                                <SelectValue placeholder="Select config..." />
                            </SelectTrigger>
                            <SelectContent>
                                {configs.map((c) => (
                                    <SelectItem key={c.id} value={c.id!}>
                                        <span className="text-xs">{c.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => navigate('/configuration')}
                        >
                            Add Configuration
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1">
                    <nav className="p-1.5 space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${isActive
                                        ? 'bg-sidebar-accent text-sidebar-primary'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                        }`}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </ScrollArea>

                {/* Bottom status */}
                <div className="p-2 border-t border-sidebar-border space-y-1.5">
                    <button
                        onClick={() => setAgentOpen(!agentOpen)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                        <Bot className="h-3.5 w-3.5" />
                        AI Copilot
                    </button>
                    <div className="flex items-center gap-1.5 px-2.5">
                        {isLive ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                            <XCircle className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-[10px] ${isLive ? 'text-green-400' : 'text-red-400'}`}>
                            {isLive ? 'Connected' : 'Offline'}
                        </span>
                        {activeConfig && (
                            <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[80px]">
                                {activeConfig.sandbox}
                            </span>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <HealthBar />
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {children}
                    </div>
                </ScrollArea>
            </main>

            {/* Agent Panel */}
            <AgentPanel isOpen={agentOpen} onClose={() => setAgentOpen(false)} />

            {/* Command Palette */}
            <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
        </div>
    )
}
