# PowerShell installation script for Windows

Write-Host "Installing Codex MCP..." -ForegroundColor Green

# Install dependencies and build
npm install
npm run build

Write-Host ""
Write-Host "✓ Codex MCP installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add this MCP to ~/.claude/user-mcps.json:" -ForegroundColor Yellow
Write-Host "   {" -ForegroundColor Cyan
Write-Host "     `"mcpServers`": {" -ForegroundColor Cyan
Write-Host "       `"codex`": {" -ForegroundColor Cyan
Write-Host "         `"command`": `"node`"," -ForegroundColor Cyan
Write-Host "         `"args`": [`"$((Get-Location).Path)/dist/index.js`"]," -ForegroundColor Cyan
Write-Host "         `"env`": {" -ForegroundColor Cyan
Write-Host "           `"CODEX_BIN`": `"codex`"," -ForegroundColor Cyan
Write-Host "           `"CODEX_DEFAULT_MODEL`": `"o3`"" -ForegroundColor Cyan
Write-Host "         }" -ForegroundColor Cyan
Write-Host "       }" -ForegroundColor Cyan
Write-Host "     }" -ForegroundColor Cyan
Write-Host "   }" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Restart Claude Code" -ForegroundColor Yellow
Write-Host "3. Test with: 'Check if codex is available'" -ForegroundColor Yellow
