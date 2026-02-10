import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw, User } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

export function Profiles() {
    const [namespace, setNamespace] = useState('email')
    const [identity, setIdentity] = useState('')
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const lookupProfile = async () => {
        if (!identity) return
        setLoading(true); setError(null); setProfile(null)
        try {
            const config = await getActiveConfig()
            if (!config) { setError('No active configuration'); setLoading(false); return }
            const client = new AEPClient(config)
            const result = await client.getProfile(namespace, identity)
            setProfile(result)
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile Lookup</h2>
                <p className="text-xs text-muted-foreground">Look up profiles by identity namespace and value</p>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Namespace</Label>
                            <Select value={namespace} onValueChange={setNamespace}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="ecid">ECID</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="crmid">CRM ID</SelectItem>
                                    <SelectItem value="aaid">AAID</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Identity Value</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Enter identity value..." value={identity} onChange={e => setIdentity(e.target.value)} className="h-8 text-xs" onKeyDown={e => e.key === 'Enter' && lookupProfile()} />
                                <Button size="sm" onClick={lookupProfile} disabled={loading || !identity}>
                                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3"><p className="text-xs text-red-400">{error}</p></CardContent></Card>}

            {loading && <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>}

            {profile && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Profile Data</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-[11px] bg-muted/30 p-3 rounded-md overflow-auto max-h-[300px] font-mono">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
