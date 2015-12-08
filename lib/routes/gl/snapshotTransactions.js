var generalLedgerRepository = require('../../models/generalLedgerRepository');
var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var moment = require('moment');
var mongo = require('../../mongo');
var parseDate = require('../../helpers/parseDate');

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
