-- ============================================
-- Expanding Hybrid Web App
-- Database Seed File
-- ============================================

USE riversideclinicdb;

-- ----------------------------
-- 1. Roles
-- ----------------------------
INSERT INTO Roles (Role_ID, Role_Name) VALUES
(1, 'Admin'),
(2, 'Doctor'),
(3, 'Receptionist'),
(4, 'Nurse');

-- ----------------------------
-- 2. User Login Info
-- (Plain text passwords for development only)
-- ----------------------------
INSERT INTO User_Login_Info (User_ID, Username, Password_Hash, Created_At) VALUES
(1001, 'fernando', 'Doctor123!', NOW()),
(1002, 'andrea', 'Reception123!', NOW()),
(1003, 'logan', 'Nurse123!', NOW()),
(1004, 'reyna', 'Admin123!', NOW());

-- ----------------------------
-- 3. Users
-- ----------------------------
INSERT INTO Users
(User_ID, First_Name, Last_Name, Role_ID, Phone_Number, Email,
 Roles_Role_ID, User_Login_Info_User_ID, Is_Disabled)
VALUES
(1001, 'Fernando', 'Doctor', 2, '555-0001', 'fernando@clinic.com', 2, 1001, 0),
(1002, 'Andrea', 'Receptionist', 3, '555-0002', 'andrea@clinic.com', 3, 1002, 0),
(1003, 'Logan', 'Nurse', 4, '555-0003', 'logan@clinic.com', 4, 1003, 0),
(1004, 'Reyna', 'Administrator', 1, '555-0004', 'reyna@clinic.com', 1, 1004, 0);

-- ============================================
-- End of Seed File
-- ============================================