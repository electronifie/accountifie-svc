var fs   = require('fs');
var path = require('path');

module.exports.init = function (app) {
  /**
   * @api {get} / ping
   * @apiName Basic response
   * @apiGroup Util
   * @apiSuccess {String} ok The text 'ok'
   * @apiVersion 1.0.0
   * @apiSuccessExample {json} Success-Response:
   *  { ok: "ok" }
   */
  app.get( '/',                                                 function (req, res) { res.json({ ok: 'ok' }); });

  /********************************************************************************************************** Ledger **/
  app.post('/gl/:companyId/create',                             require('./gl/create'));
  app.get( '/gl/:companyId/balances',                           require('./gl/balances'));
  app.get( '/gl/:companyId/cpBalances',                           require('./gl/cpBalances'));
  app.get( '/gl/:companyId/transactions',                       require('./gl/transactions'));
  app.post('/gl/:companyId/erase',                              require('./gl/erase'));
  app.get( '/gl/:companyId/stats',                              require('./gl/stats'));

  /***************************************************************************************************** Transaction **/
  app.get( '/gl/:companyId/transaction/:transactionId',         require('./gl/transaction/index'));
  app.post('/gl/:companyId/transaction/:transactionId/create',  require('./gl/transaction/create'));
  app.post('/gl/:companyId/transaction/:transactionId/update',  require('./gl/transaction/update'));
  app.post('/gl/:companyId/transaction/:transactionId/upsert',  require('./gl/transaction/upsert'));
  app.post('/gl/:companyId/transaction/:transactionId/delete',  require('./gl/transaction/delete'));

  /************************************************************************************************ BMO Transactions **/
  app.post('/gl/:companyId/bmo-transactions/:bmoId/delete',     require('./gl/bmo-transactions/delete'));

  /********************************************************************************************************* Account **/
  app.get( '/gl/:companyId/account/:accountId/transactions',    require('./gl/account/transactions'));
  app.get( '/gl/:companyId/account/:accountId/stats',           require('./gl/account/stats'));

  /******************************************************************************************************* Snapshots **/
  app.get( '/gl/:companyId/snapshot/transactions',              require('./gl/snapshot/transactions'));
  app.get( '/gl/:companyId/snapshot/balances',                  require('./gl/snapshot/balances'));
  app.post( '/gl/:companyId/snapshot/create',                   require('./gl/snapshot/create'));

  /*********************************************************************************************************** Tools **/
  // Info about the state of the low priority processing queue
  app.get( '/lpq/stats',                                        require('./lpq/stats'));

  // A useful sanity check against complexities with multi-date transactions.
  // Compares account balances generated using cache against those without. Returns any
  // discrepancies that are detected or { ok: 'ok' } if all balances match.
  app.get( '/gl/:companyId/verify-balance-cache',               require('./gl/verifyBalanceCache'));
  app.post('/gl/:companyId/disable-balance-cache',              require('./gl/disableBalanceCache'));
  app.post('/gl/:companyId/enable-balance-cache',               require('./gl/enableBalanceCache'));
  app.post('/gl/:companyId/upload-transactions-snapshot',       require('./gl/uploadTransactionsSnapshot'));
  app.post('/gl/:companyId/add-filter',                         require('./gl/addFilter'));
};
