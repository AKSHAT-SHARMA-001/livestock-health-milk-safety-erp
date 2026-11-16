"""Fast persistent local demo using H2 in MySQL mode. Normal configuration stays MySQL."""
import importlib.util
import os
import signal
import socket
import subprocess
import time
import json
import urllib.request
from pathlib import Path

spec = importlib.util.spec_from_file_location("launcher", Path(__file__).with_name("local-host.py"))
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)
driver = Path.home() / ".m2/repository/com/h2database/h2/2.2.224/h2-2.2.224.jar"
try:
    for port in [19094, 8081, 8082, 8083, 8084, 5173]:
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", port)) == 0:
                raise RuntimeError("Port " + str(port) + " is already in use.")
    app.LOGS.mkdir(exist_ok=True)
    app.RUNTIME.mkdir(parents=True, exist_ok=True)
    db = app.launch([app.JAVA, "-cp", driver, "org.h2.tools.Server", "-tcp", "-tcpPort", "19094", "-ifNotExists", "-baseDir", app.RUNTIME], "local-h2")
    url = "jdbc:h2:tcp://localhost:19094/./erp;MODE=MySQL;DATABASE_TO_LOWER=TRUE"
    shell = [str(app.JAVA), "-cp", str(driver), "org.h2.tools.Shell", "-url", url, "-user", "sa", "-password", ""]
    app.wait_for(lambda: subprocess.run(shell + ["-sql", "SELECT 1"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0, db, "local-h2")
    subprocess.run(shell + ["-sql", "CREATE SCHEMA IF NOT EXISTS user_animal_db;CREATE SCHEMA IF NOT EXISTS vet_db;CREATE SCHEMA IF NOT EXISTS pharmacy_db;CREATE SCHEMA IF NOT EXISTS milk_db;"], check=True)
    env = os.environ.copy()
    env.update(DB_USERNAME="sa", DB_PASSWORD="", FRONTEND_ORIGIN="http://localhost:5173", USER_URL="http://127.0.0.1:8081", PHARMACY_URL="http://127.0.0.1:8083", MILK_URL="http://127.0.0.1:8084", AUTH_SECRET="academic-local-demo-change-this-secret", SERVICE_KEY="academic-local-service-key")
    for port, name, schema in [(8081,"user-animal-service","user_animal_db"),(8082,"vet-service","vet_db"),(8083,"pharmacy-service","pharmacy_db"),(8084,"milk-service","milk_db")]:
        service_env = dict(env, DB_URL=url+";SCHEMA="+schema)
        print("Starting " + name, flush=True)
        process = app.launch([app.JAVA,"-Xms64m","-Xmx256m","-Dloader.path="+str(driver),"-cp",app.ROOT/name/"target"/(name+"-1.0.0.jar"),"org.springframework.boot.loader.launch.PropertiesLauncher","--spring.jpa.hibernate.ddl-auto=update"], name, service_env)
        app.wait_for(lambda p=port: app.health(p), process, name)
    headers={"Content-Type":"application/json","X-Service-Key":"academic-local-service-key"}
    with urllib.request.urlopen(urllib.request.Request("http://localhost:8083/api/medicines",headers=headers)) as r:
        inventory=json.load(r)
    if not inventory:
        for item in [dict(name="Demo antibiotic",type="MEDICINE",antibiotic=True,withdrawalDays=3,stock=100,threshold=10,expiryDate="2030-12-31"),dict(name="Demo vaccine",type="VACCINE",antibiotic=False,withdrawalDays=0,stock=40,threshold=10,expiryDate="2030-12-31")]:
            urllib.request.urlopen(urllib.request.Request("http://localhost:8083/api/medicines",data=json.dumps(item).encode(),headers=headers)).close()
    ui_env=dict(env,VITE_USER_URL="http://localhost:8081",VITE_VET_URL="http://localhost:8082",VITE_PHARMACY_URL="http://localhost:8083",VITE_MILK_URL="http://localhost:8084")
    frontend=app.launch(["npm","run","dev","--","--port","5173","--strictPort"],"frontend",ui_env,app.ROOT/"frontend")
    def ready():
        with urllib.request.urlopen("http://127.0.0.1:5173",timeout=2) as r:
            return r.status==200
    app.wait_for(ready,frontend,"frontend")
    print("ERP READY: http://localhost:5173 — persistent H2 demo database. Password: Demo123!",flush=True)
    signal.signal(signal.SIGTERM, app.stop)
    while True:
        if any(p.poll() is not None for p in app.children):
            raise RuntimeError("A local process stopped; inspect logs/.")
        time.sleep(2)
except KeyboardInterrupt:
    pass
finally:
    for process in reversed(app.children):
        try: os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError: pass
    for process in reversed(app.children):
        try: process.wait(timeout=20)
        except subprocess.TimeoutExpired: process.kill()
