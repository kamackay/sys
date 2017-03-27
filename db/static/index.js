var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  // Pull from the database
  $scope.update = function () {
    $http.get('/machines').then(function (data) {
      $scope.machines = data.data;
      // Materialize.toast("Updated from database", 2500, "rounded");
    });
  };
  // remove all of the edit flags from the data
  $scope.noEdit = function () {
    for (var x = 0; x < $scope.machines.length; x++) $scope.machines[x].edit = undefined;
  };
  $(window).focus(function () {
    if (document.getElementById('autoUpdate').checked) {
      // Don't do the update if one of the machines is being edited
      for (var x = 0; x < $scope.machines.length; x++)
        if ($scope.machines[x].edit) return;
      $scope.update();
      console.log("Update on focus");
    }
  }); // Update when the window gets focus
  $scope.update();
  $scope.msg = "";
  // Push changes from the database
  $scope.save = function () {
    $scope.noEdit();
    $http.post('/machines/put', $scope.machines).then(function (data) {
      Materialize.toast("Saved to database", 2500, "rounded");
    });
  };
  // Reserve A Machine
  $scope.reserve = function (machine, name) {
    name = name || getData("username") || prompt('What is your name?', '');
    storeData("username", name);
    $http.post("/machines/update", {
      reservedBy: name,
      action: "reserve",
      machineName: machine
    }).then(function (data) {
      console.log(data);
      $scope.update();
    });
  };
  // Release A Machine
  $scope.release = function (machine) {
    $http.post("/machines/update", {
      action: "release",
      machineName: machine
    }).then(function (data) {
      console.log(data);
      $scope.update();
    });
  };
  // Add a machine to the list
  $scope.add = function () {
    var machineName = prompt("Machine Name", "");
    // Check to see if that machine name exists already
    for (var x = 0; x < $scope.machines.length; x++) {
      if ($scope.machines[x].name === machineName) {
        Materialize.toast("Machine name exists already", 3000, "rounded");
        return;
      }
    }
    $scope.machines.push({
      name: machineName,
      available: true,
      reservedBy: "",
      edit: true
    });
  };
  // Delete a machine (The first one found with the given name)
  $scope.delete = function (machine) {
    for (var x = 0; x < $scope.machines.length; x++) {
      if ($scope.machines[x].name == machine) {
        $scope.machines.splice(x, 1);
        return;
      }
    }
  };

  $scope.getRDP = function (machine) {
    openInNewTab(window.location + "rdp/" + machine.name);
  }
});

// Stuff to do once the full page load is done
$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $('.tooltipped').tooltip({
    delay: 50
  });
  if (getData("auto_update") === "true") document.getElementById('autoUpdate').setAttribute("checked", true);
  else if (getData("auto_update") === "false") document.getElementById("autoUpdate").removeAttribute("checked");
  $(window).resize(function () {
    const reasonLabel = $("reasonLabel");
    if ($(window).width() < 900) {
      $("#navRight").hide();
      $("#reasonLabel").hide();
    } else if ($(window).width() < 1100) {
      $("#navRight").show();
      $("#reasonLabel").hide();
    } else {
      $("#navRight").show();
      $("#reasonLabel").show();
    }
  });
  $(window).resize();
});

function storeData(e, o) {
  'undefined' != typeof Storage && localStorage.setItem(e, o)
}

function getData(e) {
  return 'undefined' != typeof Storage ? localStorage.getItem(e) : null
}

function openInNewTab(url) {
  var e = window.open(url, '_blank')
  e.focus()
}

function toggleUpdate() {
  const el = document.getElementById("autoUpdate");
  if (el.hasAttribute("checked")) {
    el.removeAttribute("checked")
    storeData("auto_update", "false");
  } else {
    el.setAttribute("checked", "true")
    storeData("auto_update", "true");
  }
}