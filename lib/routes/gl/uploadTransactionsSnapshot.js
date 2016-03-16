var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var moment = require('moment');
var mongo = require('../../mongo');

/**
 * Adds a list of transactions on a given date for use as a fallback
 * in snapshotTransactions when we have no data at a given time.
 */

/**
 * @api {post} /gl/:LEDGER_ID/upload-transactions-snapshot
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Upload a list of transactions to be used as a fallback for /gl/:LEDGER_ID/snapshot/transactions
 *   for use when the transactions aren't available (e.g. from before accountifie-svc was in use).
 *
 * @apiParam {Date=YYYY-MM-DD} date
 *   The date of the snapshot.
 * @apiParam {Transaction[]} transactions
 *   The list of transactions.
 * @apiParam {Boolean} update
 *   Update a previously uploaded snapshot.
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
