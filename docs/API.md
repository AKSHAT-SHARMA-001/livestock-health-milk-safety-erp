# REST API

Base path /api. Except auth, send Authorization: Bearer TOKEN. Server-to-server requests use X-Service-Key. JSON fields use camelCase. Validation: 400; missing: 404; unauthorized: 401; forbidden: 403; conflict/withdrawal: 409; REST dependency failure: 503.

## User/animal — 8081

| Method         | Path                        | Body / purpose                                                         |
| -------------- | --------------------------- | ---------------------------------------------------------------------- |
| POST           | /auth/register/farmer       | name,email,password,phone,village,address → farmer/profile/token (201) |
| POST           | /auth/login                 | email,password → userId,name,email,role,farmerId,token                 |
| GET            | /users                      | Admin lists users                                                      |
| GET            | /users/{id}                 | User lookup, no password serialization                                 |
| POST           | /users                      | Admin: name,email,password,role (VET/ADMIN),phone                      |
| PUT            | /users/{id}/phone           | Admin: phone                                                           |
| GET/POST       | /farmers/{farmerId}/animals | List/register: tagNumber,breed,age,healthStatus                        |
| GET/PUT/DELETE | /animals/{id}               | Read/update/delete; PUT uses animal fields                             |

## Vet — 8082

| Method   | Path                                       | Body / purpose                                                  |
| -------- | ------------------------------------------ | --------------------------------------------------------------- |
| GET/POST | /vets                                      | Profile: userId,name,specialization,phone                       |
| GET/POST | /services                                  | Listing: vetId,title,price,available                            |
| PATCH    | /services/{id}/availability?available=true | Enable/pause listing                                            |
| GET/POST | /bookings                                  | listingId,farmerId,animalId,appointmentDate                     |
| PATCH    | /bookings/{id}/status                      | status: ACCEPTED/REJECTED                                       |
| GET/POST | /treatments                                | bookingId,medicineId,dose,quantity,withdrawalDays,treatmentDate |
| POST     | /treatments/{id}/retry                     | Resume workflow; body {}                                        |
| GET/POST | /vaccinations                              | bookingId,medicineId,dose,quantity,vaccinationDate              |
| POST     | /vaccinations/{id}/retry                   | Resume stock deduction; body {}                                 |
| GET/POST | /ratings                                   | bookingId,score (1–5),comment                                   |

Only accepted bookings can receive treatment. Billing is the fee copied from the listing. One treatment and rating per booking.

## Pharmacy — 8083

| Method   | Path                          | Body / purpose                                                                           |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| GET      | /medicines or /medicines/{id} | Inventory                                                                                |
| POST/PUT | /medicines or /medicines/{id} | Admin: name,type (MEDICINE/VACCINE),antibiotic,withdrawalDays,stock,threshold,expiryDate |
| POST     | /stock/deduct                 | Internal only: requestKey,medicineId,quantity                                            |
| GET      | /reports/{name}               | Admin plain JDBC report                                                                  |

Names: withdrawal, top-vets, low-stock, attention, unvaccinated, treated-vaccinated. SQL is allowlisted; clients cannot submit arbitrary SQL.

## Milk — 8084

| Method   | Path                      | Body / purpose                                                     |
| -------- | ------------------------- | ------------------------------------------------------------------ |
| GET/POST | /milk-records             | animalId,farmerId,recordDate,litres                                |
| GET/POST | /milk-sales               | animalId,farmerId,litres,pricePerLitre; server saleDate            |
| GET      | /withdrawal-blocks        | Withdrawal history                                                 |
| POST     | /withdrawal-blocks        | Internal: treatmentId,animalId,farmerId,startDate,endDate,medicine |
| GET      | /animals/{id}/eligibility | allowed,remainingDays,endDate                                      |

Use the React forms for complete examples or read scripts/smoke-test.py for runnable HTTP requests. Positive quantities/prices are required; duplicate treatment IDs reuse their existing block.
