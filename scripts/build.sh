#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
MVN="${MVN:-mvn}"
for service in user-animal-service vet-service pharmacy-service milk-service; do
  "$MVN" -f "$service/pom.xml" clean package
done
(cd frontend && npm ci && npm run build)

