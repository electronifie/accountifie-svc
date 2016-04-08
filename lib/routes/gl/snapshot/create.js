var generalLedgerRepository = require('../../../models/generalLedgerRepository');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');
var log = require('llog');
var moment = require('moment');
var mongo = require('../../../mongo');
var parseDate = require('../../../helpers/parseDate');

/**
 * @api {post} /gl/:LEDGER_ID/snapshot/create create
 * @apiGroup Ledger.Snapshot
 * @apiVersion v1.0.10
 *
 * @apiDescription
 *   create a snapshot of the ledger at the given date (boosts the speed
 *   of snapshot fetching)
 *
 * @apiParam {Date=YYYY-MM-DD} date
 *   The date for which the snapshot should be created.
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'companyId': 'companyId' },
  validateBody: {
    'companyId': { type: 'string' },
    'date':      { type: 'string' }
  },
  skipLedgerFetching: true
}).handle(function (options, cb) {
  var companyId = options.body.companyId;
  var date = parseDate(options.body.date).toDate();

  var startTime = Date.now();
  log.trace('Generating snapshot of ' + companyId + ' for date ' + date);

  generalLedgerRepository.hasSnapshotFor(companyId, date, function (err, hasSnapshot) {

    if (hasSnapshot) {
      log.debug('Snapshot already exists at ' + date + '.');
      return cb(null, { ok: 'ok', createdSnaphot: false });
    }

    generalLedgerRepository.getHistorical(companyId, date, function (err, ledger) {
      if (err) return cb(err);
      if (!ledger) return cb('No data available for date.');

      log.trace('Generating balances for snapshot.');
      ledger.balances({ to: date });
      ledger.balances({ });

      generalLedgerRepository.commit(ledger, { forceSnapshot: true }, function (err) {
        var time = (((Date.now() - startTime) / 1000) | 0);
        log.debug('Taking snapshot of ' + ledger.id + ' at ' + date + ' took ' + time + 's.');
        return err ? cb(err) : cb(null, { ok: 'ok', createdSnaphot: true, runtime: time, version: ledger.version, timestamp: ledger.timestamp, company: companyId, date: date });
      });
    });
  });
});
