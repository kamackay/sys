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

data = {};
jsonfile.readFile("./data.json", function (err, obj) {
  if (err) log(err);
  else {
    data = obj;
    //log(JSON.stringify(obj, null, 4));
    log("Data loaded");
  }
});

// Handle an Exception
function handle(err, res) {
  log(err);
  res.status(500).json({
    error: err.toString()
  });
}

// Save data to the Database (and the backup JSON file)
function saveData(db) {
  jsonfile.writeFile("./data.json", data, function (err) {
    if (err) log(err);
    else {
      log("Saved successfully");
    }
  });
  var machineColl = db.get("machines");
  for (var x = 0; x < data.machines.length; x++) {
    machineColl.update({
      name: data.machines[x].name
    }, data.machines[x], {
      upsert: true
    });
  }
}
app.use(bodyParser.json());

// Get All machines
app.get("/machines", function (req, res, next) {
  if (req.query.prettyPrint !== undefined) {
    res.send("<!DOCTYPE html><html><head><title>Machine Data (Raw View)</title><link rel='icon' href='./icon.ico'></head><body style='overflow:hidden;'><textarea readonly style='width:100vw;height:100vh;border-width:0px;padding:10px;'>" +
      JSON.stringify(data.machines, null, 4) + "</textarea></body></html>");
  } else {
    res.json(data.machines);
    log("Get Request", req);
  }
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

// Get All data
app.get("/allData", function (req, res, next) {
  if (req.query.prettyPrint !== undefined || req.query.pretty !== undefined) {
    res.send("<!DOCTYPE html><html><head><title>Machine Data (Raw View)</title><link rel='icon' href='./icon.ico'></head><body style='overflow:hidden;'><textarea readonly style='width:100vw;height:100vh;border-width:0px;padding:10px;'>" +
      JSON.stringify(data, null, 4) + "</textarea></body></html>");
    log("Request for all data (Pretty)", req)
  } else {
    res.json(data);
    log("Request for all data", req);
  }
});

// Get the information for a specific machine
app.get("/machines/:name", function (req, res, next) {
  var responseObject = {};
  const sendResponse = (obj) => {
    res.status(200).json(obj);
  };
  const machineName = req.params.name;
  // Pull Data on this machine from the Database
  req.db.get("machines").find({
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
  /*var machine = undefined;
  const machineName = req.params.name;
  for (var x = 0; x < data.machines.length; x++)
    if (data.machines[x].name.toLowerCase() === machineName.toLowerCase()) machine = data.machines[x];
  if (machine === undefined) {
    res.status(404).send("Unable to find a machine named " + machineName);
    return;
  }
  if (req.query.prettyPrint !== undefined) {
    res.send("<!DOCTYPE html><html><head><title>Machine Data (Raw View)</title><link rel='icon' href='./icon.ico'></head><body style='overflow:hidden;'><textarea readonly style='width:100vw;height:100vh;border-width:0px;padding:0px;'>" +
      JSON.stringify(machine, null, 4) + "</textarea></body></html>");
    log("Get Request for " + req.params.name + " (pretty)", req);
  } else {
    res.json(machine);
    log("Get Request for " + req.params.name, req);
  }
  /* Old Version */
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
  log("Start Update", req);
  const body = req.body;
  switch (body.action) {
    case "reserve":
      try {
        const machineName = body.machineName;
        for (var x = 0; x < data.machines.length; x++)
          if (data.machines[x].name === machineName) {
            data.machines[x].available = false;
            data.machines[x].reservedBy = body.reservedBy;
            data.machines[x].reservedAt = new Date().getTime();
            log("    " + machineName + " Reserved by " + body.reservedBy, req);
            res.json({});
            saveData(req.db);
            setMachineName(body.reservedBy, req);
            return;
          }
      } catch (err) {
        handle(err, res);
        return;
      }
      break;
    case "release":
      try {
        const machineName = body.machineName;
        for (var x = 0; x < data.machines.length; x++)
          if (data.machines[x].name === machineName) {
            var wasReservedBy = data.machines[x].reservedBy;
            data.machines[x].available = true;
            data.machines[x].reservedBy = "";
            data.machines[x].reservedAt = undefined;
            log("    " + machineName + " Released (was reserved by " + wasReservedBy + ")", req);
            res.json({});
            saveData(req.db);
            return;
          }
      } catch (err) {
        handle(err, res);
        return;
      }
      break;
    case "update":
      try {
        const machineName = body.machine.name;
        for (var x = 0; x < data.machines.length; x++)
          if (data.machines[x].name === machineName) {
            data.machines[x].notes = body.machine.notes;
            data.machines[x].location = body.machine.location;
            data.machines[x].type = body.machine.type;
            log("    " + machineName + " Successfully Updated", req);
            res.json({});
            saveData(req.db);
            return;
          }
      } catch (err) {
        handle(err, res);
        return;
      }
      break;
  }
  log("Unsuccessful Update", req);
  res.json({});
});

// Update all data based on the given data
app.post("/machines/put", function (req, res, next) {
  if (req.body.machines && req.body.machines.length > 0) {
    data.machines = req.body.machines;
    res.send("Accepting Data on blind faith");
    log("Full Data Save (now " + data.machines.length + " machines)", req);
    saveData(req.db);
    if (req.body.name) setMachineName(req.body.name, req);
  } else log("Attempt to delete all data", req);
});

function exitHandler(options, err) {
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