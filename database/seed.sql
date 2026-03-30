USE riversideclinicdb;

-- =========================
-- ROLES
-- =========================
INSERT IGNORE INTO Roles (Role_ID, Role_Name) VALUES
(1, 'Administrator'),
(2, 'Doctor'),
(3, 'Receptionist'),
(4, 'Nurse');

-- =========================
-- USERS
-- =========================
INSERT IGNORE INTO Users (User_ID, First_Name, Last_Name, Role_ID, Phone_Number, Email, Is_Disabled) VALUES
(1001, 'Fernando', 'Doctor', 2, '555-0001', 'fernando@clinic.com', 0),
(1002, 'Andrea', 'Receptionist', 3, '555-0002', 'andrea@clinic.com', 0),
(1003, 'Logan', 'Nurse', 4, '555-0003', 'logan@clinic.com', 0),
(1004, 'Reyna', 'Administrator', 1, '555-0004', 'reyna@clinic.com', 0),
(1005, 'Michael', 'Phillips', 1, '555-0005', 'michael@clinic.com', 0),

(1006, 'Emily', 'Carter', 2, '555-0106', 'emily.carter@clinic.com', 0),
(1007, 'James', 'Walker', 2, '555-0107', 'james.walker@clinic.com', 0),
(1008, 'Olivia', 'Hughes', 2, '555-0108', 'olivia.hughes@clinic.com', 0),
(1009, 'Noah', 'Bennett', 2, '555-0109', 'noah.bennett@clinic.com', 0),
(1010, 'Sophia', 'Reed', 2, '555-0110', 'sophia.reed@clinic.com', 0),

(1011, 'Ava', 'Brooks', 4, '555-0111', 'ava.brooks@clinic.com', 0),
(1012, 'Liam', 'Cooper', 4, '555-0112', 'liam.cooper@clinic.com', 0),
(1013, 'Mia', 'Foster', 4, '555-0113', 'mia.foster@clinic.com', 0),
(1014, 'Ethan', 'Price', 4, '555-0114', 'ethan.price@clinic.com', 0),
(1015, 'Grace', 'Kelly', 4, '555-0115', 'grace.kelly@clinic.com', 0);

-- =========================
-- LOGIN INFO
-- =========================
INSERT IGNORE INTO User_Login_Info
(User_ID, Username, Password_Hash, Must_Change_Password, Password_Changed_At, Created_At) VALUES
(1001, 'fernando', '$2y$10$AhB5JENZpGrJ6CY/QcRG2O5ehqWfkzwwle05LwHc2QZawZ5oA6cWG', 0, NOW(), NOW()),
(1002, 'andrea', '$2y$10$.jyGfjaLWJAnGtWOU7uqjenWO3ly/535/2aGrymDlBgJoSDJEgxSW', 0, NOW(), NOW()),
(1003, 'logan', '$2y$10$KDAfkIhvURQAZN6NgIkzoOJVwKKYWilTiZ5wHzyx9klk2kDLe2VoS', 0, NOW(), NOW()),
(1004, 'reyna', '$2y$10$ZkxkygA2Vu5ZLAYpltSgFu0pWImICpoRBl0ml/LYPC59pwQAZ1t9W', 0, NOW(), NOW()),
(1005, 'michael', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),

(1006, 'ecarter', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1007, 'jwalker', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1008, 'ohughes', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1009, 'nbennett', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1010, 'sreed', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),

(1011, 'abrooks', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1012, 'lcooper', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1013, 'mfoster', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1014, 'eprice', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW()),
(1015, 'gkelly', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW());

-- =========================
-- PATIENTS
-- =========================
INSERT INTO Patient (Patient_ID, First_Name, Last_Name, Phone_Number, Email, Date_Of_Birth) VALUES
(2001, 'Test', 'Patient', '555-1010', 'test.patient@clinic.com', '1995-06-15'),
(2016, 'Kevin', 'Thompson', '555-2016', 'kevin.thompson@email.com', '1988-05-11'),
(2017, 'Megan', 'Garcia', '555-2017', 'megan.garcia@email.com', '1997-08-29'),
(2018, 'Ryan', 'Martinez', '555-2018', 'ryan.martinez@email.com', '1984-03-03'),
(2019, 'Nicole', 'Robinson', '555-2019', 'nicole.robinson@email.com', '1995-11-16'),
(2020, 'Tyler', 'Clark', '555-2020', 'tyler.clark@email.com', '1986-01-27'),
(2021, 'Hannah', 'Rodriguez', '555-2021', 'hannah.rodriguez@email.com', '1999-06-06')
ON DUPLICATE KEY UPDATE First_Name=VALUES(First_Name);

-- =========================
-- APPOINTMENTS
-- =========================
INSERT INTO Appointment VALUES
(3001,2001,1001,'2026-03-24 09:00:00','2026-03-24 09:30:00','CHECKED_IN');

-- =========================
-- EXTRA APPOINTMENTS
-- =========================
INSERT INTO Appointment VALUES
(3016,2016,1008,'2026-03-27 09:00:00','2026-03-27 09:30:00','SCHEDULED'),
(3017,2017,1009,'2026-03-27 10:00:00','2026-03-27 10:30:00','CHECKED_IN'),
(3018,2018,1010,'2026-03-27 11:30:00','2026-03-27 12:00:00','COMPLETED'),
(3019,2019,1001,'2026-03-28 09:30:00','2026-03-28 10:00:00','SCHEDULED'),
(3020,2020,1006,'2026-03-28 13:30:00','2026-03-28 14:00:00','CANCELLED'),
(3021,2021,1007,'2026-03-29 10:30:00','2026-03-29 11:00:00','CHECKED_IN');

-- =========================
-- CLINIC HOURS
-- =========================
INSERT INTO Clinic_Hours VALUES
(NULL,1,0,NULL,NULL),
(NULL,2,1,'08:00:00','17:00:00'),
(NULL,3,1,'08:00:00','17:00:00'),
(NULL,4,1,'08:00:00','17:00:00'),
(NULL,5,1,'08:00:00','17:00:00'),
(NULL,6,1,'08:00:00','17:00:00'),
(NULL,7,1,'08:00:00','13:00:00');

-- =========================
-- PROVIDER SCHEDULE
-- =========================
INSERT INTO Provider_Schedule VALUES
(4001,1001,2,'08:00:00','12:00:00'),
(4002,1001,2,'13:00:00','17:00:00');
