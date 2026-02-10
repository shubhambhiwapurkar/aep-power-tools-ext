import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle, Wand2, Terminal, Info, AlertTriangle, XCircle } from 'lucide-react'

// User-provided JSON Rules
const SQL_RULES = [
    {
        "id": "QS_001_MISSING_TIME_FILTER",
        "severity": "CRITICAL",
        "title": "Missing Time Filter",
        "description": "Large datasets require a 'timestamp' filter to avoid full table scans and 10-minute timeouts.",
        "regex": "(?i)FROM\\s+\\w+(?!.*WHERE.*timestamp)",
        "recommendation": "Add: WHERE timestamp >= now() - interval '7 days'",
        "fix_template": " WHERE timestamp >= now() - interval '7 days' "
    },
    {
        "id": "QS_002_SELECT_STAR",
        "severity": "WARNING",
        "title": "Unbounded SELECT *",
        "description": "Using '*' on XDM schemas with 500+ fields significantly increases latency.",
        "regex": "(?i)SELECT\\s+\\*",
        "recommendation": "Explicitly define the fields you need for faster processing.",
        "fix_template": "SELECT _id, timestamp, eventType "
    },
    {
        "id": "QS_003_NESTED_PATH_QUOTES",
        "severity": "ERROR",
        "title": "Missing Quotes on Nested Path",
        "description": "Nested XDM paths like 'commerce.order.price' must be enclosed in double quotes in 2026 Query Service syntax.",
        "regex": "(?i)(?<!\")[a-zA-Z_]+\\.[a-zA-Z_]+\\.[a-zA-Z_]+(?!\")",
        "recommendation": "Wrap nested paths in double quotes: \"commerce.order.price\"",
        "fix_template": "\"$0\""
    },
    {
        "id": "QS_004_IDENTITY_MAP_PARSING",
        "severity": "ADVISORY",
        "title": "Complex IdentityMap Access",
        "description": "IdentityMap is a map of arrays. Direct access often fails; use the 'explode' function.",
        "regex": "(?i)identityMap\\[",
        "recommendation": "Use: explode(identityMap['ECID']) to properly parse identifiers.",
        "fix_template": "explode(identityMap['$1'])"
    },
    {
        "id": "QS_005_CTAS_NO_PARTITION",
        "severity": "WARNING",
        "title": "Missing Partition Key in CTAS",
        "description": "When creating Profile-enabled datasets via SQL, a primary identity partition key is required for performance.",
        "regex": "(?i)CREATE\\s+TABLE\\s+.*(?<!WITH\\s+\\(.*PARTITION_KEY.*\\))",
        "recommendation": "Add: WITH (PARTITION_KEY='your_id_field')",
        "fix_template": " WITH (LABEL='PROFILE', PARTITION_KEY='$1') "
    }
]

export function QueryOptimizer() {
    const [query, setQuery] = useState('')
    const [issues, setIssues] = useState<any[]>([])

    const analyzeQuery = (sql: string) => {
        const foundIssues: any[] = []
        SQL_RULES.forEach(rule => {
            try {
                const re = new RegExp(rule.regex, 'i') // basic flag support
                // Note: JS Regex doesn't support (?i) inline flags well, stripping them
                const cleanRegex = rule.regex.replace('(?i)', '')
                const match = new RegExp(cleanRegex, 'i').exec(sql)

                if (match) {
                    foundIssues.push({
                        ...rule,
                        match: match[0],
                        index: match.index
                    })
                }
            } catch (e) {
                console.error("Rule Regex Error", rule.id, e)
            }
        })
        setIssues(foundIssues)
    }

    const applyFix = (issue: any) => {
        // Simple string replacement for demo purpose
        // A real implementation would need precise index replacement
        if (issue.id === 'QS_001_MISSING_TIME_FILTER') {
            setQuery(prev => prev + issue.fix_template)
        } else if (issue.id === 'QS_002_SELECT_STAR') {
            setQuery(prev => prev.replace(/\*/, '_id, timestamp, eventType'))
        } else if (issue.id === 'QS_003_NESTED_PATH_QUOTES') {
            setQuery(prev => prev.replace(issue.match, `"${issue.match}"`))
        }
        // Re-analyze after fix
        setTimeout(() => analyzeQuery(query), 100)
    }

    useEffect(() => {
        analyzeQuery(query)
    }, [query])

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        SQL Anti-Pattern Detector
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                    <textarea
                        className="flex-1 min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        placeholder="Paste your SQL Query here..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <div className="h-1/2 flex flex-col">
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                            Detected Issues
                            <Badge variant={issues.length > 0 ? "destructive" : "secondary"} className="h-5 px-1.5">
                                {issues.length}
                            </Badge>
                        </h4>

                        <ScrollArea className="flex-1 rounded-md border bg-muted/10 p-2">
                            {issues.length === 0 ? (
                                <div className="text-center text-muted-foreground text-xs py-8 flex flex-col items-center">
                                    <CheckCircle className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                                    No anti-patterns detected.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {issues.map((issue, idx) => (
                                        <div key={idx} className="p-2 rounded border bg-background text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-bold flex items-center gap-1 ${issue.severity === 'CRITICAL' ? 'text-red-500' : issue.severity === 'WARNING' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                                    {issue.severity === 'CRITICAL' && <XCircle className="h-3 w-3" />}
                                                    {issue.severity === 'WARNING' && <AlertTriangle className="h-3 w-3" />}
                                                    {issue.severity === 'ADVISORY' && <Info className="h-3 w-3" />}
                                                    {issue.title}
                                                </span>
                                                <Badge variant="outline" className="text-[10px]">{issue.id}</Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-2">{issue.description}</p>
                                            <div className="flex items-center justify-between bg-muted/30 p-1.5 rounded">
                                                <code className="font-mono text-[10px]">{issue.recommendation}</code>
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Auto-fix" onClick={() => applyFix(issue)}>
                                                    <Wand2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </Card>
        </div>
    )
}
