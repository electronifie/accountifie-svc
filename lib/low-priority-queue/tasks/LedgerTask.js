var format = require('format');
var log = require('llog');

var LedgerTask = function (options) {
  this.ledgerId = options.ledgerId;
  this.methodName = options.methodName;
  this.methodOptions = options.methodOptions;

  this.description = this._description();
};

LedgerTask.prototype = {
  run: function (cb) {
    log.trace('Executing LedgerTask: ', this.description);
    this._getLedger(this.ledgerId, function (err, ledger) {
      if (err) return cb(err);
      if (!ledger) return cb(new Error('Could not find ledger: ', ledger));

      try {
        var result = ledger[this.methodName](this.methodOptions);
        cb(null, result);
      } catch (e) {
        cb(new Error(
          'Error processing LedgerTask.\n' +
          'Description: ' + this.description.details + '\n' +
          'Options: ' + JSON.stringify(this.methodOptions) + '\n' +
          'Error: ' + e.stack
        ));
      }
    }.bind(this));
  },

  /**
   * Fetch the ledger. Extracted for easy mocking. Required in-line to prevent circular dependency on init.
   *
   * @param ledgerId {string}
   * @param cb {Function}
   * @private
   */
  _getLedger: function (ledgerId, cb) { require('../../models/generalLedgerRepository').getFromCache(ledgerId, cb); },

  _description: function () {
    return {
      details: format('Calling method "%s" in ledger %s', this.methodName, this.ledgerId),
      methodOptions: this.methodOptions
    }
  }
};

module.exports = LedgerTask;
