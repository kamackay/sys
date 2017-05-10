var express = require('express');
var app = express();
const utils = require("./utils");
var bodyParser = require('body-parser');
var jsonfile = require("jsonfile");
app.use(express.static(__dirname + '/static'));
var fs = require('file-system');
var util = require('util');
var logFile = fs.createWriteStream('log.txt', {
  flags: 'a',
  autoClose: true
});
app.use(bodyParser.urlencoded({
  'extended': 'true'
}));
const mysql = require("mysql");
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Passw0rd',
  database: "machines"
});
connection.connect(function (err) {
  if (err) {
    _log(err);
  } else {
    log("Database Successfully Connected");
  }
});

var machinesAndNames = {};

function setMachineName(name, req) {
  try {
    if (name && req) {
      machinesAndNames[req.connection.remoteAddress] = name;
      log("" + req.connection.remoteAddress + " = " + name, req);
    }
  } catch (ex) {
    log(ex);
  }
}

/* Regular log method for strings */
function log(s, req, options) {
  if (typeof (s) === "string") {
    if (req) {
      var padding = "";
      for (var x = s.length; x < 60; x++) padding += "-";
      const addr = req.connection.remoteAddress;
      _log(s + " " + padding + "- " + (machinesAndNames[addr] ? machinesAndNames[addr] : addr));
    } else _log(s);
  } else _log(s);
}

/* Log Method for objects and such */
function _log() {
  const start = utils.getTimestamp() + ": ";
  var args = Array.prototype.slice.call(arguments);
  args.unshift(start);
  console.log.apply(this, args);
  logFile.write(util.format.apply(null, args) + '\n');
}

// Is the provided object a function?
function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

// Runs for all inbound Requests
app.use(function (req, res, next) {
  req.db = connection;
  next();
});

// Handle an Exception
function handle(err, res) {
  log(err);
  res.status(500).json({
    error: err.toString()
  });
}

app.use(bodyParser.json());

// Get All machines
app.get("/machines", function (req, res, next) {
  log("Request for all Machines", req);
  var query = connection.query("SELECT * FROM Machines", {}, function (err, result) {
    if (err) {
      _log(err);
      res.status(500).json({
        error: err
      });
    } else {
      res.json(result);
    }
  })
});

// TODO: Set Value based on URL
app.put("/machines/:machineName/:valueName", function (req, res, next) {
  const machineName = req.params.machineName;
  const valueName = req.params.valueName;
  const value = req.body.value;
  const machineColl = req.db.get("machines");
  if (req.body.name) setMachineName(req.body.name, req);
  log("Attempting to set " + machineName + "." + valueName + " to " + value, req);
  machineColl.findOne({
    name: machineName
  }, {}, function (e, obj) {
    if (obj && !e) {
      obj[valueName] = value;
      machineColl.update({
        name: machineName
      }, obj, {
        upsert: true
      });
      log("Set " + machineName + "." + valueName + " to " + value, req);
      res.json({
        status: "Success"
      });
      return;
    } else {
      log(e, req);
      res.status(404).json({
        error: "Could not find the machine in question"
      });
      return;
    }
  });
});

app.put("/machines/:name", function (req, res, next) {
  const machineName = req.params.name;
  const machine = req.body.machine;
  log("Update data for " + machineName, req);
  var dbData = [machine.name, machine.id, machine.type, machine.notes, machine.ip, machine.network_type, machine.netID, machine.location,
    machine.name, machine.type, machine.notes, machine.ip, machine.network_type, machine.netID, machine.location
  ];
  req.db.query("INSERT INTO Machines(name, id, type, notes, ip, network_type, netID, location) VALUES (?,?,?,?,?,?,?,?) " +
    "ON DUPLICATE KEY UPDATE name=?, type=?, notes=?, ip=?, network_type=?, netID=?, location=?", dbData,
    function (err) {
      if (err) {
        _log(err);
        res.status(500).json({
          error: err
        });
      } else {
        res.json({
          success: true
        });
      }
    });
});

// Get the information for a specific machine
app.get("/machines/:name", function (req, res, next) {
  var responseObject = {};
  const sendResponse = (obj) => {
    res.status(200).json(obj);
  };
  const machineName = req.params.name;
  log("Request for raw data of " + machineName, req);
  // Pull Data on this machine from the Database
  req.db.query("SELECT * FROM Machines WHERE name=?", [machineName], function (err, result) {
    if (err) {
      _log(err);
      res.status(500).json({
        error: err
      });
    } else {
      res.json(result);
    }
  });
});

// Delete a machine from the database
app.delete("/machines/:name", function (req, res, next) {
  const machineName = req.params.name;
  log("!Delete machine " + machineName, req);
  req.db.query("DELETE FROM Machines WHERE name=?", [machineName], function (err) {
    if (err) {
      _log(err);
      res.status(500).json({
        error: err
      });
    } else {
      res.json({
        success: true
      });
    }
  });
});

// Get the RDP for a specific machine
app.get("/rdp/:address", function (req, res, next) {
  log("Request to get RDP for " + req.params.address, req);
  res.setHeader('Content-Type', 'application/x-rdp');
  res.setHeader('Content-Disposition', 'attachment; filename=' + req.params.address + '.rdp');
  res.end("full address:s:" + req.params.address + ":3389\r\nprompt for credentials:i:1");
});

// Preform an update with the given data
app.post("/machines/update", function (req, res, next) {
  log("Update Endpoint", req);
  const body = req.body;
  switch (body.action) {
    case "reserve":
      const post = [body.reservedBy, new Date(), body.machineName];
      var query = req.db.query("UPDATE Machines SET available=0, reservedBy=?, reservedAt=? WHERE name=?", post, function (err) {
        if (err) {
          _log(err);
          res.status(500).json({
            error: err
          });
        } else {
          log("    " + body.machineName + " Reserved by " + body.reservedBy, req);
          setMachineName(body.reservedBy, req);
          res.json({
            success: true
          });
        }
      });
      return;
    case "release":
      const dbData = [null, null, body.machineName];
      var query = req.db.query("UPDATE Machines SET available=1, reservedBy=?, reservedAt=? WHERE name=?", dbData, function (err) {
        if (err) {
          _log(err);
          res.status(500).json({
            error: err
          });
        } else {
          log("    " + body.machineName + " Released (was reserved by " + "unknown" + ")", req);
          res.json({
            success: true
          });
        }
      });
      return;
  }
  log("Unsuccessful Update", req);
  res.status(400).json({});
});

// Update all data based on the given data
app.post("/machines/put", function (req, res, next) {
  if (req.body.machines && req.body.machines.length > 0) {
    res.send("Accepting Data on blind faith");
    for (var x = 0; x < req.body.machines.length; x++) {
      const machine = req.body.machines[x];
      // There has to be a better way to do this
      var dbData = [
        machine.name, machine.id, machine.type, machine.notes, machine.ip, machine.network_type, machine.netID, machine.location,
        machine.id, machine.type, machine.notes, machine.ip, machine.network_type, machine.netID, machine.location
      ];
      req.db.query("INSERT INTO machines(name, id, type, notes, ip, network_type, netID, location) VALUES (?,?,?,?,?,?,?,?) " +
        "ON DUPLICATE KEY UPDATE id=?, type=?, notes=?, ip=?, network_type=?, netID=?, location=?", dbData,
        function (err) {
          if (err) _log(err);
        })
    }
    log("Full Data Save (now " + req.body.machines.length + " machines)", req);
    if (req.body.name) setMachineName(req.body.name, req);
  } else log("Attempt to delete all data", req);
});

app.get("/connections/", function (req, res, next) {
  if (req.query.machineName) {
    const machineName = req.query.machineName;
    log("Request for the connections for machine " + req.query.machineName, req);
    req.db.get("machines").findOne({
      name: req.query.machineName
    }, {}, function (e, obj) {
      if (obj && !e) {
        if (obj.connections) {
          var query = [];
          for (var x = 0; x < obj.connections.length; x++)
            query.push({
              name: obj.connections[x]
            });
          log("Looking for Connections: " + JSON.stringify(query), req);
          req.db.get("connections").find({
            $or: query
          }, {}, function (e, obj) {
            if (obj && !e) {
              res.json({
                connections: obj
              });
            } else {
              res.status(400).json({
                error: e
              });
            }
          });
        } else {
          log("    No connections listed for machine " + req.query.machineName, req);
          res.json({
            connections: []
          });
        }
      } else {
        res.status(400).json({
          error: e
        });
      }
    });
  } else if (req.query.connectionName) { // Get By Connection Name
    log("Request for connection named " + req.query.connectionName, req);
    req.db.get("connections").findOne({
      name: req.query.connectionName
    }, {}, function (e, obj) {
      if (obj && !e) {
        res.json(obj);
      } else {
        res.status(400).json({
          error: e
        });
      }
    });
  } else {
    log("Request for All Connections", req);
    req.db.get("connections").find({}, {}, function (e, obj) {
      if (obj && !e) {
        res.json({
          data: obj
        });
      } else {
        res.status(400).json({
          error: e
        });
      }
    })
  }
});

app.put("/connections/", function (req, res, next) {
  const connectionData = req.body.data;
  if (!connectionData.name) {
    res.status(400).json({
      error: "No Name in the data"
    });
    return;
  }
  req.db.get("connections").update({
    name: connectionData.name
  }, connectionData, {
    upsert: true
  });
  log("Put on connection " + connectionData.name, req);
  res.json({
    status: "success"
  });
});

// Set An SSPEC's Information
app.put("/sspec*", function (req, res, next) {
  if (req.body.name) setMachineName(req.body.name, req);
  const sspecData = req.body.sspec;
  if (sspecData.id) {
    req.db.get("sspec").update({
      id: parseInt(sspecData.id)
    }, sspecData, {
      upsert: true
    });
    log("Saved sspec Data for " + sspecData.id, req);
    res.status(200).json(sspecData);
  } else {
    res.status(400).json({
      error: "Could not parse data"
    });
  }
});


// ---------- WIKI STUFF ---------------------

app.get("/wikipage/:name", function (req, res, next) {
  var name = req.params.name;
  log("Request for wiki page \"" + name + "\"");

  req.db.query("SELECT * FROM WikiPages WHERE name=?", [name], function (err, result) {
    if (err) {
      _log(err);
      res.status(500).json({
        error: err
      });
    } else {
      log(result[0].contents);
      res.send(result[0].contents);
    }
  });
  try {
    //res.status(500).send("Error while getting wiki page");
  } catch (err) { /* Headers were already sent, so a response has already been sent */ }
});

function exitHandler(options, err) {
  connection.destroy();
  log("Exiting");
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));

var port = process.env.PORT || 80;
app.listen(port);
log("----------------------------------------")
log("App Listening on port " + port);