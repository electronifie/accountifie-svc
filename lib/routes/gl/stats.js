var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

/**
 * @api {get} /gl/:LEDGER_ID/stats stats
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   General information about the ledger (e.g. transaction counts, accounts...)
 */
module.exports = new LedgerRequestHandler({
}).handle(function (options, cb) {
  var ledger = options.ledger;
  cb(null, ledger.statsJson());
});
