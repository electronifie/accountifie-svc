var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

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
