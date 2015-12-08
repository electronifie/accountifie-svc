var _ = require('lodash');
var async = require('async');
var log = require('llog');
var moment = require('moment');

/**
 * A volatile low-priority queue that minimises its impact on other tasks
 * like handling http requests.
 *
 * Runs one task every _interval ms.
 */
var LowPriorityQueue = function () {
  this._isStarted = false;
  this._scheduledId = null;
  this._processingTimeoutId = null;
  this._intervalMs = 200;
  this._processingTimeoutMs = 60 * 60 * 1000;
  this._queue = [];
  this._queuedHashedTasks = {};

  this._currentTask = null;
  this._processingTimeMaxMs = 0;
  this._taskStatsToRetain = 10;
  this._processedCount = 0;
  this._recentTaskStats = [];
};

LowPriorityQueue.prototype = {
  /**
   * Register a task to be processed by the queue. The task
   * should run for as short a time as possible.
   *
   * The task must contain a 'run' function that will do the
   * work. The return value of the function will be available
   * (with rolling replace) for troubleshooting on the
   * /lpq/stats endpoint.
   *
   * The 'description' string will be included in troubleshooting
   * information on the /lpq/stats endpoint, as well as in logs.
   *
   * If the 'uniquenessHash' is provided, any other task with a
   * matching hash will be removed. If the
   * 'retainQueueLocationOnReplace' flag is set this task will
   * be inserted at the removed task's place in the queue,
   * otherwise it will be inserted at the end. This behavior is
   * useful for tasks like committing the ledger, which can wait
   * until all committable tasks are performed.
   *
   * @param task {{
   *   run: function(cb),
   *   description: String,
   *   uniquenessHash: (String|undefined),
   *   retainQueueLocationOnReplace: (Boolean|undefined)
   * }}
   */
  add: function (task) {
    var uniquenessHash = task.uniquenessHash;
    if (uniquenessHash && this._queuedHashedTasks[uniquenessHash]) {
      // task has uniqueness constraint, and is already in the queue
      var index = _.findIndex(this._queue, function (existingTask) { return existingTask.uniquenessHash === uniquenessHash; });
      if (index === -1) {
        log.warn('Expected task with uniquenessHash "%s" to be in queue, but could not find it.', uniquenessHash);
        this._queue.push(task);
      } else if (task.retainQueueLocationOnReplace) {
        // replace existing task in place with this one
        this._queue[index] = task;
      } else {
        // remove existing task, and re-add to end of queue
        this._queue.splice(index, 1);
        this._queue.push(task);
      }
    } else {
      // task has no uniqueness constraint, or is not yet in the queue
      if (uniquenessHash) {
        this._queuedHashedTasks[uniquenessHash] = true;
      }
      this._queue.push(task);
    }

    this._maybeSchedule();
  },

  /**
   * Start automated processing of the queue, at one task per options.interval ms.
   *
   * @param options ({{ interval: number }}|undefined)
   */
  start: function (options) {
    options = options || {};
    this._intervalMs = _.isNumber(options.interval) ? options.interval : this._intervalMs;
    this._isStarted = true;
    this._processedCount = 0;
    this._maybeSchedule();
  },

  /**
   * Stop automated processing of the queue.
   */
  stop: function () {
    this._isStarted = false;
    clearTimeout(this._scheduledId);
  },

  /**
   * Process a single task on the queue, keeping stats in _recentTaskStats
   * for troubleshooting.
   */
  processNext: function (cb) {
    var task = this._queue.shift();
    if (task) {
      log.trace('Processing low priority queue task:', task.description);
      var start = Date.now();
      var formattedStartTime = moment(start).format('YYYY-MM-DDTHH:mm:ssZZ');

      this._currentTask = {
        startTime: formattedStartTime,
        description: task.description
      };

      // Set a timer to fail hard in case a task silently errors during execution. Without
      // this, the queue would just stop functioning.
      this._processingTimeoutId = setTimeout(function () {
        log.error('Processing of low priority task took longer than %sms.', this._processingTimeoutMs);
        log.error('Task details: ', this._currentTask);
        log.error('This should be investigated. Killing application so you notice.');
        process.exit(1);
      }.bind(this), this._processingTimeoutMs);

      // Force async to prevent nasty stacks when using flush(cb)
      _.defer(function () {
        task.run(function (e, result) {
          clearTimeout(this._processingTimeoutId);
          this._processingTimeoutId = null;
          var timeTakenMs = Date.now() - start;
          this._recentTaskStats.unshift({
            startTime: formattedStartTime,
            timeTakenMs: timeTakenMs,
            description: task.description,
            result: result,
            didError: !!e,
            error: e
          });
          if (task.uniquenessHash) {
            delete this._queuedHashedTasks[task.uniquenessHash];
          }
          this._recentTaskStats = _.take(this._recentTaskStats, this._taskStatsToRetain);
          this._processingTimeMaxMs = _.max([this._processingTimeMaxMs, timeTakenMs]);
          this._processedCount++;
          this._currentTask = null;

          log.trace('Finished processing task. Took %sms and returned:', timeTakenMs, result);
          return cb(e);
        }.bind(this));
      }.bind(this));
    }
  },

  /**
   * Process all tasks in the queue. Useful for testing.
   */
  flush: function (cb) {
    log.info('Flushing low priority queue.');
    async.until(
      function () { return this.isEmpty(); }.bind(this),
      this.processNext.bind(this),
      cb
    );
  },

  /**
   * Is the queue empty?
   *
   * @returns {boolean}
   */
  isEmpty: function () { return this._queue.length === 0; },

  /**
   * Resets the state of the queue. Useful for testing.
   * @returns {boolean}
   */
  reset: function () {
    this._isStarted = false;
    this._scheduledId = null;
    this._processingTimeoutId = null;
    this._intervalMs = 200;
    this._processingTimeoutMs = 60 * 60 * 1000;
    this._queue = [];
    this._queuedHashedTasks = {};

    this._currentTask = null;
    this._processingTimeMaxMs = 0;
    this._taskStatsToRetain = 10;
    this._processedCount = 0;
    this._recentTaskStats = [];
  },

  /**
   * Provide a JSON summary of the state of the queue.
   *
   * @returns {{
   *  isStarted: boolean,
   *  tasksInQueueCount: *,
   *  tasksInQueueDescription: Array,
   *  itemsProcessedSinceStarting: number,
   *  pollingIntervalMs: (number|*),
   *  recentTaskStatsToRetain: number,
   *  recentTaskStats: (Array|*)
   * }}
   */
  statsJson: function () {
    return {
      isStarted: this._isStarted,
      currentTask: this._currentTask,
      tasksInQueueCount: this._queue.length,
      tasksInQueueDescription: this._queue.map(function (task) { return task.description; }),
      itemsProcessedSinceStarting: this._processedCount,
      maxProcessingTimeForSingleTaskMs: this._processingTimeMaxMs,
      pollingIntervalMs: this._intervalMs,
      recentTaskStatsToRetain: this._taskStatsToRetain,
      recentTaskStats: this._recentTaskStats
    };
  },

  /**
   * If:
   *  - the queue is started;
   *  - tasks exist; and,
   *  - a timer is not already running.
   *
   * Then run the next task at the top of the queue after a
   * delay of this._interval ms. Repeat until the queue is empty.
   *
   * Note, this is deliberately not called from within processOne
   * and processAll to make testing easier.
   *
   * @private
   */
  _maybeSchedule: function () {
    if ( (!this._isStarted) || this.isEmpty() || this._scheduledId ) {
      return;
    }

    this._scheduledId = setTimeout(function () {
      this._scheduledId = null;
      this.processNext(function (e) {
        // Log and ignore errors
        if (e) {
          log.error('Got error when processing low priority queue task.');
          log.error(e);
        }
        this._maybeSchedule();
      }.bind(this));
    }.bind(this), this._intervalMs);
  }
};

module.exports = new LowPriorityQueue();
