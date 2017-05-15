-- Create a Schema named "machines" to run this in

DROP TABLE MachineConnections;
DROP TABLE Connections;
DROP TABLE Machines;

CREATE TABLE Machines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(45) NOT NULL UNIQUE,
  type VARCHAR(45),
  notes LONGTEXT,
  ip VARCHAR(50),
  available TINYINT(1) DEFAULT 1,
  network_type TEXT,
  netID INT(11),
  location TEXT,
  reservedBy TEXT DEFAULT NULL,
  reservedAt DATETIME,
  working TINYINT(1) DEFAULT 1
);

CREATE TABLE Connections (
  id int PRIMARY KEY AUTO_INCREMENT,
  name TEXT NOT NULL,
  channel TEXT,
  protocol TEXT,
  md TEXT
);

CREATE TABLE MachineConnections (
  connectionID INT,
  machineID INT,
  FOREIGN KEY (machineID) REFERENCES Machines(id),
  FOREIGN KEY (connectionID) REFERENCES Connections(id)
);

CREATE TABLE WikiPages (
  id int PRIMARY KEY AUTO_INCREMENT,
  name varchar(45) NOT NULL UNIQUE,
  text LONGTEXT
);

INSERT INTO Machines (name, type, notes, ip, network_type, netID, location) VALUES
("NC45LTA3VIRT1", "A3Sim", "", "129.30.145.229", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT2", "A3Sim", "", "129.30.145.230", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT3", "A3NGC", "", "129.30.145.231", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT4", "A3NGC", "", "129.30.145.232", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT5", "A3Sim", "", "129.30.145.233", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT6", "A3Sim", "", "129.30.145.234", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT7", "A3NGC", "", "129.30.145.235", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT8", "A3NGC", "", "129.30.145.236", "NGC", 42, "Keith's Desk"),
("NC45LTA3VIRT9", "A3NGC", "", "129.30.147.214", "NGC", 46, "Keith's Desk"),
("NC45LTA3VIRT10", "A3NGC", "", "129.30.147.215", "NGC", 46, "Keith's Desk"),
("NC45LTA3VIRT11", "A3NGC", "", "129.30.147.216", "NGC", 46, "Keith's Desk");
