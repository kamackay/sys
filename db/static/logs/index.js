var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  $scope.pageName = 'Log Parser';

  $scope.parse = function () {
    var fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    if (files.length == 0) alert("No Files selected, dummy");
    else {
      for (var i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.readAsText(files[i]);
        reader.onload = function (e) {
          const logContents = e.target.result;
        };
      }
    }
  };
});

// Stuff to do once the full page load is done
$(document).ready(function () {
  window.logOutputDiv = $('#logOutput');
  window.topRowDiv = $('#topRow');
  $('[data-toggle="tooltip"]').tooltip();
  $('.tooltipped').tooltip({
    delay: 50
  });
  $(window).resize(function () {
    if ($(window).width() < 900) {
      $("#navRight").hide();
    } else {
      $("#navRight").show();
    }
    var bottom = window.topRowDiv.position().top + window.topRowDiv.outerHeight(true);
    window.logOutputDiv.css({
      top: '' + (bottom + 10) + 'px'
    })
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