-- Create a Schema named "machines" to run this in

DROP TABLE MachineConnections;
DROP TABLE Connections;
DROP TABLE Machines;

CREATE TABLE Machines (
  id int PRIMARY KEY AUTO_INCREMENT,
  name varchar(45) NOT NULL UNIQUE,
  type varchar(45),
  notes LONGTEXT,
  ip varchar(50),
  available tinyint(1) DEFAULT 1,
  network_type TEXT,
  netID int(11),
  location TEXT,
  reservedBy TEXT DEFAULT NULL,
  reservedAt DATETIME
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

INSERT INTO Machines (name, type, notes, ip, network_type, netID, location) VALUES
("NC45LTA3VIRT1", "A3Sim", "", "129.30.145.229", "NGC", 42, "Keith's Desk");
