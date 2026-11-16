#!/bin/bash
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
python3 scripts/local-host.py
read -r -p "Press Enter to close..."
