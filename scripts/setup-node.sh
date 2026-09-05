#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/.tools"
NODE_CHANNEL_URL="https://nodejs.org/dist/latest-v22.x"

mkdir -p "$TOOLS_DIR"
cd "$TOOLS_DIR"

archive="$(curl -fsSL "$NODE_CHANNEL_URL/SHASUMS256.txt" | awk '/linux-x64.tar.xz/ { print $2; exit }')"
if [[ -z "$archive" ]]; then
  echo "Could not find a linux-x64 Node archive in $NODE_CHANNEL_URL/SHASUMS256.txt" >&2
  exit 1
fi

if [[ ! -d "${archive%.tar.xz}" ]]; then
  curl -fSLO "$NODE_CHANNEL_URL/$archive"
  tar -xJf "$archive"
fi

ln -sfn "${archive%.tar.xz}" node
export PATH="$TOOLS_DIR/node/bin:$PATH"
"$TOOLS_DIR/node/bin/node" -v
"$TOOLS_DIR/node/bin/npm" -v