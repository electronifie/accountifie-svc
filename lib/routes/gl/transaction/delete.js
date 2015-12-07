var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'transactionId': 'id' },
  validateBody: {
    'id': { type: 'string' }
  },
  commitLedger: true
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;
  ledger.deleteTransaction(body);
  cb(null, ledger.toJson());
});
