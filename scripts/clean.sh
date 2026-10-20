#!/usr/bin/env bash
# Deletes dependencies, build output and caches. Keeps .env* and local data.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "WARNING: this removes node_modules, dist, .next*, out, coverage, .turbo and caches."
echo "Your .env* files and local data stay. You must run 'bun install' before anything else works."
read -r -p "Delete these now? [y/N] " answer || exit 1
[[ "$answer" == [yY] ]] || { echo "aborted, nothing deleted"; exit 1; }

rm -rf {node_modules,*/node_modules,*/*/node_modules} {dist,*/dist,*/*/dist} {out,*/out,*/*/out} {coverage,*/coverage,*/*/coverage} {.turbo,*/.turbo,*/*/.turbo} apps/*/.next* .cache */.cache */*/.cache
find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete
echo "clean done"
