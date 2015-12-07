var _ = require('lodash');
var chai = require('chai');
var lowPriorityQueue = require('../../lib/low-priority-queue/lowPriorityQueue');

chai.config.truncateThreshold = 0;
var assert = chai.assert;

module.exports = function () {
  this.Before(function (scenario, callback) {
    lowPriorityQueue.reset();

    this.runFunctionRunCount = {
      defaultFn1: 0
    };
    this.runFunctions = {
      defaultFn1: function (cb) { this.runFunctionRunCount.defaultFn1++; cb(); }.bind(this)
    };
    this.errors = [];

    callback();
  });

  this.Given(/^I have an empty low priority queue$/, function (callback) {
    assert.ok(lowPriorityQueue.isEmpty());

    callback();
  });

  this.Given(/^I add the tasks:$/, function (taskTable, callback) {
    var taskObjects = taskTable.hashes();
    _.each(taskObjects, function (taskObject) {
      var run = this.runFunctions[taskObject.runFunction];

      assert.ok(run);

      lowPriorityQueue.add({
        description: taskObject.description,
        uniquenessHash: taskObject.uniquenessHash || null,
        retainQueueLocationOnReplace: taskObject.retainQueueLocationOnReplace === 'true',
        run: run
      });
    }.bind(this));

    callback();
  });

  this.Then(/^queue should contain items \[([^\]]*)]$/, function (itemDescriptions, callback) {
    var itemDescriptionArray = _.compact(itemDescriptions.split(', '));
    var tasksInQueue = lowPriorityQueue.statsJson().tasksInQueueDescription;
    assert.deepEqual(tasksInQueue, itemDescriptionArray);
    callback();
  });

  this.Then(/^function "([^"]*)" should have run (\d+) times$/, function (functionName, runCount, callback) {
    assert.equal(this.runFunctionRunCount[functionName], runCount);
    callback();
  });

  this.Given(/^I process the next queue item$/, function (callback) {
    lowPriorityQueue.processNext(function (err) {
      if (err) this.errors.push(err);
      callback();
    }.bind(this));
  });

  this.Then(/^no error should occur$/, function (callback) {
    assert.equal(this.errors.length, 0);
    callback();
  });

  this.When(/^I flush the queue$/, function (callback) {
    lowPriorityQueue.flush(function (err) {
      if (err) this.errors.push(err);
      callback();
    });
  });
};
