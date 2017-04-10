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
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/data');

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

function getAll(db, after) {
  try {
    db.get("machines").find({}, {}, function (e, obj) {
      try {
        if (isFunction(after)) after(obj);
      } catch (err) {
        log(err);
      }
    });
  } catch (err) {
    log(err);
  }
}

// Runs for all inbound Requests
app.use(function (req, res, next) {
  req.db = db;
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
  req.db.get("machines").find({}, {}, function (e, obj) {
    if (obj && !e) {
      res.status(200).json(obj);
      log("Machines Get Request", req);
    } else {
      res.status(404).json({
        error: e
      });
      log(e, req);
    }
  });
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

// Get the information for a specific machine
app.get("/machines/:name", function (req, res, next) {
  var responseObject = {};
  const sendResponse = (obj) => {
    res.status(200).json(obj);
  };
  const machineName = req.params.name;
  log("Request for raw data of " + machineName, req);
  // Pull Data on this machine from the Database
  req.db.get("machines").findOne({
    name: machineName.toUpperCase()
  }, {}, function (e, obj) {
    if (obj && !e) {
      responseObject.machine = obj;
      sendResponse(responseObject);
    } else {
      res.status(404).json({
        error: "Could not find machine " + machineName
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
// TODO: Use Database 
app.post("/machines/update", function (req, res, next) {
  log("Update Endpoint", req);
  const body = req.body;
  switch (body.action) {
    case "reserve":
      req.db.get("machines").findOne({
        name: body.machineName
      }, {}, function (e, obj) {
        if (obj && !e) {
          obj.available = false;
          obj.reservedBy = body.reservedBy;
          obj.reservedAt = new Date().getTime();
          log("    " + body.machineName + " Reserved by " + body.reservedBy, req);
          req.db.get("machines").update({
            name: obj.name
          }, obj, {
            upsert: true
          });
          setMachineName(body.reservedBy, req);
          res.status(200).json(obj);
        } else {
          log(e, req);
          res.status(404).json({
            error: e
          });
        }
      });
      return;
    case "release":
      req.db.get("machines").findOne({
        name: body.machineName
      }, {}, function (e, obj) {
        if (obj && !e) {
          const wasReservedBy = obj.reservedBy;
          obj.available = true;
          obj.reservedBy = "";
          obj.reservedAt = undefined;
          log("    " + obj.name + " Released (was reserved by " + wasReservedBy + ")", req);
          req.db.get("machines").update({
            name: obj.name
          }, obj, {
            upsert: true
          });
          setMachineName(body.reservedBy, req);
          res.status(200).json(obj);
        } else {
          log(e, req);
          res.status(404).json({
            error: e
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
    const collection = req.db.get("machines");
    for (var x = 0; x < req.body.machines.length; x++) {
      const machine = req.body.machines[x];
      collection.update({
        name: machine.name
      }, machine, {
        upsert: true
      });
    }
    log("Full Data Save (now " + req.body.machines.length + " machines)", req);
    if (req.body.name) setMachineName(req.body.name, req);
  } else log("Attempt to delete all data", req);
});

// Get An SSPEC's Information
app.get("/sspec/:name", function (req, res, next) {
  const name = req.params.name;
  log("Get Request for SSPEC " + name, req);
  req.db.get("sspec").findOne({
    id: parseInt(name)
  }, function (e, obj) {
    if (obj && !e) {
      res.status(200).json({
        sspec: obj
      });
    } else {
      res.status(404).json({
        error: "Could not find SSPEC"
      });
    }
  })
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

function exitHandler(options, err) {
  db.close();
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