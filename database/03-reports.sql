-- Unit 3: JOIN, SUBQUERY, WHERE, UNION, NOT IN (EXCEPT), IN (INTERSECT).
-- withdrawal
SELECT a.tag_number, u.name farmer, b.end_date FROM milk_db.withdrawal_blocks b JOIN user_animal_db.animals a ON a.id=b.animal_id JOIN user_animal_db.farmer_profiles f ON f.id=b.farmer_id JOIN user_animal_db.users u ON u.id=f.user_id WHERE CURRENT_DATE BETWEEN b.start_date AND b.end_date;

-- top-vets
SELECT v.id,v.name,AVG(r.score) average_rating FROM vet_db.ratings r JOIN vet_db.bookings b ON b.id=r.booking_id JOIN vet_db.service_listings s ON s.id=b.listing_id JOIN vet_db.vet_profiles v ON v.id=s.vet_id GROUP BY v.id,v.name HAVING AVG(r.score)>(SELECT AVG(score) FROM vet_db.ratings);

-- low-stock
SELECT id,name,stock,threshold,expiry_date FROM pharmacy_db.medicines WHERE stock<threshold;

-- attention
SELECT f.id,u.name FROM user_animal_db.farmer_profiles f JOIN user_animal_db.users u ON u.id=f.user_id JOIN vet_db.bookings b ON b.farmer_id=f.id WHERE b.status='PENDING' UNION SELECT f.id,u.name FROM user_animal_db.farmer_profiles f JOIN user_animal_db.users u ON u.id=f.user_id JOIN milk_db.withdrawal_blocks w ON w.farmer_id=f.id WHERE CURRENT_DATE BETWEEN w.start_date AND w.end_date;

-- unvaccinated
SELECT a.id,a.tag_number FROM user_animal_db.animals a WHERE a.id IN(SELECT b.animal_id FROM vet_db.treatments t JOIN vet_db.bookings b ON b.id=t.booking_id WHERE t.status='COMPLETED') AND a.id NOT IN(SELECT b.animal_id FROM vet_db.vaccinations v JOIN vet_db.bookings b ON b.id=v.booking_id WHERE v.stock_deducted=true);

-- treated-vaccinated
SELECT a.id,a.tag_number FROM user_animal_db.animals a WHERE a.id IN(SELECT b.animal_id FROM vet_db.treatments t JOIN vet_db.bookings b ON b.id=t.booking_id WHERE t.status='COMPLETED') AND a.id IN(SELECT b.animal_id FROM vet_db.vaccinations v JOIN vet_db.bookings b ON b.id=v.booking_id WHERE v.stock_deducted=true);
