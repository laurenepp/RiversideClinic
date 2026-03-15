INSERT INTO Roles (Role_ID, Role_Name) VALUES
(1, 'Admin'),
(2, 'Doctor'),
(3, 'Receptionist'),
(4, 'Nurse');


INSERT INTO Users
(User_ID, First_Name, Last_Name, Role_ID, Phone_Number, Email, Is_Disabled) VALUES
(1001, 'Fernando', 'Doctor', 2, '555-0001', 'fernando@clinic.com', 0),
(1002, 'Andrea', 'Receptionist', 3, '555-0002', 'andrea@clinic.com', 0),
(1003, 'Logan', 'Nurse', 4, '555-0003', 'logan@clinic.com', 0),
(1004, 'Reyna', 'Administrator', 1, '555-0004', 'reyna@clinic.com', 0);


INSERT INTO User_Login_Info (User_ID, Username, Password_Hash, Created_At) VALUES
(1001, 'fernando', '$2y$10$AhB5JENZpGrJ6CY/QcRG2O5ehqWfkzwwle05LwHc2QZawZ5oA6cWG', NOW()),
(1002, 'andrea', '$2y$10$.jyGfjaLWJAnGtWOU7uqjenWO3ly/535/2aGrymDlBgJoSDJEgxSW', NOW()),
(1003, 'logan', '$2y$10$KDAfkIhvURQAZN6NgIkzoOJVwKKYWilTiZ5wHzyx9klk2kDLe2VoS', NOW()),
(1004, 'reyna', '$2y$10$ZkxkygA2Vu5ZLAYpltSgFu0pWImICpoRBl0ml/LYPC59pwQAZ1t9W', NOW());
