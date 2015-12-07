var GeneralLedger = require('../../models/generalLedger');
var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'companyId': 'id' },
  validateBody: GeneralLedger.schema.ledger,
  skipLedgerFetching: true
}).handle(function (options, cb) {
  var body = options.body;
  this.createLedger(body, function (err, ledger) {
    return err ? cb(err) : cb(null, ledger.toJson());
  });
});
