-- Unit 3: MySQL 8 schema ownership. Cross-service IDs are logical references, not foreign keys.
CREATE DATABASE IF NOT EXISTS user_animal_db;
CREATE DATABASE IF NOT EXISTS vet_db;
CREATE DATABASE IF NOT EXISTS pharmacy_db;
CREATE DATABASE IF NOT EXISTS milk_db;
USE user_animal_db;
CREATE TABLE IF NOT EXISTS users(id BIGINT PRIMARY KEY AUTO_INCREMENT,name VARCHAR(255) NOT NULL,email VARCHAR(255) NOT NULL UNIQUE,password VARCHAR(255) NOT NULL,role ENUM('FARMER','VET','ADMIN') NOT NULL,phone VARCHAR(255));
CREATE TABLE IF NOT EXISTS farmer_profiles(id BIGINT PRIMARY KEY AUTO_INCREMENT,user_id BIGINT NOT NULL UNIQUE,village VARCHAR(255),address VARCHAR(255),FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS animals(id BIGINT PRIMARY KEY AUTO_INCREMENT,tag_number VARCHAR(255) NOT NULL UNIQUE,breed VARCHAR(255),age INT NOT NULL,health_status VARCHAR(255),farmer_id BIGINT NOT NULL,FOREIGN KEY(farmer_id) REFERENCES farmer_profiles(id));
USE vet_db;
CREATE TABLE IF NOT EXISTS vet_profiles(id BIGINT PRIMARY KEY AUTO_INCREMENT,user_id BIGINT NOT NULL UNIQUE,name VARCHAR(255) NOT NULL,specialization VARCHAR(255),phone VARCHAR(255));
CREATE TABLE IF NOT EXISTS service_listings(id BIGINT PRIMARY KEY AUTO_INCREMENT,vet_id BIGINT NOT NULL,title VARCHAR(255) NOT NULL,price DECIMAL(12,2) NOT NULL,available BIT NOT NULL,FOREIGN KEY(vet_id) REFERENCES vet_profiles(id));
CREATE TABLE IF NOT EXISTS bookings(id BIGINT PRIMARY KEY AUTO_INCREMENT,listing_id BIGINT NOT NULL,farmer_id BIGINT NOT NULL,animal_id BIGINT NOT NULL,appointment_date DATE,status VARCHAR(255),fee DECIMAL(12,2),FOREIGN KEY(listing_id) REFERENCES service_listings(id));
CREATE TABLE IF NOT EXISTS treatments(id BIGINT PRIMARY KEY AUTO_INCREMENT,booking_id BIGINT NOT NULL UNIQUE,medicine_id BIGINT,medicine VARCHAR(255),dose VARCHAR(255),quantity INT NOT NULL,antibiotic BIT NOT NULL,withdrawal_days INT NOT NULL,treatment_date DATE,end_date DATE,block_created BIT NOT NULL,stock_deducted BIT NOT NULL,status VARCHAR(255),FOREIGN KEY(booking_id) REFERENCES bookings(id));
CREATE TABLE IF NOT EXISTS vaccinations(id BIGINT PRIMARY KEY AUTO_INCREMENT,booking_id BIGINT NOT NULL,medicine_id BIGINT,vaccine VARCHAR(255),dose VARCHAR(255),quantity INT NOT NULL,vaccination_date DATE,stock_deducted BIT NOT NULL,FOREIGN KEY(booking_id) REFERENCES bookings(id));
CREATE TABLE IF NOT EXISTS ratings(id BIGINT PRIMARY KEY AUTO_INCREMENT,booking_id BIGINT NOT NULL UNIQUE,score INT NOT NULL,comment VARCHAR(255),FOREIGN KEY(booking_id) REFERENCES bookings(id));
USE pharmacy_db;
CREATE TABLE IF NOT EXISTS medicines(id BIGINT PRIMARY KEY AUTO_INCREMENT,name VARCHAR(255) NOT NULL,type VARCHAR(255),antibiotic BIT NOT NULL,withdrawal_days INT NOT NULL,stock INT NOT NULL,threshold INT NOT NULL,expiry_date DATE);
CREATE TABLE IF NOT EXISTS stock_movements(id BIGINT PRIMARY KEY AUTO_INCREMENT,request_key VARCHAR(255) NOT NULL UNIQUE,medicine_id BIGINT NOT NULL,quantity INT NOT NULL,created_at DATETIME(6),FOREIGN KEY(medicine_id) REFERENCES medicines(id));
USE milk_db;
CREATE TABLE IF NOT EXISTS milk_records(id BIGINT PRIMARY KEY AUTO_INCREMENT,animal_id BIGINT,farmer_id BIGINT,record_date DATE,litres DECIMAL(12,3));
CREATE TABLE IF NOT EXISTS milk_sales(id BIGINT PRIMARY KEY AUTO_INCREMENT,animal_id BIGINT,farmer_id BIGINT,sale_date DATE,litres DECIMAL(12,3),price_per_litre DECIMAL(12,2));
CREATE TABLE IF NOT EXISTS withdrawal_blocks(id BIGINT PRIMARY KEY AUTO_INCREMENT,treatment_id BIGINT NOT NULL UNIQUE,animal_id BIGINT,farmer_id BIGINT,start_date DATE,end_date DATE,medicine VARCHAR(255),INDEX idx_block_animal(animal_id,start_date,end_date));
USE user_animal_db;

