var format = require('format');
var log = require('llog');

var CommitLedgerTask = function (options) {
  // Required in-line to prevent circular dependency on init.
  this.repo = require('../../models/generalLedgerRepository');

  this.forceSnapshot = options.forceSnapshot;
  this.ledgerId = options.ledgerId;

  this.description = format('Commit ledger %s.', this.ledgerId);
  // Provide a uniquenessHash so only one commit event will ever
  // be present on the queue for this ledgerId.
  this.uniquenessHash = format('commit-ledger-%s%s', this.ledgerId, this.forceSnapshot ? '-fss' : '');
  // Move to the end of the queue when replacing another
  // CommitLedgerTask for this ledger.
  this.retainQueueLocationOnReplace = false;
};

CommitLedgerTask.prototype = {
  run: function (cb) {
    log.trace('Executing CommitLedgerTask: ', this.description);
    this.repo.getFromCache(this.ledgerId, function (err, ledger) {
      if (err) return cb(err);
      if (!ledger) return cb(new Error('Could not find ledger: ', ledger));

      this.repo.commit(ledger, { forceSnapshot: this.forceSnapshot }, function (err) {
        if (err) return cb(err);
        cb();
      });
    }.bind(this));
  }
};

module.exports = CommitLedgerTask;
