var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/erase erase
 * @apiGroup Ledger
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Deletes the ledger.
 */
module.exports = new LedgerRequestHandler({
  commitLedger: true
}).handle(function (options, cb) {
    var ledger = options.ledger;
    ledger.erase();
    cb(null, ledger.toJson());
  });
