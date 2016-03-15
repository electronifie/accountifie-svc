var generalLedgerRepository = require('../../../models/generalLedgerRepository');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');
var moment = require('moment');
var mongo = require('../../../mongo');
var parseDate = require('../../../helpers/parseDate');

/**
 * @api {get} /gl/:LEDGER_ID/snapshot/transactions transactions (snapshot)
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Get a list of all transactions in the ledger at a given date. Excludes back-dated transactions
 *   inserted after the date. Useful for reconciling balance differences in report for the same period
 *   but generated at different times.
 *
 * @apiParam {Date=YYYY-MM-DD} snapshotDate
 *   The date of the snapshot.
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'companyId': 'companyId' },
  validateBody: {
    'companyId': { type: 'string' },
    'snapshotDate': { type: 'string' }
  },
  skipLedgerFetching: true
}).handle(function (options, cb) {
    var companyId = options.body.companyId;
    var date = parseDate(options.body.snapshotDate).toDate();
    generalLedgerRepository.getHistorical(companyId, date, function (err, ledger) {
      if (err) return cb(err);
      if (!ledger) {
        // Fallback to backfill collection
        var transactionSnapshotCollection = mongo.db.collection('transactionsnapshotbackfill');
        transactionSnapshotCollection.findOne({
          companyId: companyId,
          date: { $lte: date }
        }, {
          sort: { date: -1 }
        }, function (err, result) {
          if (err) return cb(err);

          if (!result) {
            return cb(null, []);
          } else {
            return cb(null, result.transactions);
          }
        });
      } else {
        return cb(null, ledger.allTransactions());
      }
    });
});
