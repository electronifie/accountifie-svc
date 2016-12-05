var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var splitTimer = require('../../helpers/timer');
var log = require('llog');

/**
 * @api {get} /gl/:LEDGER_ID/balances balances
 * @apiGroup Ledger
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   Fetch the balances by counterparty for a ledger's account(s).
 *
 * @apiParam {AccountId[]} [accounts]
 *   IDs of accounts to include
 * @apiParam {Date=YYYY-MM-DD} [from]
 *   Start date of the period to be returned
 * @apiParam {Date=YYYY-MM-DD} [to]
 *   End date of the period to be returned
 * @apiParam {CounterpartyId[]} [excludingCounterparties]
 *   IDs of transaction counterparties to exclude from the balances
 * @apiParam {AccountId[]} [excludingContraAccounts]
 *   IDs of transaction countra accounts to exclude from the balances
 * @apiParam {CounterpartyId[]} [withCounterparties]
 *   IDs of transaction counterparties that should be included in the balances. All
 *   others will be excluded.
 * @apiParam {Tag[]} [withTags]
 *   only return transaction lines with these tags
 * @apiParam {Tag[]} [excludingTags]
 *   exclude transaction lines with these tags
 *
 * @apiUse BalancesResponse
 *
 * @apiParamExample {x-www-form-urlencoded} Request-Example:
 *   accounts=boa-checking,boa-credit
 *   from=2015-01-01
 *   to=2015-05-31
 *   excludingCounterparties=foobar-llc,foobar-inc
 *   excludingContraAccounts=chase-saving,chase-checking
 *   withCounterparties=staples,ubs
 */
module.exports = new LedgerRequestHandler({
  validateBody: {
    'accounts':                { type: 'string' },
    'cps':                { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'withCounterparties':      { type: 'string' },
    'withTags':                { type: 'string' },
    'excludingTags':           { type: 'string' },
    'excludingCounterparties': { type: 'string' },
    'excludingContraAccounts': { type: 'string' }
  }
}).handle(function (options, cb) {
  var timer = splitTimer('balances:handle').start();
  var body = options.body;
  var ledger = options.ledger;
  timer.split('get_balances', body);
  body.filter = {
    excludingCounterparties: body.excludingCounterparties && body.excludingCounterparties.split(','),
    excludingContraAccounts: body.excludingContraAccounts && body.excludingContraAccounts.split(','),
    excludingTags:           body.excludingTags && body.excludingTags.split(','),
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(','),
    withTags:                body.withTags && body.withTags.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;
  delete body.excludingTags;
  delete body.withCounterparties;
  delete body.withTags;

  var cpBalances = ledger.cpBalances(body);
  timer.split('got_balances');
  timer.stop();

  cb(null, cpBalances);
});
