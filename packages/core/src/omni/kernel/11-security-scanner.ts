const OWASP_PATTERNS = [
  { id: 'A01', name: 'Broken Access Control', pattern: /(?:admin|role|permission|auth|bypass)/gi },
  { id: 'A02', name: 'Cryptographic Failures', pattern: /(?:md5|sha1|weak.?encrypt|plain.?text.?password)/gi },
  { id: 'A03', name: 'Injection', pattern: /(?:eval\(|exec\(|raw\(|innerHTML|dangerouslySetInnerHTML)/g },
  { id: 'A04', name: 'Insecure Design', pattern: /(?:untrusted.?input|user.?supplied|request.?query)/gi },
  { id: 'A05', name: 'Security Misconfiguration', pattern: /(?:debug.?true|CORS.?\*|disabled.?cors)/gi },
  { id: 'A06', name: 'Vulnerable Components', pattern: /(?:axios@0\.|lodash@4\.17\.)/g },
  { id: 'A07', name: 'Auth Failures', pattern: /(?:session.?fixed|weak.?password|no.?rate.?limit)/gi },
  { id: 'A08', name: 'Data Integrity Failures', pattern: /(?:unsafe.?deserialize|insecure.?deserial)/gi },
  { id: 'A09', name: 'Logging Failures', pattern: /(?:no.?log|error.?silent|log.?level.?off)/gi },
  { id: 'A10', name: 'SSRF', pattern: /(?:fetch\(req\.|request\.url|proxy|tunnel)/gi },
]

const ENDPOINT_PATTERNS = [
  { name: 'No Auth', pattern: /app\.(get|post|put|delete)\(\s*['"][^'"]+['"]\s*,\s*(?!.*auth|.*jwt|.*verify)/gi },
  { name: 'Hardcoded Secret', pattern: /(?:secret|key|token)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{20,}['"]/gi },
]

export class SecurityScanner {
  async scanCode(content: string): Promise<Array<{ severity: string; finding: string; line?: number }>> {
    const findings: Array<{ severity: string; finding: string; line?: number }> = []

    for (const vuln of OWASP_PATTERNS) {
      const matches = content.match(vuln.pattern)
      if (matches) {
        findings.push({ severity: 'high', finding: `${vuln.id}: ${vuln.name} - ${matches.slice(0, 3).join(', ')}` })
      }
    }

    for (const ep of ENDPOINT_PATTERNS) {
      const matches = content.match(ep.pattern)
      if (matches) {
        findings.push({ severity: 'critical', finding: `${ep.name} - ${matches.slice(0, 2).join(', ')}` })
      }
    }

    return findings
  }

  async scanEndpoint(url: string): Promise<Array<{ severity: string; finding: string }>> {
    const findings: Array<{ severity: string; finding: string }> = []
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      const headers = res.headers

      if (!headers.get('content-security-policy')) findings.push({ severity: 'medium', finding: 'Missing CSP header' })
      if (!headers.get('x-frame-options')) findings.push({ severity: 'low', finding: 'Missing X-Frame-Options' })
      if (!headers.get('strict-transport-security')) findings.push({ severity: 'medium', finding: 'Missing HSTS header' })
      if (headers.get('access-control-allow-origin') === '*') findings.push({ severity: 'high', finding: 'CORS allows all origins' })
    } catch {}
    return findings
  }
}
