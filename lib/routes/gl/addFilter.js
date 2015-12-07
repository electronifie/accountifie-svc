var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');

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
