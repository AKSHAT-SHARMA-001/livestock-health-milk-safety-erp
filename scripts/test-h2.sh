#!/usr/bin/env bash
# Test-only database harness; production configuration stays MySQL.
set -euo pipefail
cd "$(dirname "$0")/.."
JAVA="${JAVA_HOME:+$JAVA_HOME/bin/}java"
H2_JAR="${H2_JAR:-$HOME/.m2/repository/com/h2database/h2/2.2.224/h2-2.2.224.jar}"
if [ ! -f "$H2_JAR" ]; then echo "Build all services first; H2_JAR can override the test driver path."; exit 1; fi
mkdir -p logs
pids=()
cleanup(){ for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM
"$JAVA" -cp "$H2_JAR" org.h2.tools.Server -tcp -tcpPort 19093 -ifNotExists >logs/h2.log 2>&1 &
pids+=("$!")
export USER_URL=http://localhost:18081 VET_URL=http://localhost:18082 PHARMACY_URL=http://localhost:18083 MILK_URL=http://localhost:18084
url='jdbc:h2:tcp://localhost:19093/mem:erp;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1'
for attempt in {1..20}; do
  if "$JAVA" -cp "$H2_JAR" org.h2.tools.Shell -url "$url" -user sa -password '' -sql 'SELECT 1' >/dev/null 2>&1; then break; fi
  sleep 1
done
"$JAVA" -cp "$H2_JAR" org.h2.tools.Shell -url "$url" -user sa -password '' -sql 'CREATE SCHEMA user_animal_db;CREATE SCHEMA vet_db;CREATE SCHEMA pharmacy_db;CREATE SCHEMA milk_db;'
port=18081
for service in user-animal-service vet-service pharmacy-service milk-service; do
  schema="${service%-service}_db"
  if [ "$service" = user-animal-service ]; then schema=user_animal_db; fi
  DB_URL="$url;SCHEMA=$schema" DB_USERNAME=sa DB_PASSWORD='' "$JAVA" -Dloader.path="$H2_JAR" -cp "$service/target/$service-1.0.0.jar" org.springframework.boot.loader.launch.PropertiesLauncher --server.port="$port" --spring.jpa.hibernate.ddl-auto=create >"logs/h2-$service.log" 2>&1 &
  pids+=("$!")
  port=$((port+1))
done
python3 - <<'PY'
import urllib.request, urllib.error,time,os
for name in ['USER','VET','PHARMACY','MILK']:
    url=os.environ[name+'_URL']+'/api/not-a-route'
    for attempt in range(60):
        try: urllib.request.urlopen(url,timeout=2); break
        except urllib.error.HTTPError: break
        except OSError: time.sleep(1)
    else: raise SystemExit(name+' did not start; inspect logs/h2-*')
PY
python3 scripts/negative-check.py
