# Free local startup on this Mac

Open **http://localhost:5173** while the local ERP is running.
Use the local URL rather than the Vercel website.

All three demonstration passwords are **Demo123!**:

- farmer@demo.local
- vet@demo.local
- admin@demo.local

Double-click **Start Local ERP.command** in the project folder to start MySQL,
four Java services on 8081–8084 and React on 5173. Keep its Terminal window open.
Ctrl+C stops the services. Closing them does not delete your records.

This launcher uses the free MySQL 8.4 and Java 17 installations on this Mac.
The database is bound to 127.0.0.1, stored under work/local-runtime/mysql-data,
and uses root with an empty password for this local academic demonstration.
There are no cloud subscriptions or external database dependencies.

Project logs are in logs/. If the app is already running, use its existing
browser tab instead of launching a second copy. The launcher checks ports and
will report a conflict rather than stop unrelated applications.

From Terminal, the equivalent is:

    python3 scripts/local-host.py

If source code changes, rebuild with scripts/build.sh before restarting.
Do not delete work/local-runtime/mysql-data unless deliberately discarding
your local records. The launcher seeds accounts/inventory only when absent.
