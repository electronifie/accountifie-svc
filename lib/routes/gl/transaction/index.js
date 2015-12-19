var GeneralLedger = require('../../../models/generalLedger');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {get} /gl/:LEDGER_ID/transaction/:TRANSACTION_ID info
 * @apiGroup Transaction
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Information about the transaction.
 *
 * @apiUse TransactionResponse
 */
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
