-- Demo inventory only, not veterinary recommendations. Login accounts are seeded with BCrypt by user service.
USE pharmacy_db;
INSERT INTO medicines(name,type,antibiotic,withdrawal_days,stock,threshold,expiry_date)
SELECT 'Demo antibiotic','MEDICINE',true,3,100,10,'2030-12-31' WHERE NOT EXISTS(SELECT 1 FROM medicines WHERE name='Demo antibiotic');
INSERT INTO medicines(name,type,antibiotic,withdrawal_days,stock,threshold,expiry_date)
SELECT 'Demo vaccine','VACCINE',false,0,40,10,'2030-12-31' WHERE NOT EXISTS(SELECT 1 FROM medicines WHERE name='Demo vaccine');

