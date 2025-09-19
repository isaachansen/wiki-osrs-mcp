#!/usr/bin/env bash
set -euo pipefail

CONFIG="$HOME/.mcp/config.json"
BACKUP="$CONFIG.bak.$(date +%s)"

mkdir -p "$HOME/.mcp"

# Backup existing config
if [ -f "$CONFIG" ]; then
  cp "$CONFIG" "$BACKUP"
fi

# Create base config if missing
if [ ! -f "$CONFIG" ]; then
  cat > "$CONFIG" <<'JSON'
{
  "clients": {
    "default": {
      "transport": "stdio",
      "servers": {}
    }
  }
}
JSON
fi

# Ensure jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "Please install 'jq' (brew install jq, apt-get install jq, etc.)"
  exit 1
fi

TMP="$(mktemp)"
jq '
  .clients //= {} |
  .clients.default //= {} |
  .clients.default.transport = "stdio" |
  .clients.default.servers //= {} |
  .clients.default.servers["osrs-wiki-mcp"] = {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://wiki-osrs-mcp.isaachansen2400.workers.dev/sse"
    ]
  }
' "$CONFIG" > "$TMP"

mv "$TMP" "$CONFIG"

echo "✅ osrs-wiki-mcp server added to $CONFIG"
echo "➡  Reload Cursor or Claude to pick up the new server."
