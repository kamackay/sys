var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  // Pull from the database
  $scope.update = function () {
    $http.get('/get/').then(function (data) {
      $scope.machines = data.data;
      Materialize.toast("Updated from database", 2500, "rounded");
    });
  };
  // remove all of the edit flags from the data
  $scope.noEdit = function () {
    for (var x = 0; x < $scope.machines.length; x++) $scope.machines[x].edit = undefined;
  };
  window.setInterval(() => {
    if (document.getElementById('autoUpdate').checked) {
      $scope.update();
    }
  }, 1000 * 60); // Update periodically
  $scope.update();
  $scope.msg = "";
  // Push changes from the database
  $scope.save = function () {
    $scope.noEdit();
    $http.post('/put/', $scope.machines).then(function (data) {
      Materialize.toast("Saved to database", 2500, "rounded");
    });
  };
  // Reserve A Machine
  $scope.reserve = function (machine, name) {
    if (name === undefined) name = prompt('What is your name?', 'Name')
    for (var i = 0; i < $scope.machines.length; i++) {
      if ($scope.machines[i].name === machine) {
        $scope.machines[i].available = false;
        $scope.machines[i].reservedBy = name;
        $scope.machines[i].reservedAt = new Date().getTime();
      }
    }
  };
  // Release A Machine
  $scope.release = function (machine) {
    // Find the machine by it's name and release it
    for (var i = 0; i < $scope.machines.length; i++) {
      if ($scope.machines[i].name === machine) {
        $scope.machines[i].available = true;
        $scope.machines[i].reservedBy = "";
        $scope.machines[i].reservedAt = undefined;
        return;
      }
    }
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
      reservedBy: ""
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
});

// Stuff to do once the full page load is done
$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $('.tooltipped').tooltip({
    delay: 50
  });
  if (getData("auto_update") === "true") document.getElementById('autoUpdate').setAttribute("checked", true);
  else if (getData("auto_update") === "false") document.getElementById("autoUpdate").removeAttribute("checked");
  /*const iEl = $("#searchbox").find("i").first();
  const animationLength = 1000;
  iEl.click(function (e) {
    const searchInput = $("#searchInput");
    if (searchInput.attr("state") === "closed") {
      searchInput.animate({
        width: "35vw",
        padding: "2px"
      }, {
        duration: animationLength,
        complete: function () {
          searchInput.attr("state", "open");
        }
      });
      iEl.animate({
        color: "#F44336"
      }, {
        duration: animationLength,
        complete: function () {
          iEl.html("clear");
        }
      });
    } else {
      searchInput.animate({
        width: '0px',
        padding: "0px"
      }, {
        duration: animationLength,
        complete: function () {
          searchInput.attr("state", "closed");
        }
      });
      iEl.animate({
        color: "black"
      }, {
        duration: animationLength,
        complete: function () {
          iEl.html("search");
        }
      });
    }
  });
  $("#searchInput").attr("state", "closed");/**/
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