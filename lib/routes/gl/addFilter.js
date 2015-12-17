var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

/**
 * @api {post} /gl/:LEDGER_ID/add-filter add filter
 * @apiGroup Ledger.Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Add a filter for caching balances. This will speed up balance
 *   requests containing a matching filters.
 *
 * @apiParam {CounterpartyId[]} excludingCounterparties
 *   IDs of transaction counterparties to exclude with the filter
 * @apiParam {AccountId[]} excludingContraAccounts
 *   IDs of transaction countra accounts to exclude with the filter
 * @apiParam {CounterpartyId[]} [withCounterparties]
 *   IDs of transaction counterparties to limit with the filter. All others will be
 *   excluded.
 *
 * @apiParamExample {x-www-form-urlencoded} Request-Example:
 *   excludingCounterparties=foobar-llc,foobar-inc
 *   excludingContraAccounts=chase-saving,chase-checking
 *   withCounterparties=staples,ubs
 */
module.exports = new LedgerRequestHandler({
  validateBody: {
    'excludingCounterparties':   { type: 'string', required: true },
    'excludingContraAccounts':   { type: 'string', required: true  },
    'withCounterparties':        { type: 'string' }
  },
  commitLedger: true
}).handle(function (options, cb) {
  var excludingCounterparties = options.body.excludingCounterparties.split(',');
  var excludingContraAccounts = options.body.excludingContraAccounts.split(',');
  var withCounterparties =      options.body.withCounterparties && options.body.withCounterparties.split(',');
  var ledger = options.ledger;

  ledger.registerFilter({
    excludingCounterparties: excludingCounterparties,
    excludingContraAccounts: excludingContraAccounts,
    withCounterparties: withCounterparties
  });
  cb(null, ledger.toJson());
});
