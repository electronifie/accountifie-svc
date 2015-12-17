var GeneralLedger = require('../../models/generalLedger');
var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/create create
 * @apiGroup Ledger
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Creates a ledger. Not strictly necessary as any Ledger request to
 *   an non-existant ledger will be created.
 */
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
