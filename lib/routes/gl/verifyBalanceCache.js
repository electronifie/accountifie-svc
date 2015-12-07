var _ = require('lodash');
var BigNumber = require('bignumber.js');
var LedgerRequestHandler = require('../../helpers/ledgerRequestHandler');
var moment = require('moment');
var splitTimer = require('../../helpers/timer');

module.exports = new LedgerRequestHandler({
  validateBody: {
    'accounts': { type: 'string' },
    'from': { type: 'string' },
    'to':   { type: 'string' }
  }
}).handle(function (options, cb) {
    var timer = splitTimer('trialBalance:handle').start();
    var body = options.body;
    var ledger = options.ledger;
    timer.split('get_balances_via_cache', body);
    var balancesWithCache = ledger.getTrialBalance(body);
    timer.split('get_balances_via_cache');

    timer.split('get_balances_without_cache', body);
    var balancesWithoutCache = ledger.getTrialBalance(_.extend({ skipCache: true }, body));
    timer.split('got_balances_without_cache');

    var errors = [];
    _.each(balancesWithCache, function (balanceWithCache, i) {
      var accountId = balanceWithCache.id;
      var balanceWithoutCache = balancesWithoutCache[i];

      if (balanceWithCache.id !== balanceWithoutCache.id) throw new Error('Mismatched accounts');

      if (
        ! (
          new BigNumber(balanceWithCache.openingBalance).equals(balanceWithoutCache.openingBalance) &&
          new BigNumber(balanceWithCache.shift).equals(balanceWithoutCache.shift) &&
          new BigNumber(balanceWithCache.closingBalance).equals(balanceWithoutCache.closingBalance)
        )
      ) {
        var account = ledger._getAccount(accountId);
        var caches = account._balanceCheckpoints;
        var cacheInvestigation = caches.map(function (cache, i) {
          var from = i === 0 ? undefined : caches[i - 1].date;
          var to = moment(cache.date).add(2, 'days').format('YYYY-MM-DD');
          var cachedBalance = account.balance({ to: moment(to).subtract(1, 'day').format('YYYY-MM-DD'), skipCache: false });
          var calculatedBalance = account.balance({ to: moment(to).subtract(1, 'day').format('YYYY-MM-DD'), skipCache: true });
          var delta = new BigNumber(cachedBalance.closing).minus(calculatedBalance.closing);

          return {
            from: from,
            to: to,
            mostRecentCache: cache,
            cachedBalance: cachedBalance,
            calculatedBalance: calculatedBalance,
            delta: delta,
            transactionsSinceCache: delta.equals(0) ? undefined : account.getTransactions({ from: cache.date, to: to }),
            transactions: delta.equals(0) ? undefined : account.getTransactions({ from: from, to: to })
          }
        });

        errors.push({
          withCache: balanceWithCache,
          withoutCache: balanceWithoutCache,
          delta: {
            openingBalance: new BigNumber(balanceWithCache.openingBalance).minus(balanceWithoutCache.openingBalance),
            shift: new BigNumber(balanceWithCache.shift).minus(balanceWithoutCache.shift),
            closingBalance: new BigNumber(balanceWithCache.closingBalance).minus(balanceWithoutCache.closingBalance)
          },
          cacheInvestigation: cacheInvestigation
        });
      }
    });

    timer.stop();

    cb(null, errors.length ? { mismatchedBalances: errors } : { ok: 'ok' });
  });
