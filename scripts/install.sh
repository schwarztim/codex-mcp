#!/bin/bash
set -e

echo "Installing Codex MCP..."

# Install dependencies and build
npm install
npm run build

echo ""
echo "✓ Codex MCP installed successfully!"
echo ""
echo "Next steps:"
echo "1. Add this MCP to ~/.claude/user-mcps.json:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"codex\": {"
echo "         \"command\": \"node\","
echo "         \"args\": [\"$(pwd)/dist/index.js\"],"
echo "         \"env\": {"
echo "           \"CODEX_BIN\": \"codex\","
echo "           \"CODEX_DEFAULT_MODEL\": \"o3\""
echo "         }"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "2. Restart Claude Code"
echo "3. Test with: 'Check if codex is available'"
