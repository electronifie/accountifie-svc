var GeneralLedger = require('../../../models/generalLedger');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'transactionId': 'id' },
  validateBody: GeneralLedger.schema.transaction,
  commitLedger: true
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;

  ledger.updateTransaction({
    rawTransaction: body
  });
  cb(null, ledger.toJson());
});
