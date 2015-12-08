var _ = require('lodash');
var BigNumber = require('bignumber.js');
var moment = require('moment');
var parseDate = require('../helpers/parseDate');

var START_OF_TIME = moment('1900-01-01', 'YYYY-MM-DD');
var END_OF_TIME   = moment('2900-12-31', 'YYYY-MM-DD');
var PREVIOUS_PERIOD_PRECISION = 20;

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

var Transaction = function (raw) {
  this.id = null;
  this.bmoId = null;
  this.date = null;
  this.dateEnd = null;
  this.comment = null;
  this.type = null;
  this.lines = [];

  this.update(raw);
};

Transaction.prototype = {
  accounts: function () { return _.chain(this.lines).pluck('accountId').uniq().value(); },

  update: function (raw) {
    this.id = raw.id;
    this.bmoId = raw.bmoId;
    this.date = raw.date;
    this.dateEnd = raw.dateEnd || '';
    this.comment = raw.comment;
    this.type = raw.type;
    this.lines = raw.lines.map(function (line) {
      return {
        accountId: line.accountId,
        counterpartyId: line.counterpartyId,
        amount: new BigNumber(line.amount).toFixed(2)
      };
    });
  },

  chunkedForAccount: function (accountId, options) {
    var filter = options.filter;
    var from = parseDate(options.from || this.date).startOf('day');
    var to = parseDate(options.to || this.dateEnd).endOf('day');
    var chunkFrequency = options.chunkFrequency;

    if ( ! this.isMultidayTransaction() ) {
      return [ this.forAccount(accountId, options) ];
    }

    var periodGenerators = {
      'end-of-month': this._endOfMonthChunker.bind(this, from, to),
      undefined: function () { return [{ from: from, to: to }]; }
    };

    if (! (chunkFrequency in periodGenerators)) {
      throw new Error('Unknown chunk frequency: ' + chunkFrequency);
    }

    var periods = periodGenerators[chunkFrequency]();

    return _.chain(periods).map(function (period) {
      // override from: and to: in options with those from period
      var newOptions = _.extend({ }, options, period);
      return this.forAccount(accountId, newOptions);
    }.bind(this)).compact().value();
  },

  forAccount: function (accountId, options) {
    options = options || {};
    var from = parseDate(options.from || START_OF_TIME).startOf('day');
    var to = parseDate(options.to || END_OF_TIME).endOf('day');
    var precision = options.precision || 2;
    var filter = options.filter;

    var dateStart = parseDate(this.date);
    var dateEnd = ( this.dateEnd && (this.dateEnd !== this.date) ) ? parseDate(this.dateEnd) : null;

    if ( !this.isInPeriod({ from: from, to: to }) ) {
      return;
    }

    var lines = this._linesForAccount(accountId, filter);

    if ( lines.length === 0 ) {
      return;
    }

    var counterparty = _.chain(lines).pluck('counterpartyId').uniq().value().join(',');
    var amount = lines.length === 1 ? lines[0].amount : _.reduce(lines, function (memo, line) { return memo.plus(line.amount); }, new BigNumber(0)).toFixed(2);

    var amountForPeriod = dateEnd ? this._amountForPeriod(amount, from.clone(), to.clone(), { precision: precision }) : amount;
    var comment = this.comment + ( amountForPeriod !== amount ? ' (prorated)' : '' );

    return {
      id: this.id,
      bmoId: this.bmoId,
      date: moment.max(dateStart, from).format('YYYY-MM-DD'),
      dateEnd: dateEnd ? moment.min(dateEnd, to).format('YYYY-MM-DD') : '',
      comment: comment,
      contraAccounts: this.contraAccounts(accountId),
      counterparty: counterparty,
      amount: amountForPeriod
    };
  },

  contraAccounts: function (accountId) { return _.chain(this.lines).pluck('accountId').without(accountId).uniq().value(); },

  isInPeriod: function(options) {
    var from = options.from || START_OF_TIME;
    var to = options.to || END_OF_TIME;

    return parseDate(this.date).startOf('day').isBefore(to) && parseDate(this.dateEnd || this.date).endOf('day').isAfter(from);
  },

  clone: function () {
    return new Transaction(_.clone(this));
  },

  isMultidayTransaction: function () {
    return this.dateEnd && ( this.dateEnd !== this.date );
  },

  hasCounterpartyInList: function (counterparties) {
    if ( (! counterparties) || counterparties.length === 0) {
      return false;
    }
    var transactionCounterparties = _.chain(this.lines).pluck('counterpartyId').uniq().value();

    return _.intersection(transactionCounterparties, counterparties).length > 0;
  },

  hasContraAccountInList: function (accountId, contraAccounts) {
    if ( (! contraAccounts) || contraAccounts.length === 0) {
      return false;
    }

    return _.intersection(this.contraAccounts(accountId), contraAccounts).length > 0;
  },

  toJson: function () { return _.clone(this); },

  _linesForAccount: function (accountId, filter) {
    filter = filter || {};
    var hasCounterpartyRestriction = !!(filter.excludingCounterparties && filter.excludingCounterparties.length > 0);
    var hasContraAccountsRestriction = !!(filter.excludingContraAccounts && filter.excludingContraAccounts.length > 0);
    var hasWithCounterpartiesRestriction = !!(filter.withCounterparties && filter.withCounterparties.length > 0);

    return _.filter(this.lines, function (line) {
      var hasExcludedCounterparty = hasCounterpartyRestriction && this.hasCounterpartyInList(filter.excludingCounterparties);
      var hasExcludedContraAccount = hasContraAccountsRestriction && this.hasContraAccountInList(accountId, filter.excludingContraAccounts);
      var hasIncludedCounterparty = (!hasWithCounterpartiesRestriction) || _.contains(filter.withCounterparties, line.counterpartyId);
      var hasValidCounterparty = (!hasExcludedCounterparty) && hasIncludedCounterparty;

      return line.accountId === accountId && hasValidCounterparty && (!hasExcludedContraAccount) ;
    }.bind(this));
  },

  _amountForPeriod: function (lineAmount, periodStart, periodEnd, options) {
    options = options || {};
    var precision = options.precision || 2;

    var transactionStart = parseDate(this.date).startOf('day');
    var transactionEnd = parseDate(this.dateEnd || this.date);
    var transactionEndLimit = transactionEnd.clone().add(1, 'day').startOf('day');
    var overlapStart = moment.max(periodStart, transactionStart).clone().startOf('day');
    var overlapEndLimit = moment.min(periodEnd, transactionEnd).clone().add(1, 'day').startOf('day');

    if ( periodStart.isBefore(transactionStart) && periodEnd.isAfter(transactionEnd) ) {
      return lineAmount;
    }

    var transactionLengthInDays = parseDate(transactionEndLimit).diff(transactionStart, 'days');

    // As we cache balances at 2dp, we need to be cautious with rounding
    var amountBeforePeriod = '0';
    if (overlapStart.isAfter(transactionStart)) {
      amountBeforePeriod = this._amountForPeriod(lineAmount, transactionStart.clone(), overlapStart.clone().subtract(1, 'day').endOf('day'), { precision: _.max([PREVIOUS_PERIOD_PRECISION, precision]) });
    }

    var daysTranspired = parseDate(overlapEndLimit).diff(transactionStart, 'days');
    var transpiredPercent = new BigNumber(daysTranspired).dividedBy(transactionLengthInDays);
    var periodAmount = transpiredPercent.times(lineAmount).minus(amountBeforePeriod).toFixed(precision);

    return periodAmount;
  },

  _endOfMonthChunker: function (from, to) {
    var start = moment.max(from, parseDate(this.date)).clone();
    var end = moment.min(to, parseDate(this.dateEnd).endOf('day')).clone();

    var periods = [];
    var periodEnd, periodStart = start;
    while (end.isAfter(periodStart)) {
      periodEnd = moment.min(periodStart.clone().endOf('month'), end);
      periods.push({
        from: periodStart,
        to: periodEnd
      });

      periodStart = periodEnd.clone().add(1, 'day').startOf('day');
    }

    return periods;
  }
};

Transaction.deserialize = function (fromSnapshot) { return new Transaction(fromSnapshot); };

module.exports = Transaction;
