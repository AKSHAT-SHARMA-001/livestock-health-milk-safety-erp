"""Start the complete ERP on this Mac with its own persistent local MySQL data.
Uses free installed tools; no cloud services. Stop with Ctrl+C.
"""
import os
import json
import secrets
import shutil
import signal
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "work" / "local-runtime"
LOGS = ROOT / "logs"
MYSQL = Path(os.getenv("MYSQL_BIN", "/opt/homebrew/opt/mysql@8.4/bin"))
JAVA = Path(os.getenv("JAVA_HOME", "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home")) / "bin" / "java"
children = []
handles = []

def launch(args, name, env=None, cwd=ROOT):
    log = open(LOGS / (name + ".log"), "a")
    handles.append(log)
    process = subprocess.Popen([str(x) for x in args], cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    children.append(process)
    return process

def wait_for(check, process, name, seconds=90):
    for _ in range(seconds):
        if process.poll() is not None:
            raise RuntimeError(name + " stopped; see logs/" + name + ".log")
        try:
            if check():
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError(name + " did not become ready; inspect logs/")

def health(port):
    with urllib.request.urlopen("http://127.0.0.1:" + str(port) + "/api/health", timeout=2) as response:
        return response.status == 200

def stop(*_):
    raise KeyboardInterrupt

def main():
    for binary in [MYSQL / "mysqld", MYSQL / "mysql", JAVA]:
        if not binary.exists():
            raise RuntimeError("Required program missing: " + str(binary))
    if not shutil.which("npm"):
        raise RuntimeError("Node.js/npm must be installed.")
    for port in [3306, 8081, 8082, 8083, 8084, 5173]:
        with socket.socket() as check:
            if check.connect_ex(("127.0.0.1", port)) == 0:
                raise RuntimeError("Port " + str(port) + " is already in use. Stop the existing app before starting ERP.")
    for name in ["user-animal-service", "vet-service", "pharmacy-service", "milk-service"]:
        if not (ROOT / name / "target" / (name + "-1.0.0.jar")).exists():
            raise RuntimeError("Build first: bash scripts/build.sh")
    LOGS.mkdir(exist_ok=True)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    data = RUNTIME / "mysql-data"
    if not (data / "mysql").exists():
        print("Initializing your project's private MySQL data folder...", flush=True)
        subprocess.run([str(MYSQL / "mysqld"), "--no-defaults", "--initialize-insecure", "--datadir=" + str(data)], check=True)
    # Bind to this computer only. This project-local database uses an empty root password.
    db = launch([MYSQL / "mysqld", "--no-defaults", "--datadir=" + str(data), "--bind-address=127.0.0.1", "--port=3306",
                 "--socket=/private/tmp/livestock-erp-" + str(os.getpid()) + ".sock", "--pid-file=" + str(RUNTIME / "mysql.pid"),
                 "--mysqlx=0", "--innodb-buffer-pool-size=128M"], "local-mysql")
    client = [str(MYSQL / "mysql"), "--no-defaults", "--protocol=TCP", "-h127.0.0.1", "-P3306", "-uroot"]
    wait_for(lambda: subprocess.run(client + ["-e", "SELECT 1"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0, db, "local-mysql")
    for sql in ["01-schema.sql", "02-seed.sql"]:
        with open(ROOT / "database" / sql) as source:
            subprocess.run(client, stdin=source, check=True)
    environment = os.environ.copy()
    environment.update(DB_USERNAME="root", DB_PASSWORD="", FRONTEND_ORIGIN=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
                       USER_URL="http://127.0.0.1:8081", PHARMACY_URL="http://127.0.0.1:8083",
                       MILK_URL="http://127.0.0.1:8084", AUTH_SECRET="academic-local-demo-change-this-secret",
                       SERVICE_KEY="academic-local-service-key")
    # Public tunnel mode uses private persistent signing/service credentials.
    secret_file = RUNTIME / "local-secrets.json"
    if os.getenv("PUBLIC_SHARING") == "1" and not secret_file.exists():
        fd = os.open(secret_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as output:
            json.dump({"AUTH_SECRET": secrets.token_urlsafe(48), "SERVICE_KEY": secrets.token_urlsafe(48)}, output)
    if secret_file.exists():
        environment.update(json.loads(secret_file.read_text()))
    environment["SERVER_ADDRESS"] = "127.0.0.1"
    for port, name, schema in [(8081, "user-animal-service", "user_animal_db"), (8082, "vet-service", "vet_db"),
                               (8083, "pharmacy-service", "pharmacy_db"), (8084, "milk-service", "milk_db")]:
        env = environment.copy()
        env["DB_URL"] = "jdbc:mysql://127.0.0.1:3306/" + schema + "?allowPublicKeyRetrieval=true&serverTimezone=UTC"
        print("Starting " + name + "...", flush=True)
        app = launch([JAVA, "-Xms64m", "-Xmx256m", "-jar", ROOT / name / "target" / (name + "-1.0.0.jar")], name, env)
        wait_for(lambda p=port: health(p), app, name)
    env = environment.copy()
    env.update(VITE_USER_URL="http://localhost:8081", VITE_VET_URL="http://localhost:8082",
               VITE_PHARMACY_URL="http://localhost:8083", VITE_MILK_URL="http://localhost:8084")
    if not (ROOT / "frontend" / "node_modules").exists():
        subprocess.run(["npm", "ci"], cwd=ROOT / "frontend", check=True)
    frontend = launch(["npm", "run", "dev", "--", "--port", "5173", "--strictPort"], "frontend", env, ROOT / "frontend")
    def ui_ready():
        with urllib.request.urlopen("http://127.0.0.1:5173", timeout=2) as response:
            return response.status == 200
    wait_for(ui_ready, frontend, "frontend")
    print("\nERP READY: http://localhost:5173\nDemo accounts: farmer@demo.local / vet@demo.local / admin@demo.local\nPassword: Demo123!\nKeep this running. Ctrl+C stops all local services; records are kept.\n", flush=True)
    while True:
        for child in children:
            if child.poll() is not None:
                raise RuntimeError("A local process stopped; inspect logs/.")
        time.sleep(2)

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, stop)
    try:
        main()
    except KeyboardInterrupt:
        print("Stopping ERP...", flush=True)
    finally:
        for process in reversed(children):
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        for process in reversed(children):
            try:
                process.wait(timeout=20)
            except subprocess.TimeoutExpired:
                process.kill()
        for handle in handles:
            handle.close()
