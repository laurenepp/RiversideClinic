-- Created by Redgate Data Modeler (https://datamodeler.redgate-platform.com)
-- Last modification date: 2026-02-19 20:13:35.098
CREATE DATABASE riversideclinicdb;
USE riversideclinicdb;
-- tables
-- Table: Appointment
CREATE TABLE Appointment (
    Appointment_ID bigint  NOT NULL,
    Patient_ID bigint  NOT NULL,
    Provider_User_ID bigint  NOT NULL,
    Scheduled_Start datetime  NOT NULL,
    Status varchar(20)  NOT NULL COMMENT 'Allowed Values: SCHEDULED, CANCELLED, RESCHEDULED, NO_SHOW, COMPLETED',
    Scheduled_End time  NOT NULL,
    Patient_Patient_ID bigint  NOT NULL,
    User_User_ID bigint  NOT NULL,
    Provider_Schedule_Schedule_ID bigint  NOT NULL,
    PRIMARY KEY (Appointment_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Audit_Log
CREATE TABLE Audit_Log (
    Audit_Log_ID bigint  NOT NULL,
    User_ID bigint  NOT NULL,
    Audit_Date datetime  NOT NULL,
    Action_Type varchar(30)  NOT NULL,
    Entity_Name varchar(50)  NOT NULL,
    Entity_Record_ID bigint  NOT NULL,
    Details text  NULL,
    User_User_ID bigint  NOT NULL,
    PRIMARY KEY (Audit_Log_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Emergency_Contact
CREATE TABLE Emergency_Contact (
    Emergency_Contact_ID bigint  NOT NULL,
    First_Name varchar(128)  NOT NULL,
    Last_Name varchar(128)  NOT NULL,
    Phone_Number varchar(20)  NOT NULL,
    PRIMARY KEY (Emergency_Contact_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Insurance_Info
CREATE TABLE Insurance_Info (
    Insurance_ID bigint  NOT NULL,
    Patient_ID bigint  NOT NULL,
    Insurance_Provider varchar(255)  NULL,
    Payment_Status varchar(30)  NOT NULL COMMENT 'PAID, PENDING, DENIED',
    Date_Sent date  NOT NULL,
    Patient_Patient_ID bigint  NOT NULL,
    PRIMARY KEY (Insurance_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Nurse_Assignments
CREATE TABLE Nurse_Assignments (
    Assignment_ID bigint  NOT NULL,
    Nurse_User_ID bigint  NOT NULL,
    Patient_ID bigint  NOT NULL,
    User_User_ID bigint  NOT NULL,
    Patient_Patient_ID bigint  NOT NULL,
    PRIMARY KEY (Assignment_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Patient
CREATE TABLE Patient (
    Patient_ID bigint  NOT NULL,
    First_Name varchar(128)  NOT NULL,
    Last_Name varchar(128)  NOT NULL,
    Phone_Number varchar(20)  NOT NULL,
    Email varchar(255)  NULL,
    Date_Of_Birth date  NOT NULL,
    PRIMARY KEY (Patient_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Patient_Emergency_Contacts
CREATE TABLE Patient_Emergency_Contacts (
    Patient_ID bigint  NOT NULL,
    Emergency_Contact_ID bigint  NOT NULL,
    Relationship_To_Patient varchar(128)  NOT NULL,
    Emergency_Contact_Emergency_Contact_ID bigint  NOT NULL,
    PRIMARY KEY (Patient_ID, Emergency_Contact_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Patient_Patient_Emergency_Contacts
CREATE TABLE Patient_Patient_Emergency_Contacts (
    Patient_Patient_ID bigint  NOT NULL,
    Patient_Emergency_Contacts_Patient_ID bigint  NOT NULL,
    Patient_Emergency_Contacts_Emergency_Contact_ID bigint  NOT NULL,
    PRIMARY KEY (Patient_Patient_ID,Patient_Emergency_Contacts_Patient_ID,Patient_Emergency_Contacts_Emergency_Contact_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Permissions
CREATE TABLE Permissions (
    Role_ID bigint  NOT NULL,
    Table_Name varchar(50)  NOT NULL,
    Can_View boolean  NOT NULL,
    Can_Edit boolean  NOT NULL,
    Can_Delete boolean  NOT NULL,
    Roles_Role_ID bigint  NOT NULL,
    PRIMARY KEY (Role_ID,Table_Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Provider_Schedule
CREATE TABLE Provider_Schedule (
    Schedule_ID bigint  NOT NULL,
    Provider_User_ID bigint  NOT NULL COMMENT '2 overall providers',
    Day_Of_The_Week longtext  NOT NULL COMMENT 'Monday-Friday Schedule',
    Start_Time time  NOT NULL COMMENT 'Earliest start 8:00 ',
    End_Time time  NOT NULL COMMENT 'Latest_Appointmet 4:30',
    PRIMARY KEY (Schedule_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='30 minute appointments';

-- Table: Roles
CREATE TABLE Roles (
    Role_ID bigint  NOT NULL,
    Role_Name varchar(50)  NOT NULL,
    PRIMARY KEY (Role_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: User
CREATE TABLE Users (
    User_ID bigint  NOT NULL,
    First_Name varchar(128)  NOT NULL,
    Last_Name varchar(128)  NOT NULL,
    Role_ID bigint  NOT NULL,
    Phone_Number varchar(20)  NOT NULL,
    Email varchar(255)  NOT NULL,
    Roles_Role_ID bigint  NOT NULL,
    User_Login_Info_User_ID bigint  NOT NULL,
    PRIMARY KEY (User_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: User_Login_Info
CREATE TABLE User_Login_Info (
    User_ID bigint  NOT NULL,
    Username varchar(64)  NOT NULL,
    Password_Hash varchar(255)  NOT NULL,
    Created_At datetime  NOT NULL,
    PRIMARY KEY (User_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Visit
CREATE TABLE Visit (
    Visit_ID bigint  NOT NULL,
    Created_By_User_ID bigint  NOT NULL,
    Appointment_ID bigint  NULL,
    Patient_ID bigint  NOT NULL,
    Provider_User_ID bigint  NOT NULL,
    Visit_DateTime datetime  NOT NULL,
    Appointment_Appointment_ID bigint  NOT NULL,
    Patient_Patient_ID bigint  NOT NULL,
    User_User_ID bigint  NOT NULL,
    PRIMARY KEY (Visit_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Visit_Notes
CREATE TABLE Visit_Notes (
    Note_ID bigint  NOT NULL,
    Visit_ID bigint  NOT NULL,
    Created_By_User_ID bigint  NOT NULL,
    Visit_Note text  NOT NULL,
    Note_DateTIme datetime  NOT NULL,
    Visit_Visit_ID bigint  NOT NULL,
    User_User_ID bigint  NOT NULL,
    PRIMARY KEY (Note_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- foreign keys
-- Reference: Appointment_Patient (table: Appointment)
ALTER TABLE Appointment ADD CONSTRAINT Appointment_Patient FOREIGN KEY (Patient_Patient_ID)
    REFERENCES Patient (Patient_ID);

-- Reference: Appointment_Provider_Schedule (table: Appointment)
ALTER TABLE Appointment ADD CONSTRAINT Appointment_Provider_Schedule FOREIGN KEY (Provider_Schedule_Schedule_ID)
    REFERENCES Provider_Schedule (Schedule_ID);

-- Reference: Appointment_User (table: Appointment)
ALTER TABLE Appointment ADD CONSTRAINT Appointment_User FOREIGN KEY (User_User_ID)
    REFERENCES Users (User_ID);

-- Reference: Audit_Log_User (table: Audit_Log)
ALTER TABLE Audit_Log ADD CONSTRAINT Audit_Log_User FOREIGN KEY (User_User_ID)
    REFERENCES Users (User_ID);

-- Reference: Insurance_Info_Patient (table: Insurance_Info)
ALTER TABLE Insurance_Info ADD CONSTRAINT Insurance_Info_Patient FOREIGN KEY (Patient_Patient_ID)
    REFERENCES Patient (Patient_ID);

-- Reference: Nurse_Assignments_Patient (table: Nurse_Assignments)
ALTER TABLE Nurse_Assignments ADD CONSTRAINT Nurse_Assignments_Patient FOREIGN KEY (Patient_Patient_ID)
    REFERENCES Patient (Patient_ID);

-- Reference: Nurse_Assignments_User (table: Nurse_Assignments)
ALTER TABLE Nurse_Assignments ADD CONSTRAINT Nurse_Assignments_User FOREIGN KEY (User_User_ID)
    REFERENCES Users (User_ID);

-- Reference: Patient_Emergency_Contacts_Emergency_Contact (table: Patient_Emergency_Contacts)
ALTER TABLE Patient_Emergency_Contacts ADD CONSTRAINT Patient_Emergency_Contacts_Emergency_Contact FOREIGN KEY (Emergency_Contact_Emergency_Contact_ID)
    REFERENCES Emergency_Contact (Emergency_Contact_ID);

-- Reference: Patient_Patient_Emergency_Contacts_Patient (table: Patient_Patient_Emergency_Contacts)
ALTER TABLE Patient_Patient_Emergency_Contacts ADD CONSTRAINT Patient_Patient_Emergency_Contacts_Patient FOREIGN KEY (Patient_Patient_ID)
    REFERENCES Patient (Patient_ID);

-- Reference: Patient_Patient_Emergency_Contacts_Patient_Emergency_Contacts (table: Patient_Patient_Emergency_Contacts)
ALTER TABLE Patient_Patient_Emergency_Contacts ADD CONSTRAINT Patient_Patient_Emergency_Contacts_Patient_Emergency_Contacts FOREIGN KEY (Patient_Emergency_Contacts_Patient_ID,Patient_Emergency_Contacts_Emergency_Contact_ID)
    REFERENCES Patient_Emergency_Contacts (Patient_ID,Emergency_Contact_ID);

-- Reference: Permissions_Roles (table: Permissions)
ALTER TABLE Permissions ADD CONSTRAINT Permissions_Roles FOREIGN KEY (Roles_Role_ID)
    REFERENCES Roles (Role_ID);

-- Reference: User_Roles (table: User)
ALTER TABLE Users ADD CONSTRAINT User_Roles FOREIGN KEY (Roles_Role_ID)
    REFERENCES Roles (Role_ID);

-- Reference: User_User_Login_Info (table: User)
ALTER TABLE Users ADD CONSTRAINT User_User_Login_Info FOREIGN KEY (User_Login_Info_User_ID)
    REFERENCES User_Login_Info (User_ID);

-- Reference: Visit_Appointment (table: Visit)
ALTER TABLE Visit ADD CONSTRAINT Visit_Appointment FOREIGN KEY (Appointment_Appointment_ID)
    REFERENCES Appointment (Appointment_ID);

-- Reference: Visit_Notes_User (table: Visit_Notes)
ALTER TABLE Visit_Notes ADD CONSTRAINT Visit_Notes_User FOREIGN KEY (User_User_ID)
    REFERENCES Users (User_ID);

-- Reference: Visit_Notes_Visit (table: Visit_Notes)
ALTER TABLE Visit_Notes ADD CONSTRAINT Visit_Notes_Visit FOREIGN KEY (Visit_Visit_ID)
    REFERENCES Visit (Visit_ID);

-- Reference: Visit_Patient (table: Visit)
ALTER TABLE Visit ADD CONSTRAINT Visit_Patient FOREIGN KEY (Patient_Patient_ID)
    REFERENCES Patient (Patient_ID);

-- Reference: Visit_User (table: Visit)
ALTER TABLE Visit ADD CONSTRAINT Visit_User FOREIGN KEY (User_User_ID)
    REFERENCES Users (User_ID);

-- End of file.

