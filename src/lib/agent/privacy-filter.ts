/**
 * PII Privacy Filter — Scrubs sensitive data before sending to LLM
 * Ported from aep-unified/lib/agent/privacy-filter.ts
 */

const PII_PATTERNS: Record<string, RegExp> = {
    email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    phone: /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    ecid: /\b\d{38}\b/g,
    uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    jwt: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
    apiKey: /(?:api[_-]?key|token|secret|password)['":\s]*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    bearerToken: /Bearer\s+[A-Za-z0-9_-]+/gi,
}

const SENSITIVE_FIELDS = [
    'email', 'emailAddress', 'personalEmail', 'workEmail',
    'phone', 'phoneNumber', 'mobilePhone', 'homePhone',
    'ssn', 'socialSecurityNumber', 'password', 'secret', 'apiKey',
    'token', 'accessToken', 'creditCard', 'cardNumber', 'cvv',
    'address', 'streetAddress', 'firstName', 'lastName', 'fullName',
    'name', 'birthDate', 'dateOfBirth', 'dob', 'nationalId',
    'passportNumber', 'driverLicense', 'ipAddress', 'deviceId',
    'xid', 'ecid', 'mcid', 'identityValue',
]

function redactString(value: string): string {
    let redacted = value
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`)
    }
    return redacted
}

function isSensitiveField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase()
    return SENSITIVE_FIELDS.some(s => lower.includes(s.toLowerCase()))
}

export function redactPII(data: unknown, depth = 0): unknown {
    if (depth > 10) return '[TRUNCATED]'
    if (data === null || data === undefined) return data
    if (typeof data === 'string') return redactString(data)
    if (typeof data === 'number') {
        if (data.toString().length > 15) return '[REDACTED_ID]'
        return data
    }
    if (Array.isArray(data)) return data.slice(0, 20).map(item => redactPII(item, depth + 1))
    if (typeof data === 'object') {
        const redacted: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            if (isSensitiveField(key)) {
                if (typeof value === 'string') {
                    redacted[key] = value.length > 4 ? value.substring(0, 2) + '***' + value.substring(value.length - 2) : '[REDACTED]'
                } else {
                    redacted[key] = '[REDACTED]'
                }
            } else {
                redacted[key] = redactPII(value, depth + 1)
            }
        }
        return redacted
    }
    return data
}

export function safeStringifyForLLM(data: unknown, maxLength = 3000): string {
    try {
        const redacted = redactPII(data)
        const json = JSON.stringify(redacted, null, 2)
        return json.length > maxLength ? json.substring(0, maxLength) + '\n... [TRUNCATED]' : json
    } catch {
        return '[Error stringifying data]'
    }
}

export function containsPII(text: string): boolean {
    for (const pattern of Object.values(PII_PATTERNS)) {
        if (pattern.test(text)) return true
    }
    return false
}
