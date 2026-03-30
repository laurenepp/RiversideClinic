DROP DATABASE IF EXISTS riversideclinicdb;
CREATE DATABASE riversideclinicdb;
USE riversideclinicdb;

SET NAMES utf8mb4;

-- =========================
-- Core Access Control
-- =========================

CREATE TABLE `Roles` (
  `Role_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Role_Name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`Role_ID`),
  UNIQUE KEY `uk_Roles_Role_Name` (`Role_Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Permissions` (
  `Role_ID` BIGINT NOT NULL,
  `Table_Name` VARCHAR(50) NOT NULL,
  `Can_View` BOOLEAN NOT NULL DEFAULT FALSE,
  `Can_Edit` BOOLEAN NOT NULL DEFAULT FALSE,
  `Can_Delete` BOOLEAN NOT NULL DEFAULT FALSE,
  `Can_Add` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`Role_ID`, `Table_Name`),
  CONSTRAINT `fk_Permissions_Roles`
    FOREIGN KEY (`Role_ID`) REFERENCES `Roles` (`Role_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Users + Login
-- =========================

CREATE TABLE `Users` (
  `User_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `First_Name` VARCHAR(128) NOT NULL,
  `Last_Name` VARCHAR(128) NOT NULL,
  `Role_ID` BIGINT NOT NULL,
  `Phone_Number` VARCHAR(20) NULL,
  `Email` VARCHAR(255) NOT NULL,
  `Is_Disabled` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`User_ID`),
  UNIQUE KEY `uk_User_Email` (`Email`),
  KEY `idx_User_Role_ID` (`Role_ID`),
  CONSTRAINT `fk_User_Roles`
    FOREIGN KEY (`Role_ID`) REFERENCES `Roles` (`Role_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `User_Login_Info` (
  `User_ID` BIGINT NOT NULL,
  `Username` VARCHAR(64) NOT NULL,
  `Password_Hash` VARCHAR(255) NOT NULL,
  `Must_Change_Password` TINYINT(1) NOT NULL DEFAULT 1,
  `Password_Changed_At` DATETIME NULL,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`User_ID`),
  UNIQUE KEY `uk_User_Login_Info_Username` (`Username`),
  CONSTRAINT `fk_User_Login_Info_User`
    FOREIGN KEY (`User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Patients + Related
-- =========================

CREATE TABLE `Patient` (
  `Patient_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `First_Name` VARCHAR(128) NOT NULL,
  `Last_Name` VARCHAR(128) NOT NULL,
  `Phone_Number` VARCHAR(20) NULL,
  `Email` VARCHAR(255) NULL,
  `Date_Of_Birth` DATE NOT NULL,
  PRIMARY KEY (`Patient_ID`),
  KEY `idx_Patient_Last_Name` (`Last_Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Emergency_Contact` (
  `Emergency_Contact_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `First_Name` VARCHAR(128) NOT NULL,
  `Last_Name` VARCHAR(128) NOT NULL,
  `Phone_Number` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`Emergency_Contact_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Patient_Emergency_Contacts` (
  `Patient_ID` BIGINT NOT NULL,
  `Emergency_Contact_ID` BIGINT NOT NULL,
  `Relationship_To_Patient` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`Patient_ID`, `Emergency_Contact_ID`),
  KEY `idx_PEC_Emergency_Contact_ID` (`Emergency_Contact_ID`),
  CONSTRAINT `fk_PEC_Patient`
    FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_PEC_Emergency_Contact`
    FOREIGN KEY (`Emergency_Contact_ID`) REFERENCES `Emergency_Contact` (`Emergency_Contact_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Insurance_Info` (
  `Insurance_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Patient_ID` BIGINT NOT NULL,
  `Insurance_Provider` VARCHAR(255) NOT NULL,
  `Payment_Status` VARCHAR(30) NOT NULL,
  `Date_Sent` DATE NOT NULL,
  PRIMARY KEY (`Insurance_ID`),
  KEY `idx_Insurance_Info_Patient_ID` (`Patient_ID`),
  CONSTRAINT `fk_Insurance_Info_Patient`
    FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Rooms
-- =========================

CREATE TABLE `Room` (
  `Room_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Room_Number` VARCHAR(20) NOT NULL,
  `Room_Status` VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`Room_ID`),
  UNIQUE KEY `uk_Room_Room_Number` (`Room_Number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Clinic Hours
-- =========================

CREATE TABLE `Clinic_Hours` (
  `Clinic_Hours_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Day_Of_Week` TINYINT NOT NULL,
  `Is_Open` TINYINT(1) NOT NULL DEFAULT 1,
  `Open_Time` TIME NULL,
  `Close_Time` TIME NULL,
  PRIMARY KEY (`Clinic_Hours_ID`),
  UNIQUE KEY `uk_Clinic_Hours_Day_Of_Week` (`Day_Of_Week`),
  CONSTRAINT `chk_Clinic_Hours_Day_Of_Week`
    CHECK (`Day_Of_Week` BETWEEN 1 AND 7),
  CONSTRAINT `chk_Clinic_Hours_Time_Range`
    CHECK (
      (`Is_Open` = 0 AND `Open_Time` IS NULL AND `Close_Time` IS NULL)
      OR
      (`Is_Open` = 1 AND `Open_Time` IS NOT NULL AND `Close_Time` IS NOT NULL AND `Open_Time` < `Close_Time`)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Scheduling
-- =========================

CREATE TABLE `Provider_Schedule` (
  `Schedule_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Provider_User_ID` BIGINT NOT NULL,
  `Day_Of_The_Week` TINYINT NOT NULL,
  `Start_Time` TIME NOT NULL,
  `End_Time` TIME NOT NULL,
  PRIMARY KEY (`Schedule_ID`),
  KEY `idx_Provider_Schedule_Provider_User_ID` (`Provider_User_ID`),
  CONSTRAINT `fk_Provider_Schedule_Provider`
    FOREIGN KEY (`Provider_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `chk_Provider_Schedule_Day_Of_The_Week`
    CHECK (`Day_Of_The_Week` BETWEEN 1 AND 7),
  CONSTRAINT `chk_Provider_Schedule_Time_Range`
    CHECK (`Start_Time` < `End_Time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Appointment` (
  `Appointment_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Patient_ID` BIGINT NOT NULL,
  `Provider_User_ID` BIGINT NOT NULL,
  `Scheduled_Start` DATETIME NOT NULL,
  `Scheduled_End` DATETIME NOT NULL,
  `Status` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`Appointment_ID`),
  KEY `idx_Appointment_Patient_ID` (`Patient_ID`),
  KEY `idx_Appointment_Provider_User_ID` (`Provider_User_ID`),
  KEY `idx_Appointment_Provider_Time` (`Provider_User_ID`, `Scheduled_Start`, `Scheduled_End`),
  CONSTRAINT `fk_Appointment_Patient`
    FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_Appointment_Provider`
    FOREIGN KEY (`Provider_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `chk_Appointment_Time_Range`
    CHECK (`Scheduled_Start` < `Scheduled_End`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Clinic Hours
-- =========================

CREATE TABLE `Clinic_Hours` (
  `Clinic_Hours_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Day_Of_Week` TINYINT NOT NULL,
  `Is_Open` TINYINT(1) NOT NULL DEFAULT 1,
  `Open_Time` TIME NULL,
  `Close_Time` TIME NULL,
  PRIMARY KEY (`Clinic_Hours_ID`),
  UNIQUE KEY `uk_Clinic_Hours_Day_Of_Week` (`Day_Of_Week`),
  CONSTRAINT `chk_Clinic_Hours_Day_Of_Week`
    CHECK (`Day_Of_Week` BETWEEN 1 AND 7),
  CONSTRAINT `chk_Clinic_Hours_Time_Range`
    CHECK (
      (`Is_Open` = 0 AND `Open_Time` IS NULL AND `Close_Time` IS NULL)
      OR
      (`Is_Open` = 1 AND `Open_Time` IS NOT NULL AND `Close_Time` IS NOT NULL AND `Open_Time` < `Close_Time`)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Visits + Notes + Workflow
-- =========================

CREATE TABLE `Visit` (
  `Visit_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Created_By_User_ID` BIGINT NOT NULL,
  `Appointment_ID` BIGINT NULL,
  `Patient_ID` BIGINT NOT NULL,
  `Provider_User_ID` BIGINT NOT NULL,
  `Room_ID` BIGINT NULL,
  `Visit_Date_Time` DATETIME NOT NULL,
  `Doctor_Case_Status` VARCHAR(20) NULL,
  PRIMARY KEY (`Visit_ID`),
  KEY `idx_Visit_Created_By_User_ID` (`Created_By_User_ID`),
  KEY `idx_Visit_Appointment_ID` (`Appointment_ID`),
  KEY `idx_Visit_Patient_ID` (`Patient_ID`),
  KEY `idx_Visit_Provider_User_ID` (`Provider_User_ID`),
  KEY `idx_Visit_Room_ID` (`Room_ID`),
  CONSTRAINT `fk_Visit_Created_By_User`
    FOREIGN KEY (`Created_By_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Visit_Appointment`
    FOREIGN KEY (`Appointment_ID`) REFERENCES `Appointment` (`Appointment_ID`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_Visit_Patient`
    FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Visit_Provider`
    FOREIGN KEY (`Provider_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Visit_Room`
    FOREIGN KEY (`Room_ID`) REFERENCES `Room` (`Room_ID`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Visit_Notes` (
  `Note_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Visit_ID` BIGINT NOT NULL,
  `Created_By_User_ID` BIGINT NOT NULL,
  `Visit_Note` TEXT NOT NULL,
  `Note_Date_Time` DATETIME NOT NULL,
  PRIMARY KEY (`Note_ID`),
  KEY `idx_Visit_Notes_Visit_ID` (`Visit_ID`),
  KEY `idx_Visit_Notes_Created_By_User_ID` (`Created_By_User_ID`),
  CONSTRAINT `fk_Visit_Notes_Visit`
    FOREIGN KEY (`Visit_ID`) REFERENCES `Visit` (`Visit_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_Visit_Notes_Created_By_User`
    FOREIGN KEY (`Created_By_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Visit_Exam` (
  `Visit_ID` BIGINT NOT NULL,
  `Nurse_Intake_Note` TEXT NULL,
  `Doctor_Exam_Note` TEXT NULL,
  `Blood_Pressure` VARCHAR(30) NULL,
  `Pulse` VARCHAR(20) NULL,
  `Respiration` VARCHAR(20) NULL,
  `Temperature` VARCHAR(20) NULL,
  `Oxygen_Saturation` VARCHAR(20) NULL,
  `Height` VARCHAR(20) NULL,
  `Weight` VARCHAR(20) NULL,
  `Pain_Level` VARCHAR(20) NULL,
  `Updated_By_User_ID` BIGINT NULL,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Visit_ID`),
  KEY `idx_Visit_Exam_Updated_By_User_ID` (`Updated_By_User_ID`),
  CONSTRAINT `fk_Visit_Exam_Visit`
    FOREIGN KEY (`Visit_ID`) REFERENCES `Visit` (`Visit_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_Visit_Exam_Updated_By_User`
    FOREIGN KEY (`Updated_By_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Visit_Medication` (
  `Visit_ID` BIGINT NOT NULL,
  `Current_Medications` TEXT NULL,
  `Medication_Changes` TEXT NULL,
  `Medication_Notes` TEXT NULL,
  `Updated_By_User_ID` BIGINT NULL,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Visit_ID`),
  KEY `idx_Visit_Medication_Updated_By_User_ID` (`Updated_By_User_ID`),
  CONSTRAINT `fk_Visit_Medication_Visit`
    FOREIGN KEY (`Visit_ID`) REFERENCES `Visit` (`Visit_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_Visit_Medication_Updated_By_User`
    FOREIGN KEY (`Updated_By_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Billing
-- =========================

CREATE TABLE `Billing` (
  `Billing_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Visit_ID` BIGINT NOT NULL,
  `Amount` DECIMAL(10,2) NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Billing_ID`),
  UNIQUE KEY `uk_Billing_Visit_ID` (`Visit_ID`),
  CONSTRAINT `fk_Billing_Visit`
    FOREIGN KEY (`Visit_ID`) REFERENCES `Visit` (`Visit_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- Assignments + Auditing
-- =========================

CREATE TABLE `Nurse_Assignments` (
  `Assignment_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `Nurse_User_ID` BIGINT NOT NULL,
  `Patient_ID` BIGINT NOT NULL,
  PRIMARY KEY (`Assignment_ID`),
  KEY `idx_Nurse_Assignments_Nurse_User_ID` (`Nurse_User_ID`),
  KEY `idx_Nurse_Assignments_Patient_ID` (`Patient_ID`),
  CONSTRAINT `fk_Nurse_Assignments_Nurse`
    FOREIGN KEY (`Nurse_User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_Nurse_Assignments_Patient`
    FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `Audit_Log` (
  `Audit_Log_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `User_ID` BIGINT NOT NULL,
  `Audit_Date` DATETIME NOT NULL,
  `Action_Type` VARCHAR(30) NOT NULL,
  `Entity_Name` VARCHAR(50) NOT NULL,
  `Entity_Record_ID` BIGINT NOT NULL,
  `Details` TEXT NULL,
  PRIMARY KEY (`Audit_Log_ID`),
  KEY `idx_Audit_Log_User_ID` (`User_ID`),
  CONSTRAINT `fk_Audit_Log_User`
    FOREIGN KEY (`User_ID`) REFERENCES `Users` (`User_ID`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
