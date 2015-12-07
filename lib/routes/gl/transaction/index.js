var GeneralLedger = require('../../../models/generalLedger');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'transactionId': 'id' },
  validateBody: {
    'id': { type: 'string', required: true }
  },
  commitLedger: true
}).handle(function (options, cb) {
    var body = options.body;
    var ledger = options.ledger;
    var transactions = ledger.transaction(body);
    var json = transactions.map(function (transaction) { return transaction.toJson(); });
    if (json.length === 1) {
      json = json[0];
    }

    cb(null, json);
  });
