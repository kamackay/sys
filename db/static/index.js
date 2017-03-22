var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  $scope.update = function () {
    $http.get('/get/').then(function (data) {
      $scope.machines = data.data;
    });
  };
  window.setInterval(() => {
    if (document.getElementById('autoUpdate').checked) {
      $scope.update();
      Materialize.toast("Updated from database", 2500);
    }
  }, 1000 * 30); // Update periodically
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
  $scope.edit = function (machine) {
    const form = $("#editForm");
    $.each(form.find(".machineName"), function (x, el) {
      var e = $(el);
      if (el.tagName.toLowerCase() === "span") e.text(machine.name);
      else if (el.tagName.toLowerCase() === "input") e.val(machine.name);
      else console.log(e);
    });
    $.each(form.find(".machineType"), function (x, el) {
      if (el.tagName.toLowerCase() === "input") $(el).val(machine.type);
      else console.log(el);
    });
    $.each(form.find(".machineLocation"), function (x, el) {
      if (el.tagName.toLowerCase() === "input") $(el).val(machine.location);
      else console.log(el);
    });
    var submit = null;
    submit = function () {
      document.getElementById("editForm_submit").removeEventListener("onclick", submit);
      for (var x = 0; x < $scope.machines.length; x++) {
        if ($scope.machines[x].name === machine.name) {
          $scope.machines[x].name = form.find("input.machineName").first().val();
          $scope.machines[x].type = form.find("input.machineType").first().val();
          $scope.machines[x].location = form.find("input.machineLocation").first().val();
          console.log($scope.machines[x]);
          $scope.save();
          setTimeout($scope.update, 100);
        }
      } /**/
      document.getElementById("editForm").removeAttribute("style");
    };
    document.getElementById("editForm_submit").addEventListener("click", submit);
    form.animate({
      top: '25vh'
    }, 1000);
  };
});

$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $('.tooltipped').tooltip({
    delay: 50
  });
  console.log("Page Ready");
  if (getData("auto_update") === true) document.getElementById('autoUpdate').checked = true;
  else document.getElementById("autoUpdate").checked = false;
});

function storeData(e, o) {
  'undefined' != typeof Storage && localStorage.setItem(e, o)
}

function getData(e) {
  return 'undefined' != typeof Storage ? localStorage.getItem(e) : null
}

function toggleUpdate() {
  storeData("auto_update", document.getElementById("autoUpdate").checked);
}