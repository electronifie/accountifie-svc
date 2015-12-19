var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {get} /gl/:LEDGER_ID/account/:ACCOUNT_ID/transactions transactions
 * @apiGroup Account
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   A list of transactions for the account.
 *
 * @apiParam {Date=YYYY-MM-DD} [from]
 *   Start date of the period to be returned
 * @apiParam {Date=YYYY-MM-DD} [to]
 *   End date of the period to be returned
 * @apiParam {CounterpartyId[]} excludingCounterparties
 *   exclude transactions that have these counterparties
 * @apiParam {AccountId[]} excludingContraAccounts
 *   exclude transactions that have these contra accounts
 * @apiParam {CounterpartyId[]} [withCounterparties]
 *   only return transactions with these counterparties
 *
 * @apiUse SingleAccountTransactionsResponse
 *
 */
module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'accountId': 'account' },
  validateBody: {
    'account':                 { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'withCounterparties':      { type: 'string' },
    'excludingCounterparties': { type: 'string' },
    'excludingContraAccounts': { type: 'string' }
  }
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;
  body.filter = {
    excludingCounterparties: body.excludingCounterparties && body.excludingCounterparties.split(','),
    excludingContraAccounts: body.excludingContraAccounts && body.excludingContraAccounts.split(','),
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;

  cb(null, ledger.transactions(body));
});
