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
-- ROOMS
-- =========================
INSERT INTO Room (Room_ID, Room_Number, Room_Status) VALUES
(1, '101', 'AVAILABLE'),
(2, '102', 'AVAILABLE'),
(3, '103', 'AVAILABLE'),
(4, '104', 'AVAILABLE')
ON DUPLICATE KEY UPDATE
  Room_Number = VALUES(Room_Number),
  Room_Status = VALUES(Room_Status);

-- =========================
-- PATIENTS
-- =========================
INSERT INTO Patient
(Patient_ID, First_Name, Last_Name, Phone_Number, Email, Address_Line1, Address_Line2, City, State, Postal_Code, Date_Of_Birth)
VALUES
(2001, 'Test', 'Patient', '555-1010', 'test.patient@clinic.com', '101 Main St', NULL, 'Altus', 'OK', '73521', '1995-06-15'),
(2002, 'Aiden', 'Parker', '580-555-2001', 'aiden.parker@demo.com', '204 Cedar Ln', NULL, 'Altus', 'OK', '73521', '1988-01-14'),
(2003, 'Bella', 'Morgan', '580-555-2002', 'bella.morgan@demo.com', '315 Oak Ave', 'Apt 2', 'Altus', 'OK', '73521', '1992-02-19'),
(2004, 'Caleb', 'Reed', '580-555-2003', 'caleb.reed@demo.com', '98 Willow Dr', NULL, 'Altus', 'OK', '73521', '1979-03-23'),
(2005, 'Daisy', 'Collins', '580-555-2004', 'daisy.collins@demo.com', '440 Pine St', NULL, 'Altus', 'OK', '73521', '1995-04-08'),
(2006, 'Ethan', 'Brooks', '580-555-2005', 'ethan.brooks@demo.com', '119 Maple Rd', NULL, 'Altus', 'OK', '73521', '1984-05-27'),
(2007, 'Faith', 'Bennett', '580-555-2006', 'faith.bennett@demo.com', '501 Elm St', NULL, 'Altus', 'OK', '73521', '1991-06-12'),
(2008, 'Gavin', 'Hayes', '580-555-2007', 'gavin.hayes@demo.com', '77 Birch Ln', NULL, 'Altus', 'OK', '73521', '1986-07-02'),
(2009, 'Hazel', 'Ward', '580-555-2008', 'hazel.ward@demo.com', '600 Walnut Ave', NULL, 'Altus', 'OK', '73521', '1998-08-17'),
(2010, 'Isaac', 'Price', '580-555-2009', 'isaac.price@demo.com', '188 River Rd', NULL, 'Altus', 'OK', '73521', '1976-09-30'),
(2011, 'Jade', 'Cooper', '580-555-2010', 'jade.cooper@demo.com', '922 Lakeview Dr', NULL, 'Altus', 'OK', '73521', '1989-10-11'),
(2012, 'Kaden', 'Flores', '580-555-2011', 'kaden.flores@demo.com', '222 Hill St', NULL, 'Altus', 'OK', '73521', '1993-11-05'),
(2013, 'Lila', 'Murphy', '580-555-2012', 'lila.murphy@demo.com', '310 Sunset Blvd', NULL, 'Altus', 'OK', '73521', '1981-12-22'),
(2014, 'Mason', 'Rivera', '580-555-2013', 'mason.rivera@demo.com', '401 Adams St', NULL, 'Altus', 'OK', '73521', '1990-01-09'),
(2015, 'Nora', 'Cook', '580-555-2014', 'nora.cook@demo.com', '825 Frontier Trl', NULL, 'Altus', 'OK', '73521', '1987-02-25'),
(2016, 'Kevin', 'Thompson', '555-2016', 'kevin.thompson@email.com', '1616 Center St', NULL, 'Altus', 'OK', '73521', '1988-05-11'),
(2017, 'Megan', 'Garcia', '555-2017', 'megan.garcia@email.com', '1717 Center St', NULL, 'Altus', 'OK', '73521', '1997-08-29'),
(2018, 'Ryan', 'Martinez', '555-2018', 'ryan.martinez@email.com', '1818 Center St', NULL, 'Altus', 'OK', '73521', '1984-03-03'),
(2019, 'Nicole', 'Robinson', '555-2019', 'nicole.robinson@email.com', '1919 Center St', NULL, 'Altus', 'OK', '73521', '1995-11-16'),
(2020, 'Tyler', 'Clark', '555-2020', 'tyler.clark@email.com', '2020 Center St', NULL, 'Altus', 'OK', '73521', '1986-01-27'),
(2021, 'Hannah', 'Rodriguez', '555-2021', 'hannah.rodriguez@email.com', '2121 Center St', NULL, 'Altus', 'OK', '73521', '1999-06-06'),
(2022, 'Olivia', 'James', '555-2022', 'olivia.james@email.com', '2222 Center St', NULL, 'Altus', 'OK', '73521', '1991-10-14'),
(2023, 'Wyatt', 'Powell', '555-2023', 'wyatt.powell@email.com', '2323 Center St', NULL, 'Altus', 'OK', '73521', '1980-11-26'),
(2024, 'Ximena', 'Long', '555-2024', 'ximena.long@email.com', '2424 Center St', NULL, 'Altus', 'OK', '73521', '1995-12-07'),
(2025, 'Yara', 'Perry', '555-2025', 'yara.perry@email.com', '2525 Center St', NULL, 'Altus', 'OK', '73521', '1989-01-31'),
(2026, 'Zane', 'Kelly', '555-2026', 'zane.kelly@email.com', '2626 Center St', NULL, 'Altus', 'OK', '73521', '1977-02-13'),
(2027, 'Amara', 'Sanders', '555-2027', 'amara.sanders@email.com', '2727 Center St', NULL, 'Altus', 'OK', '73521', '1992-03-11'),
(2028, 'Blake', 'Coleman', '555-2028', 'blake.coleman@email.com', '2828 Center St', NULL, 'Altus', 'OK', '73521', '1986-04-19'),
(2029, 'Cora', 'Jenkins', '555-2029', 'cora.jenkins@email.com', '2929 Center St', NULL, 'Altus', 'OK', '73521', '1998-05-24'),
(2030, 'Declan', 'Foster', '555-2030', 'declan.foster@email.com', '3030 Center St', NULL, 'Altus', 'OK', '73521', '1984-06-09')
ON DUPLICATE KEY UPDATE
  First_Name = VALUES(First_Name),
  Last_Name = VALUES(Last_Name),
  Phone_Number = VALUES(Phone_Number),
  Email = VALUES(Email),
  Address_Line1 = VALUES(Address_Line1),
  Address_Line2 = VALUES(Address_Line2),
  City = VALUES(City),
  State = VALUES(State),
  Postal_Code = VALUES(Postal_Code),
  Date_Of_Birth = VALUES(Date_Of_Birth);

-- =========================
-- INSURANCE INFO
-- =========================
INSERT INTO Insurance_Info
(Insurance_ID, Patient_ID, Insurance_Provider, Policy_Number, Policy_Holder, Payment_Status, Date_Sent)
VALUES
(1, 2001, 'Blue Cross Blue Shield', 'BCBS-2001', 'Test Patient', 'PENDING', '2026-03-20'),
(2, 2002, 'Aetna', 'AET-2002', 'Aiden Parker', 'PENDING', '2026-03-20'),
(3, 2003, 'Cigna', 'CIG-2003', 'Bella Morgan', 'PAID', '2026-03-18'),
(4, 2004, 'UnitedHealthcare', 'UHC-2004', 'Caleb Reed', 'PENDING', '2026-03-19'),
(5, 2005, 'Humana', 'HUM-2005', 'Daisy Collins', 'UNPAID', '2026-03-21'),
(6, 2006, 'Aetna', 'AET-2006', 'Ethan Brooks', 'PENDING', '2026-03-21'),
(7, 2007, 'Blue Cross Blue Shield', 'BCBS-2007', 'Faith Bennett', 'PAID', '2026-03-17'),
(8, 2008, 'Cigna', 'CIG-2008', 'Gavin Hayes', 'UNPAID', '2026-03-22'),
(9, 2009, 'UnitedHealthcare', 'UHC-2009', 'Hazel Ward', 'PENDING', '2026-03-22'),
(10, 2010, 'Medicare', 'MCR-2010', 'Isaac Price', 'PAID', '2026-03-16')
ON DUPLICATE KEY UPDATE
  Insurance_Provider = VALUES(Insurance_Provider),
  Policy_Number = VALUES(Policy_Number),
  Policy_Holder = VALUES(Policy_Holder),
  Payment_Status = VALUES(Payment_Status),
  Date_Sent = VALUES(Date_Sent);

-- =========================
-- CLINIC HOURS
-- Weekdays through 11:59 PM
-- =========================
INSERT INTO Clinic_Hours (Clinic_Hours_ID, Day_Of_Week, Is_Open, Open_Time, Close_Time) VALUES
(1, 1, 0, NULL, NULL),
(2, 2, 1, '08:00:00', '23:59:00'),
(3, 3, 1, '08:00:00', '23:59:00'),
(4, 4, 1, '08:00:00', '23:59:00'),
(5, 5, 1, '08:00:00', '23:59:00'),
(6, 6, 1, '08:00:00', '23:59:00'),
(7, 7, 1, '08:00:00', '13:00:00')
ON DUPLICATE KEY UPDATE
  Is_Open = VALUES(Is_Open),
  Open_Time = VALUES(Open_Time),
  Close_Time = VALUES(Close_Time);

-- =========================
-- PROVIDER SCHEDULE
-- Fernando every day 8:00 AM - 11:59 PM
-- =========================
INSERT INTO Provider_Schedule (Schedule_ID, Provider_User_ID, Day_Of_The_Week, Start_Time, End_Time) VALUES
(4001, 1001, 1, '08:00:00', '23:59:00'),
(4002, 1001, 2, '08:00:00', '23:59:00'),
(4003, 1001, 3, '08:00:00', '23:59:00'),
(4004, 1001, 4, '08:00:00', '23:59:00'),
(4005, 1001, 5, '08:00:00', '23:59:00'),
(4006, 1001, 6, '08:00:00', '23:59:00'),
(4007, 1001, 7, '08:00:00', '23:59:00'),
(4010, 1006, 2, '08:00:00', '17:00:00'),
(4011, 1006, 3, '08:00:00', '17:00:00'),
(4012, 1006, 4, '08:00:00', '17:00:00'),
(4013, 1006, 5, '08:00:00', '17:00:00'),
(4014, 1006, 6, '08:00:00', '17:00:00'),
(4020, 1007, 2, '09:00:00', '15:00:00'),
(4021, 1007, 3, '09:00:00', '15:00:00'),
(4022, 1007, 4, '09:00:00', '15:00:00'),
(4023, 1007, 5, '09:00:00', '15:00:00'),
(4024, 1007, 6, '09:00:00', '13:00:00'),
(4030, 1008, 2, '10:00:00', '16:00:00'),
(4031, 1008, 3, '10:00:00', '16:00:00'),
(4032, 1008, 4, '10:00:00', '16:00:00'),
(4033, 1008, 5, '10:00:00', '16:00:00'),
(4034, 1008, 7, '08:00:00', '12:00:00'),
(4040, 1009, 2, '08:00:00', '12:00:00'),
(4041, 1009, 2, '13:00:00', '17:00:00'),
(4042, 1009, 4, '08:00:00', '12:00:00'),
(4043, 1009, 4, '13:00:00', '17:00:00'),
(4044, 1009, 6, '08:00:00', '12:00:00'),
(4045, 1009, 6, '13:00:00', '17:00:00'),
(4050, 1010, 3, '08:00:00', '12:00:00'),
(4051, 1010, 5, '08:00:00', '12:00:00'),
(4052, 1010, 7, '08:00:00', '13:00:00')
ON DUPLICATE KEY UPDATE
  Provider_User_ID = VALUES(Provider_User_ID),
  Day_Of_The_Week = VALUES(Day_Of_The_Week),
  Start_Time = VALUES(Start_Time),
  End_Time = VALUES(End_Time);

-- =========================
-- APPOINTMENTS
-- Fernando-heavy data for expanded testing
-- Includes tonight 11:30 PM and next 3 days at 11:30 PM
-- =========================
INSERT INTO Appointment
(Appointment_ID, Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
VALUES
(3001, 2001, 1001, '2026-03-24 09:00:00', '2026-03-24 09:30:00', 'CHECKED_IN'),
(3016, 2016, 1008, '2026-03-27 09:00:00', '2026-03-27 09:30:00', 'SCHEDULED'),
(3017, 2017, 1009, '2026-03-27 10:00:00', '2026-03-27 10:30:00', 'CHECKED_IN'),
(3018, 2018, 1010, '2026-03-27 11:30:00', '2026-03-27 12:00:00', 'COMPLETED'),
(3019, 2019, 1001, '2026-03-28 09:30:00', '2026-03-28 10:00:00', 'SCHEDULED'),
(3020, 2020, 1006, '2026-03-28 13:30:00', '2026-03-28 14:00:00', 'CANCELLED'),
(3021, 2021, 1007, '2026-03-29 10:30:00', '2026-03-29 11:00:00', 'CHECKED_IN'),

(3101, 2002, 1001, '2026-03-30 08:00:00', '2026-03-30 08:30:00', 'SCHEDULED'),
(3102, 2003, 1001, '2026-03-30 09:00:00', '2026-03-30 09:30:00', 'CHECKED_IN'),
(3103, 2004, 1001, '2026-03-30 10:00:00', '2026-03-30 10:30:00', 'READY_FOR_PROVIDER'),
(3104, 2005, 1001, '2026-03-30 11:00:00', '2026-03-30 11:30:00', 'COMPLETED'),
(3105, 2006, 1001, '2026-03-30 13:00:00', '2026-03-30 13:30:00', 'SCHEDULED'),
(3106, 2007, 1001, '2026-03-30 14:30:00', '2026-03-30 15:00:00', 'CHECKED_IN'),
(3107, 2008, 1001, '2026-03-30 16:00:00', '2026-03-30 16:30:00', 'READY_FOR_PROVIDER'),
(3108, 2009, 1001, '2026-03-30 17:30:00', '2026-03-30 18:00:00', 'NO_SHOW'),
(3109, 2010, 1001, '2026-03-30 19:00:00', '2026-03-30 19:30:00', 'CANCELLED'),
(3110, 2011, 1001, '2026-03-30 23:30:00', '2026-03-30 23:59:00', 'SCHEDULED'),

(3111, 2012, 1001, '2026-03-31 08:00:00', '2026-03-31 08:30:00', 'CHECKED_IN'),
(3112, 2013, 1001, '2026-03-31 09:30:00', '2026-03-31 10:00:00', 'READY_FOR_PROVIDER'),
(3113, 2014, 1001, '2026-03-31 11:00:00', '2026-03-31 11:30:00', 'COMPLETED'),
(3114, 2015, 1001, '2026-03-31 13:00:00', '2026-03-31 13:30:00', 'SCHEDULED'),
(3115, 2016, 1001, '2026-03-31 15:00:00', '2026-03-31 15:30:00', 'CHECKED_IN'),
(3116, 2017, 1001, '2026-03-31 17:00:00', '2026-03-31 17:30:00', 'READY_FOR_PROVIDER'),
(3117, 2018, 1001, '2026-03-31 20:00:00', '2026-03-31 20:30:00', 'SCHEDULED'),
(3118, 2019, 1001, '2026-03-31 23:30:00', '2026-03-31 23:59:00', 'CHECKED_IN'),

(3119, 2020, 1001, '2026-04-01 08:30:00', '2026-04-01 09:00:00', 'READY_FOR_PROVIDER'),
(3120, 2021, 1001, '2026-04-01 10:00:00', '2026-04-01 10:30:00', 'COMPLETED'),
(3121, 2022, 1001, '2026-04-01 12:00:00', '2026-04-01 12:30:00', 'SCHEDULED'),
(3122, 2023, 1001, '2026-04-01 14:00:00', '2026-04-01 14:30:00', 'CHECKED_IN'),
(3123, 2024, 1001, '2026-04-01 16:00:00', '2026-04-01 16:30:00', 'READY_FOR_PROVIDER'),
(3124, 2025, 1001, '2026-04-01 18:00:00', '2026-04-01 18:30:00', 'SCHEDULED'),
(3125, 2026, 1001, '2026-04-01 21:00:00', '2026-04-01 21:30:00', 'CHECKED_IN'),
(3126, 2027, 1001, '2026-04-01 23:30:00', '2026-04-01 23:59:00', 'READY_FOR_PROVIDER'),

(3127, 2028, 1001, '2026-04-02 08:00:00', '2026-04-02 08:30:00', 'COMPLETED'),
(3128, 2029, 1001, '2026-04-02 09:30:00', '2026-04-02 10:00:00', 'SCHEDULED'),
(3129, 2030, 1001, '2026-04-02 11:00:00', '2026-04-02 11:30:00', 'CHECKED_IN'),
(3130, 2001, 1001, '2026-04-02 13:00:00', '2026-04-02 13:30:00', 'READY_FOR_PROVIDER'),
(3131, 2002, 1001, '2026-04-02 15:00:00', '2026-04-02 15:30:00', 'COMPLETED'),
(3132, 2003, 1001, '2026-04-02 18:00:00', '2026-04-02 18:30:00', 'SCHEDULED'),
(3133, 2004, 1001, '2026-04-02 20:30:00', '2026-04-02 21:00:00', 'CHECKED_IN'),
(3134, 2005, 1001, '2026-04-02 23:30:00', '2026-04-02 23:59:00', 'COMPLETED'),

(3135, 2006, 1001, '2026-04-03 08:00:00', '2026-04-03 08:30:00', 'SCHEDULED'),
(3136, 2007, 1001, '2026-04-03 09:00:00', '2026-04-03 09:30:00', 'CHECKED_IN'),
(3137, 2008, 1001, '2026-04-03 10:00:00', '2026-04-03 10:30:00', 'READY_FOR_PROVIDER'),
(3138, 2009, 1001, '2026-04-03 11:00:00', '2026-04-03 11:30:00', 'COMPLETED'),
(3139, 2010, 1001, '2026-04-03 13:30:00', '2026-04-03 14:00:00', 'SCHEDULED'),
(3140, 2011, 1001, '2026-04-03 15:00:00', '2026-04-03 15:30:00', 'CHECKED_IN'),
(3141, 2012, 1001, '2026-04-03 17:00:00', '2026-04-03 17:30:00', 'READY_FOR_PROVIDER'),
(3142, 2013, 1001, '2026-04-03 22:30:00', '2026-04-03 23:00:00', 'SCHEDULED')
ON DUPLICATE KEY UPDATE
  Patient_ID = VALUES(Patient_ID),
  Provider_User_ID = VALUES(Provider_User_ID),
  Scheduled_Start = VALUES(Scheduled_Start),
  Scheduled_End = VALUES(Scheduled_End),
  Status = VALUES(Status);

-- =========================
-- VISITS FOR QUEUE TESTING
-- =========================
INSERT INTO Visit
(Visit_ID, Created_By_User_ID, Appointment_ID, Patient_ID, Provider_User_ID, Room_ID, Visit_Date_Time, Doctor_Case_Status)
VALUES
(5001, 1003, 3001, 2001, 1001, 1, '2026-03-24 09:05:00', 'OPEN'),
(5002, 1003, 3102, 2003, 1001, 2, '2026-03-30 09:05:00', 'OPEN'),
(5003, 1003, 3103, 2004, 1001, 3, '2026-03-30 10:05:00', 'READY_FOR_PROVIDER'),
(5004, 1003, 3104, 2005, 1001, 4, '2026-03-30 11:05:00', 'COMPLETED'),
(5005, 1003, 3106, 2007, 1001, 1, '2026-03-30 14:35:00', 'IN_PROGRESS'),
(5006, 1003, 3111, 2012, 1001, 2, '2026-03-31 08:05:00', 'OPEN'),
(5007, 1003, 3112, 2013, 1001, 3, '2026-03-31 09:35:00', 'READY_FOR_PROVIDER'),
(5008, 1003, 3113, 2014, 1001, 4, '2026-03-31 11:05:00', 'COMPLETED'),
(5009, 1003, 3115, 2016, 1001, 1, '2026-03-31 15:05:00', 'OPEN'),
(5010, 1003, 3116, 2017, 1001, 2, '2026-03-31 17:05:00', 'READY_FOR_PROVIDER'),
(5011, 1003, 3118, 2019, 1001, 3, '2026-03-31 23:35:00', 'IN_PROGRESS'),
(5012, 1003, 3119, 2020, 1001, 4, '2026-04-01 08:35:00', 'READY_FOR_PROVIDER'),
(5013, 1003, 3120, 2021, 1001, 1, '2026-04-01 10:05:00', 'COMPLETED'),
(5014, 1003, 3122, 2023, 1001, 2, '2026-04-01 14:05:00', 'OPEN'),
(5015, 1003, 3123, 2024, 1001, 3, '2026-04-01 16:05:00', 'READY_FOR_PROVIDER'),
(5016, 1003, 3125, 2026, 1001, 4, '2026-04-01 21:05:00', 'IN_PROGRESS'),
(5017, 1003, 3126, 2027, 1001, 1, '2026-04-01 23:35:00', 'READY_FOR_PROVIDER'),
(5018, 1003, 3129, 2030, 1001, 2, '2026-04-02 11:05:00', 'OPEN'),
(5019, 1003, 3130, 2001, 1001, 3, '2026-04-02 13:05:00', 'READY_FOR_PROVIDER'),
(5020, 1003, 3131, 2002, 1001, 4, '2026-04-02 15:05:00', 'COMPLETED'),
(5021, 1003, 3133, 2004, 1001, 1, '2026-04-02 20:35:00', 'IN_PROGRESS'),
(5022, 1003, 3134, 2005, 1001, 2, '2026-04-02 23:35:00', 'COMPLETED')
ON DUPLICATE KEY UPDATE
  Created_By_User_ID = VALUES(Created_By_User_ID),
  Appointment_ID = VALUES(Appointment_ID),
  Patient_ID = VALUES(Patient_ID),
  Provider_User_ID = VALUES(Provider_User_ID),
  Room_ID = VALUES(Room_ID),
  Visit_Date_Time = VALUES(Visit_Date_Time),
  Doctor_Case_Status = VALUES(Doctor_Case_Status);

-- =========================
-- VISIT EXAM
-- =========================
INSERT INTO Visit_Exam
(Visit_ID, Nurse_Intake_Note, Doctor_Exam_Note, Blood_Pressure, Pulse, Respiration, Temperature, Oxygen_Saturation, Height, Weight, Pain_Level, Updated_By_User_ID)
VALUES
(5001, 'Checked in for baseline testing.', NULL, '122/80', '74', '16', '98.4', '99%', '5''9"', '165 lb', '2', 1003),
(5002, 'Complains of sinus pressure.', NULL, '130/84', '78', '16', '98.9', '98%', '5''6"', '152 lb', '4', 1003),
(5003, 'Vitals complete and ready for provider.', NULL, '126/82', '76', '15', '98.6', '99%', '5''11"', '180 lb', '3', 1003),
(5005, 'Cough and sore throat.', NULL, '134/86', '82', '18', '99.1', '97%', '5''8"', '171 lb', '5', 1003),
(5007, 'Recheck after medication change.', NULL, '118/74', '70', '14', '98.1', '99%', '5''7"', '149 lb', '1', 1003),
(5010, 'Intake complete for evening slot.', NULL, '128/80', '77', '16', '98.5', '98%', '5''10"', '188 lb', '2', 1003),
(5015, 'Headache and fatigue.', NULL, '136/88', '84', '18', '99.0', '97%', '5''5"', '143 lb', '6', 1003),
(5017, 'Late-night testing visit.', NULL, '124/78', '73', '15', '98.3', '99%', '5''9"', '160 lb', '2', 1003),
(5019, 'Ready after intake and medication review.', NULL, '120/76', '72', '15', '98.2', '99%', '5''10"', '167 lb', '1', 1003)
ON DUPLICATE KEY UPDATE
  Nurse_Intake_Note = VALUES(Nurse_Intake_Note),
  Doctor_Exam_Note = VALUES(Doctor_Exam_Note),
  Blood_Pressure = VALUES(Blood_Pressure),
  Pulse = VALUES(Pulse),
  Respiration = VALUES(Respiration),
  Temperature = VALUES(Temperature),
  Oxygen_Saturation = VALUES(Oxygen_Saturation),
  Height = VALUES(Height),
  Weight = VALUES(Weight),
  Pain_Level = VALUES(Pain_Level),
  Updated_By_User_ID = VALUES(Updated_By_User_ID);

-- =========================
-- VISIT MEDICATION
-- =========================
INSERT INTO Visit_Medication
(Visit_ID, Current_Medications, Medication_Changes, Medication_Notes, Updated_By_User_ID)
VALUES
(5001, 'None', 'None', 'No medications reported.', 1003),
(5002, 'Cetirizine', 'None', 'Using OTC allergy medication.', 1003),
(5003, 'Metformin', 'None', 'Medication confirmed.', 1003),
(5005, 'Albuterol inhaler', 'None', 'Uses as needed.', 1003),
(5007, 'Levothyroxine', 'Dose adjusted last month', 'Patient reports doing well.', 1003),
(5010, 'Lisinopril', 'None', 'No missed doses.', 1003),
(5015, 'Omeprazole', 'None', 'No issues reported.', 1003),
(5017, 'Sertraline', 'None', 'Stable on current dose.', 1003),
(5019, 'Hydrochlorothiazide', 'None', 'May need refill soon.', 1003)
ON DUPLICATE KEY UPDATE
  Current_Medications = VALUES(Current_Medications),
  Medication_Changes = VALUES(Medication_Changes),
  Medication_Notes = VALUES(Medication_Notes),
  Updated_By_User_ID = VALUES(Updated_By_User_ID);

-- =========================
-- BILLING FOR COMPLETED VISITS
-- =========================
INSERT INTO Billing (Billing_ID, Visit_ID, Amount, Status) VALUES
(6001, 5004, 125.00, 'PAID'),
(6002, 5008, 95.00, 'UNPAID'),
(6003, 5013, 140.00, 'PAID'),
(6004, 5020, 110.00, 'PENDING'),
(6005, 5022, 85.00, 'UNPAID')
ON DUPLICATE KEY UPDATE
  Visit_ID = VALUES(Visit_ID),
  Amount = VALUES(Amount),
  Status = VALUES(Status);
