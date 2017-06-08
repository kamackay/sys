function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  // Pull from the database
  $scope.update = function () {
    console.log("start update");
    $http.get('/machines', {
      timeout: 1000
    }).then(function (data) {
      $scope.machines = data.data;
      console.log("Updated successfully");
      Materialize.toast("Updated from database", 2500, "rounded");
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
      xmlHttp.open("GET", '/machines', true);
      xmlHttp.send(null);
    }
  };
  window.setInterval(periodicUpdate, 1000 * 60);
  // $(window).focus(periodicUpdate);
  $scope.update();
  $scope.msg = "";
  $scope.sortProperty = "id";
  // Push changes from the database
  $scope.save = function () {
    $scope.noEdit();
    // console.log("Start Save");
    // $http.post('/machines/put', {
    //   machines: $scope.machines,
    //   name: getData("username")
    // }).then(function (data) {
    //   Materialize.toast("Saved to database", 2500, "rounded");
    // });
    for (var x = 0; x < $scope.machines.length; x++) {
      const machine = $scope.machines[x];
      if (machine.changed) {
        console.log("Send edited data for", machine.name);
        var httpReq = new XMLHttpRequest();
        httpReq.onreadystatechange = function () {
          if (httpReq.readyState == httpReq.DONE) {
            if (httpReq.status != 200) {
              console.log("Status: ", httpReq.status);
              console.log("Data:", httpReq.responseText);
            } else {
              setTimeout(periodicUpdate, 500);
            }
          }
        };
        httpReq.open("PUT", "/machines/" + machine.name);
        httpReq.setRequestHeader("Content-Type", "application/json");
        httpReq.send(JSON.stringify({
          machine: machine
        }));
      }
    }
  };

  // Reserve A Machine
  $scope.reserve = function (machine, name) {
    name = name || getData("username") || prompt('What is your name?', '');
    name = capitalizeFirstLetter(name);
    if (name === "") return;
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
    var machineName = prompt("Machine Name", "").toUpperCase();
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
      edit: true,
      changed: true
    });
  };
  // Delete a machine (The first one found with the given name)
  $scope.delete = function (machineName) {
    if (window.confirm('Are you sure you want to delete ' + machineName + "?"))
      $http.delete("/machines/" + machineName, {}).then(function (data) {
        $scope.update();
      });
  };

  $scope.getRDP = function (machine) {
    openInNewTab(window.location + "rdp/" + machine.name);
  };

  // Sort by a property
  $scope.sortBy = function (propertyName) {
    $scope.sortReverse = ($scope.sortProperty === propertyName) ? !$scope.sortReverse : false;
    $scope.sortProperty = propertyName;
  };

  $scope.keyPress = function (event) {
    switch (event.keyCode) {
      case 13:
        $scope.save();
        break;
      default:
        //console.log("Keypress", event.keyCode);
        break;
    }
  };
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
  /**document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
  }); /** */
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