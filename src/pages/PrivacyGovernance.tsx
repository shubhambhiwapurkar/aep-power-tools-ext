import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, EyeOff, Lock, UserCheck, Scale, FileText, AlertCircle, Clock } from 'lucide-react'
import { getActiveConfig } from '@/lib/config-storage'
import { AEPClient } from '@/lib/aep-client'

export function PrivacyGovernance() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => setLoading(false), 800)
    }, [])

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold">Privacy & Governance</h2>
                <p className="text-xs text-muted-foreground">Manage data policies, labels, and privacy requests</p>
            </div>

            <Tabs defaultValue="policies" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="policies" className="text-xs">Data Usage Policies</TabsTrigger>
                    <TabsTrigger value="privacy" className="text-xs">Privacy Jobs (GDPR/CCPA)</TabsTrigger>
                </TabsList>

                <TabsContent value="policies" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Scale className="h-4 w-4 text-primary" />
                                Active Policies
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Policy Name</TableHead>
                                        <TableHead>Marketing Actions</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <>
                                            <TableRow className="text-xs">
                                                <TableCell className="font-medium">Restrict On-Site Personalization</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Badge variant="secondary" className="text-[9px]">ON_SITE_PERSONALIZATION</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="success">Active</Badge></TableCell>
                                            </TableRow>
                                            <TableRow className="text-xs">
                                                <TableCell className="font-medium">Email Marketing Restriction</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Badge variant="secondary" className="text-[9px]">EMAIL_MARKETING</Badge>
                                                        <Badge variant="secondary" className="text-[9px]">DIRECT_MAIL</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="success">Active</Badge></TableCell>
                                            </TableRow>
                                            <TableRow className="text-xs">
                                                <TableCell className="font-medium">No Cross-Channel Marketing</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Badge variant="secondary" className="text-[9px]">CROSS_CHANNEL</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">Draft</Badge></TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-primary" />
                                Privacy Request Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job ID</TableHead>
                                        <TableHead>Request Type</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [1, 2].map(i => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <>
                                            <TableRow className="text-xs">
                                                <TableCell className="font-mono text-muted-foreground uppercase">PR-7182-XJ</TableCell>
                                                <TableCell><Badge variant="outline" className="gap-1"><EyeOff className="h-2.5 w-2.5" /> Access</Badge></TableCell>
                                                <TableCell>2 days ago</TableCell>
                                                <TableCell><Badge variant="success">Completed</Badge></TableCell>
                                            </TableRow>
                                            <TableRow className="text-xs">
                                                <TableCell className="font-mono text-muted-foreground uppercase">PR-8190-KL</TableCell>
                                                <TableCell><Badge variant="outline" className="gap-1"><Lock className="h-2.5 w-2.5" /> Delete</Badge></TableCell>
                                                <TableCell>4 hours ago</TableCell>
                                                <TableCell><Badge variant="warning">Processing</Badge></TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-xs font-semibold">Policy Violations</span>
                        </div>
                        <p className="text-lg font-bold">3</p>
                        <p className="text-[10px] text-muted-foreground">Violations detected in last 24h</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-semibold">Pending Requests</span>
                        </div>
                        <p className="text-lg font-bold">12</p>
                        <p className="text-[10px] text-muted-foreground">Privacy jobs in queue</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
