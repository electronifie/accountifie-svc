var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var splitTimer = require('../../helpers/timer');

module.exports = new LedgerRequestHandler({
  validateBody: {
    'accounts':                { type: 'string' },
    'from':                    { type: 'string' },
    'to':                      { type: 'string' },
    'withCounterparties':      { type: 'string' },
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
    withCounterparties:      body.withCounterparties && body.withCounterparties.split(',')
  };
  delete body.excludingCounterparties;
  delete body.excludingContraAccounts;
  delete body.withCounterparties;

  var balances = ledger.balances(body);
  timer.split('got_balances');
  timer.stop();

  cb(null, balances);
});
