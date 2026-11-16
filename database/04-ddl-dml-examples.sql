-- Unit 3: independent scratch table; safe to execute without changing ERP data.
USE user_animal_db;
CREATE TABLE IF NOT EXISTS syllabus_demo(id BIGINT PRIMARY KEY,label VARCHAR(60));
INSERT INTO syllabus_demo VALUES(1,'Initial entry');
ALTER TABLE syllabus_demo ADD COLUMN notes VARCHAR(100);
UPDATE syllabus_demo SET label='Updated entry' WHERE id=1;
SELECT * FROM syllabus_demo;
DELETE FROM syllabus_demo WHERE id=1;
DROP TABLE syllabus_demo;

