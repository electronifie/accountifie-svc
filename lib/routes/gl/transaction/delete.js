var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/transaction/:TRANSACTION_ID/delete delete
 * @apiGroup Transaction
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Deletes the transaction.
 */
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
