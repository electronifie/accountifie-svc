var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var moment = require('moment');
var mongo = require('../../mongo');

/**
 * Adds a list of transactions on a given date for use as a fallback
 * in snapshotTransactions when we have no data at a given time.
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'companyId': 'companyId' },
  validateBody: {
    'companyId': { type: 'string', required: true },
    'date': { type: 'string', required: true },
    'transactions': { required: true },
    'update': { type: 'boolean' }
  },
  skipLedgerFetching: true,
  typecast: false
}).handle(function (options, cb) {
  var companyId = options.body.companyId;
  var date = moment.utc(options.body.date).toDate();
  var transactions = options.body.transactions;
  var doUpdate = !!options.body.update;

  var transactionSnapshotCollection = mongo.db.collection('transactionsnapshotbackfill');
  var record = {
    date: date,
    companyId: companyId,
    transactions: transactions
  };

  if (doUpdate) {
    transactionSnapshotCollection.update({
      date: { $eq: date },
      companyId: { $eq: companyId }
    }, record, function (err, result) {
      if (err) return cb(err);

      var matched = result.result.n;
      var modified = result.result.nModified;

      var response = { updated: modified > 0 };
      if (matched === 0) {
        response.warning = 'Could not find any records to update.';
      } else if (matched > 1) {
        response.warning = 'Found ' + matched + ' records, but only updated one.';
      }

      return cb(null, response);
    });
  } else {
    transactionSnapshotCollection.insert(record, function (err, result) {
      if (err) return cb(err);

      return cb(null, { inserted: true });
    });
  }
});
