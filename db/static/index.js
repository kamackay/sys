var app = angular.module('module', []);
app.controller('controller', function ($scope, $http) {
  $scope.update = function () {
    $http.get('/get/').then(function (data) {
      $scope.machines = data.data;
    });
  };
  //window.setInterval($scope.update, 1000 * 60); // Update once a minute
  $scope.update();
  $scope.msg = "";
  $scope.save = function () {
    $http.post('/put/', $scope.machines).then(function (data) {
      Materialize.toast("Saved to database", 2500, "rounded");
    });
  };
  $scope.reserve = function (machine, name) {
    if (name === undefined) name = prompt('What is your name?', 'Mikey Mike and the Funky Bunch')
    for (var i = 0; i < $scope.machines.length; i++) {
      if ($scope.machines[i].name === machine) {
        $scope.machines[i].available = false;
        $scope.machines[i].reservedBy = name;
      }
    }
  };
  $scope.release = function (machine) {
    for (var i = 0; i < $scope.machines.length; i++) {
      if ($scope.machines[i].name === machine) {
        $scope.machines[i].available = true;
        $scope.machines[i].reservedBy = "";
      }
    }
  };
  $scope.add = function () {
    var machineName = prompt("Machine Name", "");
    $scope.machines.push({
      name: machineName,
      available: true,
      reservedBy: ""
    });
  };
  $scope.delete = function (machine) {
    for (var x = 0; x < $scope.machines.length; x++) {
      if ($scope.machines[x].name == machine) $scope.machines.splice(x, 1);
    }
  };
});

$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $('.tooltipped').tooltip({
    delay: 50
  });
  console.log("Page Ready");
});