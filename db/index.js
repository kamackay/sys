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

function saveData() {
  jsonfile.writeFile("./data.json", data, function (err) {
    if (err) console.log(err);
    else {
      console.log("Saved successfully");
    }
  });
}
app.use(bodyParser.json());
app.use("/machines/get*", function (req, res, next) {
  res.json(data.machines);
  console.log("Get Request");
});
app.use("/machines/update*", function (req, res, next) {
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
        res.status(500).json({
          error: err.toString()
        });
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
        res.status(500).json({
          error: err.toString()
        });
      }
      break;
  }
  console.log("Unsuccessful update");
  res.json({});
});
app.use("/machines/put*", function (req, res, next) {
  data.machines = req.body;
  res.send("Accepting Data on blind faith");
  saveData();
});
var port = process.env.PORT || 5555;
app.listen(port);
console.log("App Listening on port " + port);