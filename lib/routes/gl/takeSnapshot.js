var generalLedgerRepository = require('../../models/generalLedgerRepository');
var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var log = require('llog');

/**
 * @api {post} /gl/:LEDGER_ID/take-snapshot take snapshot
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Generates a snapshot for the ledger. Improving startup time and snapshot-transaction request time.
 */
module.exports = new LedgerRequestHandler({
  validateBody: { }
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;

  var startTime = Date.now();
  generalLedgerRepository.commit(ledger, { forceSnapshot: true }, function (err) {
    var time = (((Date.now() - startTime) / 1000) | 0);
    log.debug('Taking snapshot of ' + ledger.id + ' took ' + time + 's.')
    return err ? cb(err) : cb(null, { ok: 'ok' });
  });
});
