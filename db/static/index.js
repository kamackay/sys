function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  // Pull from the database
  $scope.update = function () {
    console.log("start update");
    $http.get('http://nc45ltgz50q52/machines', {
      timeout: 1000
    }).then(function (data) {
      $scope.machines = data.data;
      console.log("update successful");
      // Materialize.toast("Updated from database", 2500, "rounded");
    }, function (err) {
      console.log("Error", err);
    });
  };
  // remove all of the edit flags from the data
  $scope.noEdit = function () {
    for (var x = 0; x < $scope.machines.length; x++) $scope.machines[x].edit = undefined;
  };
  const periodicUpdate = function () {
    if (document.getElementById('autoUpdate').checked) {
      // Don't do the update if one of the machines is being edited
      for (var x = 0; x < $scope.machines.length; x++)
        if ($scope.machines[x].edit) return;

      // Just do the update with a plain JS Request
      console.log("Start Update");
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          var localScope = angular.element(document.body).scope();
          localScope.machines = JSON.parse(xmlHttp.responseText);
          localScope.$apply();
          if (!window.resetCount) window.resetCount = 1;
          else window.resetCount++;
          console.log("Updated successfully (" + window.resetCount + " times)");
        }
      }
      xmlHttp.open("GET", 'http://nc45ltgz50q52/machines', true);
      xmlHttp.send(null);
    }
  };
  window.setInterval(periodicUpdate, 1000 * 60);
  $(window).focus(periodicUpdate);
  $scope.update();
  $scope.msg = "";
  // Push changes from the database
  $scope.save = function () {
    $scope.noEdit();
    console.log("Start Save");
    $http.post('/machines/put', $scope.machines).then(function (data) {
      Materialize.toast("Saved to database", 2500, "rounded");
    });
  };
  // Reserve A Machine
  $scope.reserve = function (machine, name) {
    name = name || getData("username") || prompt('What is your name?', '');
    name = capitalizeFirstLetter(name);
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
    if ($(window).width() < 900) {
      $("#navRight").hide();
    } else {
      $("#navRight").show();
    }
  });
  $(window).resize();
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener("keydown", function (e) {
    switch (e.which) {
      case 83:
        if (e.ctrlKey) {
          e.preventDefault();
          angular.element(document.body).scope().save();
        }
    }
  });
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