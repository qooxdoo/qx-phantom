// Generated by CoffeeScript 1.7.1
(function() {
  var CONSOLE, RUNNER, VERBOSE, loadedBefore, page, runnerUrl, testClasses, url;

  RUNNER = "";

  VERBOSE = true;

  CONSOLE = false;

  testClasses = phantom.args[0];

  runnerUrl = (RUNNER != null) && RUNNER !== "" ? phantom.args[1] || RUNNER : phantom.args[1];

  if (runnerUrl == null) {
    throw new Error("No URL configured or given");
  }

  phantom.injectJs("colors.js");

  url = testClasses ? "" + runnerUrl + "?testclass=" + testClasses : "" + runnerUrl;

  page = new WebPage();

  page.onConsoleMessage = function(msg) {
    if (CONSOLE) {
      return console.log("CONSOLE: " + msg);
    }
  };

  page.onError = function(msg, trace) {
    var msgStack;
    msgStack = ["ERROR: " + msg];
    if (trace && trace.length) {
      msgStack.push("TRACE:");
      trace.forEach(function(t) {
        var functionContent;
        functionContent = "";
        if (t["function"]) {
          functionContent = "(in function '" + t["function"] + "')";
        }
        return msgStack.push(" -> " + t.file + ": " + t.line + " " + functionContent);
      });
    }
    console.error(msgStack.join("\n"));
  };

  loadedBefore = false;

  page.open(url, function(status) {
    var isTestSuiteRunning, processTestResults;
    if (status !== "success") {
      console.log("Unable to load page");
      phantom.exit(1);
    }
    if (loadedBefore) {
      return;
    }
    loadedBefore = true;
    isTestSuiteRunning = false;
    window.setTimeout(function() {
      if (!isTestSuiteRunning) {
        console.log("Unable to start test suite");
        return phantom.exit(1);
      }
    }, 120000);
    page.evaluate(function() {
      var runner;
      if (typeof qx === "undefined") {
        console.log("qooxdoo not found");
        return;
      }
      runner = qx.core.Init.getApplication().runner;
      if (runner.getTestSuiteState() !== "ready") {
        return runner.addListener("changeTestSuiteState", function(e) {
          var state;
          state = e.getData();
          if (state === "ready") {
            isTestSuiteRunning = true;
            return runner.view.run();
          }
        });
      } else {
        isTestSuiteRunning = true;
        return runner.view.run();
      }
    });
    processTestResults = function() {
      var error, exception, getRunnerStateAndResults, results, skip, state, success, test, testName, _i, _len, _ref, _ref1;
      getRunnerStateAndResults = function() {
        return page.evaluate(function() {
          var error, runner, state;
          try {
            runner = qx.core.Init.getApplication().runner;
            state = runner.getTestSuiteState();
          } catch (_error) {
            error = _error;
            console.log("Error while getting the test runners state and results");
            return [null, null];
          }
          if (state === "finished") {
            return [state, runner.view.getTestResults()];
          } else {
            return [state, null];
          }
        });
      };
      _ref = getRunnerStateAndResults(), state = _ref[0], results = _ref[1];
      if (!state) {
        return;
      }
      if (state === "error") {
        console.log("Error running tests");
        phantom.exit(1);
      }
      if (state === "finished") {
        success = [];
        skip = [];
        error = [];
        for (testName in results) {
          test = results[testName];
          if (test.state === "success") {
            success.push(testName);
            if (VERBOSE) {
              console.log("PASS".green + (" " + testName));
            }
          }
          if (test.state === "skip") {
            skip.push(testName);
            if (VERBOSE) {
              console.log("SKIP".yellow + (" " + testName));
            }
          }
          if (test.state === "error" || test.state === "failure") {
            error.push(testName);
            console.log("FAIL".red + (" " + testName));
            _ref1 = test.messages;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              exception = _ref1[_i];
              exception = exception.replace(/\n$/, "");
              exception = exception.replace(/\n/g, "\n  ");
              console.log(">>>> " + exception);
            }
          }
        }
        console.log("Finished running test suite.");
        console.log(("(" + success.length + " succeeded, ") + ("" + skip.length + " skipped, ") + ("" + error.length + " failed)"));
        return phantom.exit(error.length);
      }
    };
    return window.setInterval(processTestResults, 500);
  });

}).call(this);
