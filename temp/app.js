var express = require('express');
var app = express();
var bodyParser = require('body-parser');
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

const utils = {
  version: '1.0.2'
};

utils.pad = function (n, width, z) {
  z = z || '0';
  width = width || 2;
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

utils.getTimestamp = function () {
  const date = new Date();
  return "" + date.getFullYear() + "/" + utils.pad(date.getMonth(), 2) + "/" + utils.pad(date.getDate()) + " " +
    utils.pad(date.getHours()) + ":" + utils.pad(date.getMinutes()) + ":" + utils.pad(date.getSeconds());
}

const mysql = require("mysql");
const connection = mysql.createConnection({
  host: 'NC45LTF88J3G2.global.ds.honeywell.com',
  user: 'keith',
  password: 'keith',
  database: "nbv"
});
connection.connect(function (err) {
  if (err) {
    _log(err);
  } else {
    log("Database Successfully Connected");
  }
});

/* Regular log method for strings */
function log(s, req, options) {
  if (typeof (s) === "string") {
    if (req) {
      var padding = "";
      for (var x = s.length; x < 60; x++) padding += "-";
      const addr = req.connection.remoteAddress;
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

// Get All machines
app.get("/meters", function (req, res, next) {
  log("Request for all Meters", req);
  var query = connection.query("SELECT * FROM Meters", {}, function (err, result) {
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