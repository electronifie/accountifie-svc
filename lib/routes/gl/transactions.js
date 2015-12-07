var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var splitTimer = require('../../helpers/timer');

module.exports = new LedgerRequestHandler({
  validateBody: {
    'accounts':                { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'chunkFrequency':          { type: 'string' },
    'withCounterparties':      { type: 'string' },
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
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;
  delete body.withCounterparties;

  timer.split('get_transactions', body);
  var balances = ledger.transactions(body);
  timer.split('get_transactions');
  timer.stop();

  cb(null, balances);
});
