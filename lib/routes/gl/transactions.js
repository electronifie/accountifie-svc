var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var splitTimer = require('../../helpers/timer');

/**
 * @api {get} /gl/:LEDGER_ID/transactions transactions
 * @apiGroup Ledger
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   A list of transactions in the ledger.
 *
 * @apiParam {AccountId[]} [accounts]
 *   IDs of accounts to include
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
 * @apiParam {Tag[]} [withTags]
 *   only return transaction lines with these tags
 * @apiParam {String='end-of-month'} [chunkFrequency]
 *   split multi-day transactions into chunks, returning potentially
 *   multiple results for the one transaction. 'from' and 'to' for
 *   these transactions will be set to the start/end of the chunk
 *   period, and the amount will be the amount for the chunk period.
 *
 * @apiUse MultiAccountTransactionsResponse
 *
 */
module.exports = new LedgerRequestHandler({
  validateBody: {
    'accounts':                { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'chunkFrequency':          { type: 'string' },
    'withCounterparties':      { type: 'string' },
    'withTags':                { type: 'string' },
    'excludingCounterparties': { type: 'string' },
    'excludingContraAccounts': { type: 'string' }
  }
}).handle(function (options, cb) {
  var timer = splitTimer('transactions:handle').start();
  var body = options.body;
  var ledger = options.ledger;
  body.filter = {
    excludingCounterparties: body.excludingCounterparties && body.excludingCounterparties.split(','),
    excludingContraAccounts: body.excludingContraAccounts && body.excludingContraAccounts.split(','),
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(','),
    withTags:                body.withTags && body.withTags.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;
  delete body.withCounterparties;
  delete body.withTags;

  timer.split('get_transactions', body);
  var balances = ledger.transactions(body);
  timer.split('get_transactions');
  timer.stop();

  cb(null, balances);
});
