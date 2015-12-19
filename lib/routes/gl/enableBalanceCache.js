var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');


/**
 * @api {post} /gl/:LEDGER_ID/enable-balance-cache enable balance cache
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   DEPRECATED. Re-enable the balance cache. See "disable balance cache".
 */
module.exports = new LedgerRequestHandler({
  commitLedger: true
}).handle(function (options, cb) {
  var ledger = options.ledger;
  ledger.enableBalanceCache();
  cb(null, ledger.toJson());
});
