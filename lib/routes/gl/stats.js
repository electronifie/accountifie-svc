var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
}).handle(function (options, cb) {
  var ledger = options.ledger;
  cb(null, ledger.statsJson());
});
