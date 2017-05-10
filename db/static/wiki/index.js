var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  var wikiPage = document.getElementById("wikiPage");
  $scope.get = function () {
    $http.get('../wikipage/main', {
      timeout: 1000
    }).then(function (data) {
      wikiPage.innerHTML = data.data;
      console.log("Updated successfully");
      Materialize.toast("Updated from database", 2500, "rounded");
    }, function (err) {
      console.log("Error", err);
      wikiPage.innerHTML = "ERROR";
    });
  };
  $scope.get();
});