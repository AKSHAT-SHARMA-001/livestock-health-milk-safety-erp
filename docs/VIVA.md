# Viva notes

| Unit                 | Implementation                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| 1: HTML/CSS          | Semantic forms/tables, Grid/Flexbox, responsive CSS, button/card/status transitions                   |
| 2: JavaScript/React  | JSX, controlled forms, useState/useEffect/useContext, React Router, role routes, custom useFetch      |
| 3: SQL/JDBC          | Four schemas; JOIN/subquery/WHERE/UNION/NOT IN/IN; DDL/DML; DriverManager/PreparedStatement/ResultSet |
| 4: Spring Boot       | Auto-configuration; DTO validation; Controller → Service → Repository; domain rules                   |
| 5: JPA/microservices | Entity relationships, repository interfaces, four independent REST services                           |

Start the viva with withdrawal: the vet's React form calls the controller; the service saves treatment checkpoints, calls milk/pharmacy over REST, and the farmer's sale is rejected by milk business logic. The report JOIN shows the farmer and withdrawal end.

Questions to prepare:

- Why separate schemas? Each service owns its data. Foreign keys are local; REST validates remote IDs.
- Why cross-schema SQL? A shared MySQL instance permits academic reporting while operational writes stay service-local.
- Why NOT IN/IN? They implement the requested EXCEPT/INTERSECT sets with widely supported MySQL syntax.
- Why DTOs? Validation and preventing clients setting internal checkpoints/IDs.
- Why BCrypt and signed tokens? One-way password verification and tamper-resistant identity/role.
- Why block before deduction? Conservative failure handling. A failed remote call must not allow unsafe milk.
- Why unique stock request keys? Network retry must not deduct twice.
- Why no distributed transaction? A local JPA transaction cannot commit several REST services atomically.
- Why inclusive end date? Explicit documented convention; tested at the boundary.
- What about old withdrawal milk? Always excluded from saleable yield.
- What needs improvement for production? Distributed per-animal locking, migrations, clock policies, pagination, reconciliation and secrets/account provisioning.

All demonstration doses and withdrawal values are sample academic data.
