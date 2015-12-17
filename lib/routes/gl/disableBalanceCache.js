var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/disable-balance-cache disable balance cache
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   DEPRECATED. Speed up insertion of transactions by preventing auto-generation
 *   of balances. No longer necessary, as the Low Priority Queue now means that
 *   requests take precedence over balance generation.
 */
module.exports = new LedgerRequestHandler({
  commitLedger: true
}).handle(function (options, cb) {
  var ledger = options.ledger;
  ledger.disableBalanceCache();
  cb(null, ledger.toJson());
});
