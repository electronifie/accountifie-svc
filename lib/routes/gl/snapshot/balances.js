var generalLedgerRepository = require('../../../models/generalLedgerRepository');
var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');
var moment = require('moment');
var mongo = require('../../../mongo');
var parseDate = require('../../../helpers/parseDate');

/**
 * @api {get} /gl/:LEDGER_ID/snapshot/balances balances
 * @apiGroup Ledger.Snapshot
 * @apiVersion v1.0.10
 *
 * @apiDescription
 *   Get a list of all balances in the ledger at a given date. Excludes back-dated transactions
 *   inserted after the date. Useful for reconciling balance differences in report for the same period
 *   but generated at different times.
 *
 * @apiParam {Date=YYYY-MM-DD} snapshotDate
 *   The date of the snapshot.
 * @apiParam {AccountId[]} [accounts]
 *   IDs of accounts to include
 * @apiParam {Date=YYYY-MM-DD} [from]
 *   Start date of the period to be returned
 * @apiParam {Date=YYYY-MM-DD} [to]
 *   End date of the period to be returned
 * @apiParam {CounterpartyId[]} excludingCounterparties
 *   IDs of transaction counterparties to exclude from the balances
 * @apiParam {AccountId[]} excludingContraAccounts
 *   IDs of transaction countra accounts to exclude from the balances
 * @apiParam {CounterpartyId[]} [withCounterparties]
 *   IDs of transaction counterparties that should be included in the balances. All
 *   others will be excluded.
 *
 * @apiUse BalancesResponse
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'companyId': 'companyId' },
  validateBody: {
    'companyId':               { type: 'string', required: true },
    'snapshotDate':            { type: 'string', required: true },
    'accounts':                { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'withCounterparties':      { type: 'string' },
    'excludingCounterparties': { type: 'string' },
    'excludingContraAccounts': { type: 'string' }
  },
  skipLedgerFetching: true
}).handle(function (options, cb) {
  var body = options.body;
  body.filter = {
    excludingCounterparties: body.excludingCounterparties && body.excludingCounterparties.split(','),
    excludingContraAccounts: body.excludingContraAccounts && body.excludingContraAccounts.split(','),
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;
  delete body.withCounterparties;

  var companyId = body.companyId;
  var date = parseDate(body.snapshotDate).toDate();

  generalLedgerRepository.getHistorical(companyId, date, function (err, ledger) {
    if (err) return cb(err);
    if (!ledger) {
      return cb(new Error('No ledger found for date.'));
    } else {
      return cb(null, ledger.balances(body));
    }
  });
});
