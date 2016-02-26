var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/bmo-transactions/:BMO_ID/delete delete
 * @apiGroup BMO Transactions
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Deletes transactions for the bmo.
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'bmoId': 'bmoId' },
  validateBody: {
    'bmoId': { type: 'string' }
  },
  commitLedger: true
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;
  ledger.deleteBmoTransactions(body);
  cb(null, ledger.toJson());
});
