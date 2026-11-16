#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
pids=()
cleanup(){ for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM
for service in user-animal-service vet-service pharmacy-service milk-service; do
  if [ ! -f "$service/target/$service-1.0.0.jar" ]; then echo "Build first: bash scripts/build.sh"; exit 1; fi
  java -jar "$service/target/$service-1.0.0.jar" >"logs/$service.log" 2>&1 &
  pids+=("$!")
done
(cd frontend && npm run dev -- --port 5173 --strictPort) &
pids+=("$!")
echo "Starting ERP at http://localhost:5173; backend logs are in logs/. Ctrl+C stops the services."
wait

