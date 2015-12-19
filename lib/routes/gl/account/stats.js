var LedgerRequestHandler = require('../../../helpers/ledgerRequestHandler');

/**
 * @api {get} /gl/:LEDGER_ID/account/:ACCOUNT_ID/stats stats
 * @apiGroup Utils
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   General information about the account (e.g. transaction counts, cached balances...)
 */
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
