var app = angular.module('module', ["ui.materialize"]);
app.controller('controller', function ($scope, $http) {
  $scope.pageName = 'Log Parser';

  $scope.parse = function () {
    var fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    if (files.length == 0) alert("No Files selected, dummy");
    else {
      Materialize.toast("Begin Parse", 2500, "rounded");
      for (var i = 0; i < files.length; i++) {
        const file = files.item(i);
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          const logContents = e.target.result;
          const $el = window.logOutputDiv;
          var fileResults = "";
          fileResults += file.name + " - Yep, that's a file<br>";
          // TODO: Not run all of these on every line
          // TODO: Warnings/failures/errors
          // TODO: User-specified strings/patterns to search for?
          // TODO: add colors, marquees, other formatting
          // TODO: Summary of the results for each file/all files
          // A bunch of regex patterns
          var re_start = /Running: (\w+)\.py -> (\w+)/;
          var re_end = /Ran \d tests? in (\d+\.?\d*)s/;
          var re_device = /INFO -\s*MD:(\w+)_(\d+_\d+)/;
          var re_traceback = /Traceback \(most recent call last\):/;
          var re_bcl = />> begin captured logging <</;
          var re_assert_hfile = /INFO -\W+Assert File ID (\d+)/;
          var re_assert_hline = /INFO -\W+Assert Line Number (\d+)/;
          var re_assert_cfile = /INFO -\W+Assert File ID = (\d+)/;
          var re_assert_cline = /INFO -\W+Assert Line ID = (\d+)/;
          var re_pass = /OK/;
          var re_fail = /FAILED \(failures=1\)/;
          var re_error = /FAILED \(errors=1\)/;
          var re_warning = /\<WARNING\>/;
          // Break up the log
          var logSplit = logContents.split('\n');
          fileResults += 'Number of lines: ' + logSplit.length + '<br>';
          // Iterate over each line, search for exciting facts about tests
          var error = '';
          var has_warning = 0
          for (var j = 0; j < logSplit.length; j++) {
            // Find the name of the suite and test case
            var start = re_start.exec(logSplit[j]);
            if (start) {
              suite = '<br>- ' + start[1]
              test = '<br>- ' + start[2]
              fileResults += '<br><br><h5>' + logSplit[j] + '</h5>' + suite + test;
            };
            // Find the total time run
            var end = re_end.exec(logSplit[j]);
            if (end) {
              time = Math.ceil(parseFloat(end[1]) / 60)
              timestr = '<br>- ' + time + ' minute'
              if (time > 1) timestr = timestr + 's'
              fileResults += timestr;
              // Find whether or not the test passed
              var pass = re_pass.exec(logSplit[j + 2])
              if (pass) {
                if (has_warning) fileResults += '<br>- <span style="color: #ff9911">PASS-WR</span>'
                else fileResults += '<br>- <span style="color: #11cc11">PASS</span>'
              };
              var fail = re_fail.exec(logSplit[j + 2])
              if (fail) {
                fileResults += '<br>- <span style="color: #dd1111">FAIL</span>'
              };
              var error = re_error.exec(logSplit[j + 2])
              if (error) {
                fileResults += '<br>- <span style="color: #dd1111">ERROR</span>'
              };
              has_warning = 0
            };
            // Find device type and version/revision
            var device = re_device.exec(logSplit[j]);
            if (device) {
              hardware = device[1]
              firmware = device[2]
              fileResults += '<br>- ' + hardware + '_' + firmware;
            };
            // Find start of traceback
            var bcl = re_bcl.exec(logSplit[j]);
            if (bcl) {
              traceback = '';
              fileResults += '<br>- ' + error;
              error = '';
            };
            if (!traceback) var traceback = re_traceback.exec(logSplit[j]); // Don't erase traceback until the whole thing has been read
            if (traceback) {
              if (error) error = error + '<br>' // Add newline between traceback things
              error = error + logSplit[j];
            };
            // Find host asserts
            var hfile = re_assert_hfile.exec(logSplit[j]);
            if (hfile) {
              hline = re_assert_hline.exec(logSplit[j + 1]);
              assert = hfile[1] + ':' + hline[1]
              fileResults += '<br>- Host Assert [' + assert + ']';
            };
            // Find comms asserts
            var cfile = re_assert_cfile.exec(logSplit[j]);
            if (cfile) {
              cline = re_assert_cline.exec(logSplit[j + 1]);
              assert = cfile[1] + ':' + cline[1]
              fileResults += '<br>- Comms Assert [' + assert + ']';
            };
            // Find warnings
            var warning = re_warning.exec(logSplit[j]);
            if (warning) {
              has_warning = 1
            };
          };
          fileResults += '<br><br><marquee scrollamount="20" direction="right" behavior="alternate" class="noselect"><a><img style="max-height:10px;" src="http://nc45ltgz50q52/lambda.png"></a></marquee>';
          $el.append(fileResults);
        };
      }
    }
  };

  $scope.clearResults = function () {
    window.logOutputDiv.html("");
    document.getElementById('mainForm').reset();
  };

  $scope.downloadInfo = function () {
    const max = 50, min = 5;
    $('#micssface>img').css({left: "" + ((Math.random() *(max - min)) + min) + "vw"})
    $('#micssface').fadeIn(function () {
      setTimeout(function () {
        $('#micssface').fadeOut();
      }, 1500);
    });
    const text = document.getElementById('logOutput').innerHTML;
    const filename = 'parsed.html';
    var el = document.createElement('a');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    el.setAttribute('download', filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };
});

// Stuff to do once the full page load is done
$(document).ready(function () {
  $('#micssface').fadeOut(0);
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