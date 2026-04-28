#!/bin/bash
set -e
TOKEN="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"
REPO="https://${TOKEN}@github.com/suxessx-A/Suxess-X.git"
git remote remove github 2>/dev/null || true
git remote add github "$REPO"
git push github main --force
echo "Done! Code pushed to GitHub."
