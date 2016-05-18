var GeneralLedger = require('../../../models/generalLedger');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/transaction/:TRANSACTION_ID/create create
 * @apiGroup Transaction
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Create a transaction
 *
 * @apiUse TransactionParams
 *
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'transactionId': 'id' },
  validateBody: GeneralLedger.schema.transaction,
  commitLedger: true
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;

  if (ledger.transaction({ id: body.id }).length) {
    return cb('A transaction with ID "' + body.id + '" already exists.');
  }

  ledger.addTransaction({
    rawTransaction: body
  });
  cb(null, ledger.toJson());
});
