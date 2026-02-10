import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Plus, Trash2, CheckCircle, Edit3, Save, X } from 'lucide-react'
import { getConfigs, saveConfig, deleteConfig, setActiveConfig } from '@/lib/config-storage'
import type { AEPConfig } from '@/lib/types'

export function Configuration() {
    const [configs, setConfigs] = useState<AEPConfig[]>([])
    const [editing, setEditing] = useState<string | null>(null)
    const [showNew, setShowNew] = useState(false)
    const [form, setForm] = useState({ name: '', clientId: '', clientSecret: '', orgId: '', sandbox: 'prod', sandboxId: '', authToken: '' })

    useEffect(() => { loadConfigs() }, [])

    const loadConfigs = async () => {
        const all = await getConfigs()
        setConfigs(all)
    }

    const handleSave = async () => {
        await saveConfig({ ...form, isActive: configs.length === 0 })
        setShowNew(false); setEditing(null)
        setForm({ name: '', clientId: '', clientSecret: '', orgId: '', sandbox: 'prod', sandboxId: '', authToken: '' })
        await loadConfigs()
    }

    const handleEdit = (config: AEPConfig) => {
        setEditing(config.id || null)
        setForm({ name: config.name, clientId: config.clientId, clientSecret: config.clientSecret, orgId: config.orgId, sandbox: config.sandbox, sandboxId: config.sandboxId, authToken: config.authToken })
        setShowNew(true)
    }

    const handleUpdate = async () => {
        if (!editing) return
        await saveConfig({ ...form, id: editing, isActive: configs.find(c => c.id === editing)?.isActive || false } as any)
        setShowNew(false); setEditing(null)
        setForm({ name: '', clientId: '', clientSecret: '', orgId: '', sandbox: 'prod', sandboxId: '', authToken: '' })
        await loadConfigs()
    }

    const handleDelete = async (id: string) => {
        await deleteConfig(id)
        await loadConfigs()
    }

    const handleActivate = async (id: string) => {
        await setActiveConfig(id)
        await loadConfigs()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Configuration</h2>
                    <p className="text-xs text-muted-foreground">Manage AEP connection credentials</p>
                </div>
                <Button size="sm" onClick={() => { setShowNew(true); setEditing(null); setForm({ name: '', clientId: '', clientSecret: '', orgId: '', sandbox: 'prod', sandboxId: '', authToken: '' }) }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Config
                </Button>
            </div>

            {showNew && (
                <Card className="border-primary/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{editing ? 'Edit Configuration' : 'New Configuration'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" placeholder="Production" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Organization ID</Label><Input className="h-8 text-xs" placeholder="ABC123@AdobeOrg" value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Client ID</Label><Input className="h-8 text-xs" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Client Secret</Label><Input className="h-8 text-xs" type="password" value={form.clientSecret} onChange={e => setForm({ ...form, clientSecret: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Sandbox</Label><Input className="h-8 text-xs" placeholder="prod" value={form.sandbox} onChange={e => setForm({ ...form, sandbox: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Sandbox ID</Label><Input className="h-8 text-xs" value={form.sandboxId} onChange={e => setForm({ ...form, sandboxId: e.target.value })} /></div>
                            <div className="col-span-2 space-y-1"><Label className="text-xs">Auth Token (optional, overrides client credentials)</Label><Input className="h-8 text-xs font-mono" type="password" value={form.authToken} onChange={e => setForm({ ...form, authToken: e.target.value })} /></div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={editing ? handleUpdate : handleSave} disabled={!form.name || !form.orgId}>
                                <Save className="h-3.5 w-3.5 mr-1" /> {editing ? 'Update' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowNew(false); setEditing(null) }}>
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-2">
                {configs.length === 0 ? (
                    <Card><CardContent className="py-8"><p className="text-xs text-muted-foreground text-center">No configurations yet. Click "Add Config" to get started.</p></CardContent></Card>
                ) : configs.map(config => (
                    <Card key={config.id} className={`${config.isActive ? 'border-primary/40 bg-primary/5' : ''}`}>
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {config.isActive && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                                    <span className="text-sm font-medium">{config.name}</span>
                                    <Badge variant="secondary" className="text-[10px]">{config.sandbox}</Badge>
                                    {config.isActive && <Badge variant="success" className="text-[10px]">Active</Badge>}
                                </div>
                                <div className="flex items-center gap-1">
                                    {!config.isActive && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleActivate(config.id!)}>Activate</Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(config)}>
                                        <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(config.id!)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                                Org: {config.orgId?.substring(0, 15)}... • {config.authToken ? 'Token auth' : 'Client credentials'}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
