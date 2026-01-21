# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Known Security Advisories

### Development Dependencies (Non-Critical)

**esbuild vulnerability (GHSA-67mh-4wv8-2f99)**
- **Severity**: Moderate
- **Impact**: Development server only (not runtime)
- **Status**: Acknowledged, not affecting production
- **Details**: esbuild (via vitest) has a vulnerability in its development server that allows websites to send requests. Since this MCP runs in production via Node.js (not esbuild dev server), this is a dev-time only issue.
- **Mitigation**: The vulnerability does not affect the compiled/distributed code. If running tests in an untrusted environment, upgrade vitest to v4+ with `npm audit fix --force` (note: this is a breaking change).

## Security Considerations

### ⚠️ CRITICAL: --dangerously-bypass-approvals-and-sandbox

This MCP uses `--dangerously-bypass-approvals-and-sandbox` flag for unattended execution, which:

- **Executes ALL commands without approval**
- **Disables sandboxing protections**
- **Can modify/delete files without confirmation**

**Safe Usage:**
- ✅ Run inside Docker containers
- ✅ Use in dedicated development VMs
- ✅ Always use version control
- ✅ Keep backups of important files
- ❌ NEVER use on production systems
- ❌ NEVER use with untrusted prompts
- ❌ NEVER run without backups

### Output Size Limits

The MCP implements 10MB default output limits per agent to prevent memory exhaustion attacks. This can be configured via `MAX_OUTPUT_SIZE` environment variable.

### Authentication

This MCP relies on the OpenAI Codex CLI authentication. Ensure:
- Your codex CLI is authenticated (`codex login`)
- API keys are stored securely by codex (not exposed in this MCP)
- No credentials are passed through the MCP itself

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Instead:
1. Email: timothy.schwarz@qvc.com
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Timeline:**
- Initial response: Within 48 hours
- Status update: Within 7 days
- Fix timeline: Depends on severity (critical = immediate, high = 7 days, medium = 30 days)

## Security Best Practices

### For Users

1. **Never run untrusted code**: Only use this MCP with tasks you fully understand
2. **Use in isolated environments**: Docker, VMs, or sandboxed systems
3. **Monitor agent output**: Check stdout/stderr for suspicious activity
4. **Limit reasoning effort**: Use `low` or `medium` for untrusted tasks to reduce token usage/cost
5. **Version control everything**: Git is your safety net

### For Contributors

1. **No secrets in code**: Never commit API keys, tokens, or credentials
2. **Input validation**: Validate all user inputs before passing to codex CLI
3. **Output sanitization**: Ensure output limits are enforced
4. **Test security**: Include tests for malicious inputs
5. **Document risks**: Clearly mark dangerous operations

## Security Checklist for Deployment

- [ ] Running in isolated environment (Docker/VM)
- [ ] Version control enabled
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] Understanding of `--dangerously-bypass-approvals-and-sandbox` risks
- [ ] Codex CLI properly authenticated
- [ ] Output size limits configured appropriately
- [ ] No production data in working directory

## License

This security policy is part of the Codex MCP project, licensed under MIT.
