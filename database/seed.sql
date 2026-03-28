USE riversideclinicdb;

-- =========================
-- NOTE:
-- Changed to INSERT IGNORE so seed.sql can be run multiple times
-- without duplicate key errors
-- =========================
INSERT IGNORE INTO Roles (Role_ID, Role_Name) VALUES
(1, 'Administrator'),
(2, 'Doctor'),
(3, 'Receptionist'),
(4, 'Nurse');

-- =========================
-- NOTE:
-- Changed to INSERT IGNORE so rerunning seed.sql does not fail
-- if these seeded users already exist
-- =========================
INSERT IGNORE INTO Users
(User_ID, First_Name, Last_Name, Role_ID, Phone_Number, Email, Is_Disabled) VALUES
(1001, 'Fernando', 'Doctor', 2, '555-0001', 'fernando@clinic.com', 0),
(1002, 'Andrea', 'Receptionist', 3, '555-0002', 'andrea@clinic.com', 0),
(1003, 'Logan', 'Nurse', 4, '555-0003', 'logan@clinic.com', 0),
(1004, 'Reyna', 'Administrator', 1, '555-0004', 'reyna@clinic.com', 0),
(1005, 'Michael', 'Phillips', 1, '555-0005', 'michael@clinic.com', 0);

-- =========================
-- NOTE:
-- Changed to INSERT IGNORE so rerunning seed.sql does not fail
-- if these seeded login rows already exist
-- =========================
INSERT IGNORE INTO User_Login_Info (User_ID, Username, Password_Hash, Must_Change_Password, Password_Changed_At, Created_At) VALUES
(1001, 'fernando', '$2y$10$AhB5JENZpGrJ6CY/QcRG2O5ehqWfkzwwle05LwHc2QZawZ5oA6cWG', 0, NOW(), NOW()),
(1002, 'andrea', '$2y$10$.jyGfjaLWJAnGtWOU7uqjenWO3ly/535/2aGrymDlBgJoSDJEgxSW', 0, NOW(), NOW()),
(1003, 'logan', '$2y$10$KDAfkIhvURQAZN6NgIkzoOJVwKKYWilTiZ5wHzyx9klk2kDLe2VoS', 0, NOW(), NOW()),
(1004, 'reyna', '$2y$10$ZkxkygA2Vu5ZLAYpltSgFu0pWImICpoRBl0ml/LYPC59pwQAZ1t9W', 0, NOW(), NOW()),
(1005, 'michael', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', 0, NOW(), NOW());

-- =========================
-- TEST PATIENT FOR DOCTOR VIEW
-- NOTE:
-- Add this before the test appointment because Appointment uses Patient_ID 2001
-- =========================
INSERT INTO Patient
(Patient_ID, First_Name, Last_Name, Phone_Number, Email, Date_Of_Birth)
VALUES
(2001, 'Test', 'Patient', '555-1010', 'test.patient@clinic.com', '1995-06-15')
ON DUPLICATE KEY UPDATE
First_Name    = VALUES(First_Name),
Last_Name     = VALUES(Last_Name),
Phone_Number  = VALUES(Phone_Number),
Email         = VALUES(Email),
Date_Of_Birth = VALUES(Date_Of_Birth);
-- =========================
-- TEST APPOINTMENT FOR DOCTOR VIEW
-- NOTE:
-- Changed to a fixed sample appointment and made rerunnable
-- If you want this to appear on a specific day, update the date below
-- =========================
INSERT INTO Appointment
(Appointment_ID, Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
VALUES
(3001, 2001, 1001, '2026-03-24 09:00:00', '2026-03-24 09:30:00', 'CHECKED_IN')
ON DUPLICATE KEY UPDATE
Patient_ID       = VALUES(Patient_ID),
Provider_User_ID = VALUES(Provider_User_ID),
Scheduled_Start  = VALUES(Scheduled_Start),
Scheduled_End    = VALUES(Scheduled_End),
Status           = VALUES(Status);

