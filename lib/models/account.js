var _ = require('lodash');
var LedgerTask = require('../low-priority-queue/tasks/LedgerTask');
var BalanceCache = require('./accountBalanceCache');
var BigNumber = require('bignumber.js');
var EventEmitter = require('events').EventEmitter;
var CommitLedgerTask = require('../low-priority-queue/tasks/CommitLedgerTask');
var log = require('llog');
var moment = require('moment');
var parseDate = require('../helpers/parseDate');
var splitTimer = require('../helpers/timer');
var util = require('util');

var START_OF_TIME = moment('1900-01-01', 'YYYY-MM-DD');
var END_OF_TIME   = moment('2900-12-31', 'YYYY-MM-DD');

var BALANCE_CACHE_PRECISION = 20;

var Account = function (raw) {
  var filters = raw.filters;
  this.id = raw.id;
  this.ledgerId = raw.ledgerId;

  this.transactions = raw.transactions || [];
  this._earliestTransactionDate = raw._earliestTransactionDate || undefined;
  this._latestTransactionDate = raw._latestTransactionDate || undefined;
  this._balanceCache = raw._balanceCache || new BalanceCache();
  this._balanceCache.addFilters(filters);
};

util.inherits(Account, EventEmitter);

Account.prototype.registerFilter = function (filter) {
  var filterAsArr = [filter];
  this._balanceCache.addFilters(filterAsArr);

  // Rebuild up to the most recent date in the unfiltered cache
  var upToDate = this._balanceCache.mostRecentDate({ filter: {} });
  var latestCacheDate = upToDate ? parseDate(upToDate).add(Account.CACHE_FREQUENCY) : parseDate(this._latestTransactionDate);
  if (latestCacheDate) {
    this._maybeUpdateBalanceCaches({
      fromDate: latestCacheDate,
      filters: filterAsArr
    })
  }
};

Account.prototype.addTransaction = function (transaction) {
  transaction.forAccount(this.id); // throws Error if there's no line for this account
  this._maybeSetMinMaxDate(transaction.date);
  this.transactions.push(transaction);
  this._maybeUpdateBalanceCaches({ fromDate: transaction.date });
};

Account.prototype.removeTransaction = function (transactionToRemove) {
  var prelength = this.transactions.length;
  this.transactions = _.filter(this.transactions, function (transaction) { return transactionToRemove.id !== transaction.id; });

  if (prelength === this.transactions.length) {
    throw new Error('Could not find transaction "' + transactionToRemove.id + '".');
  } else if (prelength !== (this.transactions.length + 1)) {
    throw new Error('Multiple transactions have ID "' + transactionToRemove.id + '".');
  }
  this.recalculateBalancesFrom({ date: transactionToRemove.date });

};

Account.prototype.getTransactions = function () { return this.transactions; };

Account.prototype.balance = function (options) {
  options = options || {};
  var from = options.from || START_OF_TIME;
  var to = options.to || END_OF_TIME;
  var skipCache = options.skipCache || false;
  var filter = options.filter || {};

  var opening = this._balanceDelta({ to: parseDate(from).clone().subtract(1, 'day').format('YYYY-MM-DD'), skipCache: skipCache, filter: filter });
  var closing = this._balanceDelta({ to: to, skipCache: skipCache, filter: filter });
  var shift = closing.minus(opening);  

  return {
    opening: opening.toFixed(2),
    shift: shift.toFixed(2),
    closing: closing.toFixed(2)
  };
};

Account.prototype.cpBalances = function (options) {
  options = options || {};
  var from = options.from || START_OF_TIME;
  var to = options.to || END_OF_TIME;
  var skipCache = options.skipCache || false;
  var filter = options.filter || {};

  var opening = this._cpBalanceDelta({ cps: true, to: parseDate(from).clone().subtract(1, 'day').format('YYYY-MM-DD'), skipCache: skipCache, filter: filter });
  var closing = this._cpBalanceDelta({ cps: true, to: to, skipCache: skipCache, filter: filter });
  

  return {
    opening: opening,
    closing: closing
  };
};

Account.prototype.recalculateBalancesFrom = function (options) {
  var date = options.date;
  log.trace('Forcing balance recalculation from %s for account %s.', date, this.id);
  this._maybeUpdateBalanceCaches({ fromDate: date });
};

Account.prototype.statsJson = function () {
  return {
    earliestTransaction: this._earliestTransactionDate,
    latestTransaction: this._latestTransactionDate,
    transactionCount: this.transactions.length,
    cachedBalances: this._balanceCache.toJson(),
    balanceCacheEnabled: this._balanceCache.isEnabled()
  };
};

Account.prototype.disableBalanceCache = function () {
  this._balanceCache.disable();
};

Account.prototype.enableBalanceCache = function () {
  this._balanceCache.enable();
  this._maybeUpdateBalanceCaches({ fromDate: this._latestTransactionDate });
};

/**
 * Generate a balance and add to the balance cache, deferred
 * so it doesn't get in the way of more high priority tasks
 * (like handling requests).
 *
 * @param options {{ date: string, filter: Object }}
 */
Account.prototype.deferredGenerateBalanceCache = function (options) {
  if (!this.ledgerId) {
    // for playback of old events
    log.warn('Ignoring generation of ledger balance - ledgerId is not present on account');
    return;
  }

  var ledgerTask = new LedgerTask({
    ledgerId: this.ledgerId,
    methodName: 'forceBalanceCacheGeneration',
    methodOptions: _.extend({ }, options, { accountId: this.id })
  });

  var commitLedgerTask = new CommitLedgerTask({ ledgerId: this.ledgerId, forceSnapshot: true });

  this.emit('addToLowPriorityQueue', ledgerTask);
  this.emit('addToLowPriorityQueue', commitLedgerTask);
};

/**
 * Generate a balance and add to the balance cache, skipping the
 * queue. Prefer deferredGenerateBalanceCache over this.
 *
 * @param options
 */
Account.prototype.forceGenerateBalanceCache = function (options) {
  var filter = options.filter;
  var date = parseDate(options.date);
  var balanceTo = date.clone().subtract(1, 'day').endOf('day');
  var balance = this.balance({ to: balanceTo, filter: filter }).closing;

  this._addToBalanceCache({
    date: date.toDate(),
    balance: balance,
    filter: filter
  });

  return balance;
};

Account.prototype._maybeSetMinMaxDate = function (rawDate) {
  var date = parseDate(rawDate);
  if ( ( ! this._earliestTransactionDate) || date.isBefore(this._earliestTransactionDate)) {
    this._earliestTransactionDate = date.format('YYYY-MM-DD');
  }
  if ( ( ! this._latestTransactionDate) || date.isAfter(this._latestTransactionDate)) {
    this._latestTransactionDate = date.format('YYYY-MM-DD');
  }
};

Account.prototype._cpBalanceDelta= function (options) {
  
  var from = options.from;
  var to = options.to || END_OF_TIME;
  var openingBalance = 0;
  var filter = options.filter || {};
  var earliestTransaction = parseDate(this._earliestTransactionDate);
  var checkCache =  ( ! options.skipCache ) && ( ( ! options.from ) || ( earliestTransaction.isAfter(options.from) ) );
  var toMomentAtStartOfDay = parseDate(to).add(1, 'day').startOf('day'); // 'to' is expected endOfDay, so add 1 day to normalize to startOfDay
  var byCP = options.cps || false;

  if (earliestTransaction.isAfter(options.to)) {
    return new BigNumber(0);
  }

  var accountId = this.id;
  var transConfig = { from: from, to: to, filter: filter, precision: BALANCE_CACHE_PRECISION };
  
  var transLines = this.getTransactions().map(function(tr) { return tr.forAccountCPBalances(accountId, transConfig) });
  var lines = [].concat.apply([], transLines);

  var gpd = _.groupBy(lines, "counterpartyId");
  var _aggCPBals = function(memo, l) { return memo.plus(l.amount)};
  return Object.keys(gpd)
               .map(function(key, index) {
                      return {'cp': key, 'total': gpd[key].reduce(_aggCPBals, new BigNumber(0))}
                    }
                    );
};

Account.prototype._balanceDelta= function (options) {
  var timer = splitTimer('account._balanceDelta').start(options);

  var from = options.from;
  var to = options.to || END_OF_TIME;
  var openingBalance = 0;
  var filter = options.filter || {};
  var earliestTransaction = parseDate(this._earliestTransactionDate);
  var checkCache =  ( ! options.skipCache ) && ( ( ! options.from ) || ( earliestTransaction.isAfter(options.from) ) );
  var toMomentAtStartOfDay = parseDate(to).add(1, 'day').startOf('day'); // 'to' is expected endOfDay, so add 1 day to normalize to startOfDay
  
  if (earliestTransaction.isAfter(options.to)) {
    timer.split('got_empty_result');
    timer.stop();
    return new BigNumber(0);
  }

  if (checkCache) {
    var cachedBalance = this._balanceCache.getMostRecentBalanceBefore({
      endOfDayOn: to,
      filter: filter
    });

    if (cachedBalance && toMomentAtStartOfDay.isSame(cachedBalance.date, 'day') ) {
      // We've got an exact hit. No need to do anything else.
      return new BigNumber(cachedBalance.openingBalance);
    }

    from = cachedBalance ? cachedBalance.date : START_OF_TIME;
    openingBalance = cachedBalance ? cachedBalance.openingBalance : 0;

    timer.split('got_openingBalance', { cachedBalanceFound: !!cachedBalance });
  } else {
    timer.split('skipping_cache');
  }

  var accountId = this.id;
  var transactions = this.getTransactions();
  timer.split('got_transactions', { numberOfTransactions: transactions.length});

  var result = _.reduce(transactions, function (memo, transaction) {
    var line = transaction.forAccount(accountId, { from: from, to: to, filter: filter, precision: BALANCE_CACHE_PRECISION });
    return line ? memo.plus(line.amount) : memo;
  }, new BigNumber(openingBalance));
  timer.split('got_result');

  if (checkCache) {
    this._addToBalanceCache({
      date: toMomentAtStartOfDay.format('YYYY-MM-DD'),
      balance: result.toFixed(BALANCE_CACHE_PRECISION),
      filter: filter
    });
  }

  timer.stop();
  return result;
};

Account.prototype._maybeUpdateBalanceCaches = function (options) {
  var filters = options.filters || this._balanceCache.filters();
  if (!this._balanceCache.isEnabled()) {
    return;
  }

  _.each(filters, function (filter) {
    var fromDate = parseDate(options.fromDate);
    var minimumExpectedLatestCacheDate = fromDate.clone().subtract(Account.CACHE_FREQUENCY);
    var initializeCacheAt = parseDate(this._earliestTransactionDate).subtract(Account.CACHE_FREQUENCY);
    var mostRecentCache = parseDate(this._balanceCache.mostRecentDate({ filter: filter }) || initializeCacheAt);
    var rebuildCacheUpTo = moment.max(mostRecentCache, minimumExpectedLatestCacheDate);

    this._balanceCache.invalidateAfter({ startOfDayOn: options.fromDate, filter: filter });

    mostRecentCache = parseDate(this._balanceCache.mostRecentDate({ filter: filter }) || initializeCacheAt);
    while (mostRecentCache.isBefore(rebuildCacheUpTo)) {
      mostRecentCache = mostRecentCache.clone().add(Account.CACHE_FREQUENCY);
      this.deferredGenerateBalanceCache({ date: mostRecentCache.format('YYYY-MM-DD'), filter: filter });
    }
  }.bind(this));
};

Account.prototype._addToBalanceCache = function (options) {
  var filter = options.filter;
  var date = parseDate(options.date);
  var balance = options.balance;
  log.trace('Adding to balance cache:', {
    account: this.id,
    gl: this.ledgerId,
    date: date.format('YYYY-MM-DD'),
    balance: balance,
    filter: filter
  });
  this._balanceCache.addBalance({
    date: date.format('YYYY-MM-DD'),
    balance: balance,
    filter: filter
  });
};

Account.CACHE_FREQUENCY = moment.duration(1, 'month');

Account.deserialize = function (idIndexedTransactions, fromSnapshot) {
  fromSnapshot.transactions = _.map(fromSnapshot.transactions, function (transactionId) { return idIndexedTransactions[transactionId]; });
  fromSnapshot._balanceCache = BalanceCache.deserialize(fromSnapshot._balanceCache);
  return new Account(fromSnapshot);
};

Account.serialize = function (clone) {
  clone.transactions = _.pluck(clone.transactions, 'id');
  clone._balanceCache = BalanceCache.serialize(clone._balanceCache);
  return clone;
};

module.exports = Account;
