var _ = require('lodash');
var parseDate = require('../helpers/parseDate');

var AccountBalanceCache = function () {
  this._balanceGroups = [{
    balances: [],
    filter: {
      excludingCounterparties: [],
      excludingContraAccounts: [],
      withCounterparties: null
    }
  }];
  this._isEnabled = true;
};

AccountBalanceCache.prototype = {
  disable: function () {
    // Clear existing values as there's a big chance they're going
    // to get out of sync.
    this._balanceGroups.forEach(function (group) { group.balances = []; });
    this._isEnabled = false;
  },

  enable: function () { this._isEnabled = true; },

  isEnabled: function () { return this._isEnabled; },

  getMostRecentBalanceBefore: function (options) {
    var endOfDayOn = options.endOfDayOn;
    var filter = options.filter;

    // Normalize to start of day
    var toMomentAtStartOfDay = parseDate(endOfDayOn).add(1, 'day').startOf('day');
    var cachedBalance = _.findLast(this._balances(filter), function (cachedBalance) {
      var cachedBalanceMomentAtStartOfDay = parseDate(cachedBalance.date);
      return cachedBalanceMomentAtStartOfDay.isBefore(toMomentAtStartOfDay) || cachedBalanceMomentAtStartOfDay.isSame(toMomentAtStartOfDay, 'day');
    });
    return cachedBalance;
  },

  invalidateAfter: function (options) {
    var startOfDayOn = options.startOfDayOn;
    var filter = options.filter;

    _.find(this._balanceGroups, function (group) {
      if (! _.isEqual(group.filter, filter)) return false;

      group.balances = _.takeWhile(group.balances, function (cachedBalance) {
        var cachedBalanceDate = parseDate(cachedBalance.date);
        return cachedBalanceDate.isBefore(startOfDayOn) || cachedBalanceDate.isSame(startOfDayOn);
      });
    }.bind(this));
  },

  mostRecentDate: function (options) {
    var filter = options.filter;
    var mostRecent = _.last(this._balances(filter));
    return mostRecent && mostRecent.date;
  },

  addBalance: function (options) {
    if (!this._isEnabled) {
      return;
    }

    var date = options.date;
    var balance = options.balance;
    var filter = options.filter;
    var balances = this._balances(filter);
    var formattedDate = parseDate(date).format('YYYY-MM-DD');
    var existingDates = _.pluck(balances, 'date');

    if (_.contains(existingDates, formattedDate)) {
      return;
    }

    var insertAt = _.sortedLastIndex(existingDates, formattedDate);

    balances.splice(insertAt, 0, {
      date: formattedDate,
      openingBalance: balance
    });
  },

  filters: function () {
    return _.pluck(this._balanceGroups, 'filter');
  },

  addFilters: function (filters) {
    _.each(filters, function (filter) { this._balances(filter); }.bind(this));
  },

  toJson: function () { return _.clone(this._balanceGroups); },

  _balances: function (filter) {
    filter = _.clone(filter);
    filter.excludingCounterparties = filter.excludingCounterparties && filter.excludingCounterparties.sort() || [];
    filter.excludingContraAccounts = filter.excludingContraAccounts && filter.excludingContraAccounts.sort() || [];
    filter.withCounterparties =      filter.withCounterparties && filter.withCounterparties.sort() || null;

    var group = _.find(this._balanceGroups, function (balanceGroup) {
      return _.isEqual(balanceGroup.filter, filter);
    });

    if (!group) {
      group = { balances: [], filter: filter };
      this._balanceGroups.push(group);
    }

    return group.balances;
  }
};

AccountBalanceCache.serialize = function (balanceCache) {
  return balanceCache._balanceGroups;
};

AccountBalanceCache.deserialize = function (memo) {
  var cache = new AccountBalanceCache();
  cache._balanceGroups = memo;
  return cache;
};

module.exports = AccountBalanceCache;
