var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonfile = require("jsonfile");
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({
  'extended': 'true'
}));
data = {};
jsonfile.readFile("./data.json", function (err, obj) {
  if (err) console.log(err);
  else {
    data = obj;
    console.log(JSON.stringify(obj, null, 4));
  }
});

function handle(err, res) {
  console.log(err);
  res.status(500).json({
    error: err.toString()
  });
}

function saveData() {
  jsonfile.writeFile("./data.json", data, function (err) {
    if (err) console.log(err);
    else {
      console.log("Saved successfully");
    }
  });
}
app.use(bodyParser.json());
app.get("/machines", function (req, res, next) {
  if (req.query.prettyPrint !== undefined) {
    res.send("<!DOCTYPE html><html><head><title>Machine Data (Raw View)</title><link rel='icon' href='./icon.ico'></head><body style='overflow:hidden;'><textarea readonly style='width:100vw;height:100vh;border-width:0px;padding:0px;'>" +
      JSON.stringify(data.machines, null, 4) + "</textarea></body></html>")
  } else {
    res.json(data.machines);
    console.log("Get Request");
  }
});
app.get("/machines/:name", function (req, res, next) {
  var machine = undefined;
  const machineName = req.params.name;
  for (var x = 0; x < data.machines.length; x++)
    if (data.machines[x].name.toLowerCase() === machineName.toLowerCase()) machine = data.machines[x];
  if (machine === undefined) {
    res.status(404).send("Unable to find a machine named " + machineName);
    return;
  }
  if (req.query.prettyPrint !== undefined) {
    res.send("<!DOCTYPE html><html><head><title>Machine Data (Raw View)</title><link rel='icon' href='./icon.ico'></head><body style='overflow:hidden;'><textarea readonly style='width:100vw;height:100vh;border-width:0px;padding:0px;'>" +
      JSON.stringify(machine, null, 4) + "</textarea></body></html>")
  } else {
    res.json(machine);
    console.log("Get Request");
  }
});
app.get("/rdp/:address", function (req, res, next) {
  console.log("Request to get RDP for " + req.params.address);
  res.setHeader('Content-Type', 'application/x-rdp');
  res.setHeader('Content-Disposition', 'attachment; filename=' + req.params.address + '.rdp');
  res.end("full address:s:" + req.params.address + ":3389\r\nprompt for credentials:i:1");
});
app.use("/machines/update", function (req, res, next) {
  console.log("Start Update");
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
            console.log("    " + machineName + " Successfully Reserved by " + body.reservedBy);
            res.json({});
            saveData();
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
            data.machines[x].available = true;
            data.machines[x].reservedBy = "";
            data.machines[x].reservedAt = undefined;
            console.log("    " + machineName + " Successfully Released");
            res.json({});
            saveData();
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
            console.log("    " + machineName + " Successfully Updated");
            res.json({});
            saveData();
            return;
          }
      } catch (err) {
        handle(err, res);
        return;
      }
      break;
  }
  console.log("Unsuccessful update");
  res.json({});
});
app.use("/machines/put", function (req, res, next) {
  data.machines = req.body;
  res.send("Accepting Data on blind faith");
  saveData();
});
var port = process.env.PORT || 5555;
app.listen(port);
console.log("App Listening on port " + port);