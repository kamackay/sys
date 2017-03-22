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
    console.log(obj);
  }
});
app.use(bodyParser.json());
app.use("/get*", function (req, res, next) {
  res.json(data.machines);
})
app.use("/put*", function (req, res, next) {
  data.machines = req.body;
  console.log(data.machines);
  res.json({});
  jsonfile.writeFile("./data.json", data, function (err) {
    console.log(err);
  });
});
var port = process.env.PORT || 5555;
app.listen(port);
console.log("App Listening on port " + port);