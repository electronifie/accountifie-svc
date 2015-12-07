var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

module.exports = new LedgerRequestHandler({
  mapParamsToBody: { 'accountId': 'account' },
  validateBody: {
    'account': { type: 'string' }
  }
}).handle(function (options, cb) {
  var body = options.body;
  var ledger = options.ledger;
  cb(null, ledger._getAccount(body.account).statsJson());
});
