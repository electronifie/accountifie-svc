var _ = require('lodash');
var log = require('llog');

var idCounter = 0;
var indent = 0;

var Timer = function (name) {
  this.id = idCounter++;
  this.name = name;
  this.startTime = null;
};

Timer.prototype = {
  _log: function (message, meta) {
    if (process.env.TIMING_LOGS !== 'true') return;

    var margin = _.pad('', indent * 2);
    var negativeMargin = _.pad('', 6 - (indent * 2));
    var id = _.padRight('' + this.id, 4);
    var name = _.padRight('' + this.name, 10);
    var timeMs = _.padLeft('' + (Date.now() - this.startTime), 7);

    log.trace('%s%s %s: %s[%s]  %s', margin, name, id, negativeMargin, timeMs, message, (meta ? JSON.stringify(meta) : ''));
  },

  start: function (meta) {
    this.startTime = Date.now();
    indent++;
    this._log('START', meta);
    return this;
  },

  stop: function (meta) {
    indent--;
    this._log('STOP', meta);
    return this;
  },

  split: function (message, meta) {
    this._log(message, meta);
    return this;
  }
};

module.exports = function (name) {
  return new Timer(name);
};
