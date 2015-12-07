var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  commitLedger: true
}).handle(function (options, cb) {
    var ledger = options.ledger;
    ledger.disableBalanceCache();
    cb(null, ledger.toJson());
  });
