-- ============================================
-- Expanding Hybrid Web App
-- Database Seed File
-- ============================================

USE riversideclinicdb;

-- ----------------------------
-- 1. Roles
-- ----------------------------
INSERT INTO Roles (Role_ID, Role_Name) VALUES
(1, 'Administrator'),
(2, 'Doctor'),
(3, 'Receptionist'),
(4, 'Nurse');

-- ----------------------------
-- 2. User Login Info
-- (Plain text passwords for development only)
-- ----------------------------
INSERT INTO User_Login_Info (User_ID, Username, Password_Hash, Created_At) VALUES
(1001, 'fernando', '$2y$10$s.L4k1E/fKYzBgwiXaz07eO1ar7zRbbpb8OMfPfBoM2ynd6hLvcrm', NOW()),
(1002, 'andrea', '$2y$10$0JuBIVw2.EcJYNFROH367O6SWCfCH7C5SRVUEUadNZZberlJNjJle', NOW()),
(1003, 'logan', '$2y$10$MF7CWzS/NLBDk3YrwYoUPOrkxvJkMbYnHxAuk9IrHcIqS.Blavcdy', NOW()),
(1004, 'reyna', '$2y$10$77YTa/2M9h.RXvdE7vvMN.Wt5CEcgz/YtwXSF6qVAuntBrvzZmesq', NOW()),
(1005, 'michael', '$2y$10$6NdPKJvbtPHQphd28GYGzu85wmilKB1mQIcFYd0Qz64zJvp2/5Pua', NOW());

-- ----------------------------
-- 3. Users
-- ----------------------------
INSERT INTO Users
(User_ID, First_Name, Last_Name, Role_ID, Phone_Number, Email, Roles_Role_ID, User_Login_Info_User_ID, Is_Disabled)
VALUES
(1001, 'Fernando', 'Doctor', 2, '555-0001', 'fernando@clinic.com', 2, 1001, 0),
(1002, 'Andrea', 'Receptionist', 3, '555-0002', 'andrea@clinic.com', 3, 1002, 0),
(1003, 'Logan', 'Nurse', 4, '555-0003', 'logan@clinic.com', 4, 1003, 0),
(1004, 'Reyna', 'Administrator', 1, '555-0004', 'reyna@clinic.com', 1, 1004, 0),
(1005, 'Michael', 'Phillips', 1, '555-0005', 'michael@clinic.com', 1, 1005, 0);

-- ============================================
-- End of Seed File
-- ============================================