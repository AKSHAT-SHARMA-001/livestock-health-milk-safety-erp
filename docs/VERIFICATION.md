# Verification record

## Latest local MySQL verification

On 16 November 2026, MySQL 8.4.13 was installed and the complete local project started successfully on ports 8081–8084 and 5173 using scripts/local-host.py. The supplied MySQL DDL and seed scripts executed successfully. The full HTTP integration suite passed against this real MySQL server, including signed login/authorization, active and expired withdrawal, unsafe yield exclusion, overselling, conservative partial failure/retry, vaccination/rating and all six plain JDBC reports. The earlier MySQL-library limitation below is now resolved by this separate MySQL 8.4 installation.

Checks performed on 16 November 2026:

- All four services compiled and packaged targeting Java 17.
- React production bundle built successfully.
- npm dependency audit: zero known vulnerabilities at verification time.
- The same four packaged Spring applications ran together on isolated test ports with H2 2.2.224 in MySQL mode, sharing four schemas for JDBC reports.
- End-to-end HTTP checks passed for registration/login; missing and tampered bearer tokens; role and farmer ownership denial; animal registration; vet profile/listing; booking acceptance; antibiotic treatment; stock deduction; milk block; active withdrawal rejection; fresh milk sales after expiry; exclusion of historical withdrawal milk; overselling rejection; vaccination; rating; all six JDBC reports.
- The final withdrawal date still blocked sales with one day remaining.
- Insufficient pharmacy stock left a conservative milk block and an incomplete treatment checkpoint. Restocking and retry completed the workflow, and a second retry did not deduct stock again.

## Limits

The installed local MySQL server could not start because its required libabsl_base.2601.0.0.dylib was missing. MySQL DDL/startup was therefore not executed on a live MySQL server here. The supplied MySQL 8 schema and normal JDBC configuration are separate from the H2 harness. Run the supplied smoke test against your MySQL installation after initialization.

The frontend was build-verified; a full interactive browser acceptance test was not performed.

No automatic Java unit-test suite is claimed. The substantive verification is the multi-process HTTP integration test in scripts/smoke-test.py, reproduced by scripts/test-h2.sh.
