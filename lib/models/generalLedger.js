var _ = require('lodash');
var Account = require('./account');
var BigNumber = require('bignumber.js');
var Entity = require('sourced').Entity;
var log = require('llog');
var moment = require('moment');
var parseDate = require('../helpers/parseDate');
var schema = require('validate');
var Transaction = require('./transaction');
var util = require('util');

var sid = function (id) { return ('' + id).replace(/\./g, '~'); }; // Sanitized ID: mongo doesn't like dots in keys

function GeneralLedger() {
  this.id = null;

  // Raw data
  this._accounts = {};
  this._transactions = [];
  this._baseFilters = [];

  this._balanceCacheEnabled = true;

  Entity.apply(this, arguments);
}

util.inherits(GeneralLedger, Entity);

GeneralLedger.prototype.init = function (options) {
  this.digest('init', options);
  this.id = options.id;
};

GeneralLedger.prototype.addOrUpdateTransaction = function (options) {
  var exists = !!_.find(this._transactions, function (transaction) { return transaction.id == options.rawTransaction.id; });
  if (exists) {
    this.updateTransaction(options);
  } else {
    this.addTransaction(options);
  }
};

GeneralLedger.prototype.allTransactions = function () {
  return _.invoke(this._transactions, 'toJson');
};

GeneralLedger.prototype.addTransaction = function (options) {
  var rawTransaction = options.rawTransaction;
  GeneralLedger.schema.transaction.assert(rawTransaction);
  this.digest('addTransaction', options);

  var transaction = new Transaction(rawTransaction);
  this._transactions.push(transaction);

  transaction.accounts().forEach(function (account) {
    this._getAccount(account).addTransaction(transaction);
  }.bind(this));
};

GeneralLedger.prototype.deleteTransaction = function (options) {
  // This could be made more efficient.
  var existingTransaction = _.find(this._transactions, function (transaction) { return transaction.id === options.id; });

  if (!existingTransaction) {
    log.warn('Could not find transaction [%s] to delete.', options.id);
    return;
  }

  this.digest('deleteTransaction', options);

  // Remove all lines and perform update to remove this transaction from accounts and their balances.
  var rawTransaction = _.clone(existingTransaction);
  rawTransaction.lines = [];
  this._updateTransaction(rawTransaction);

  this._transactions = _.reject(this._transactions, function (transaction) { return transaction.id === options.id; });
};

GeneralLedger.prototype.updateTransaction = function (options) {
  var rawTransaction = options.rawTransaction;
  GeneralLedger.schema.transaction.assert(rawTransaction);
  this.digest('updateTransaction', options);

  this._updateTransaction(rawTransaction);
};

GeneralLedger.prototype.forceBalanceCacheGeneration = function (options) {
  this.digest('forceBalanceCacheGeneration', options);
  var accountId = options.accountId;
  this._getAccount(accountId).forceGenerateBalanceCache(options);
};

GeneralLedger.prototype.disableBalanceCache = function () {
  this.digest('disableBalanceCache');
  this._balanceCacheEnabled = false;
  _.each(this._accounts, function (account) { account.disableBalanceCache(); })
};

GeneralLedger.prototype.enableBalanceCache = function () {
  this.digest('enableBalanceCache');
  this._balanceCacheEnabled = true;
  _.each(this._accounts, function (account) { account.enableBalanceCache(); });
};

GeneralLedger.prototype.erase = function () {
  this.digest('erase');
  this._transactions = [];
  this._accounts = {};
};


  /**
   * @apiDefine MultiAccountTransactionsResponse
   *
   * @apiSuccess {TransactionId:Transaction[]}  _                           an account-id-indexed list of transactions
   * @apiSuccess (Transaction) {TransactionId}  transaction.id              id of the transaction
   * @apiSuccess (Transaction) {String}         transaction.date            date the transaction occurred (YYYY-MM-DD)
   * @apiSuccess (Transaction) {String}         transaction.dateEnd         for multi-day transactions, date the transaction ends (YYYY-MM-DD)
   * @apiSuccess (Transaction) {String}         transaction.comment         comment added for the transaction
   * @apiSuccess (Transaction) {AccountId[]}    transaction.contraAccounts  the account(s) with transactions that balance this transaction
   * @apiSuccess (Transaction) {CounterpartyId} transaction.counterparty    id of the transaction's counterparty
   * @apiSuccess (Transaction) {Number}         transaction.amount          amount of the transaction
   *
   * @apiSuccessExample {json} Success-Response:
   *   {
   *     'chase-checking': [
   *       {
   *         "id": "1",
   *         "date": "2014-03-07",
   *         "dateEnd": "",
   *         "comment": "123: Cleaning",
   *         "contraAccounts": [ "7022" ],
   *         "counterparty": "bedbath",
   *         "amount": "-280.28"
   *       },
   *       {
   *         "id": "2",
   *         "date": "2014-03-10",
   *         "dateEnd": "2014-05-01",
   *         "comment": "124: Apple",
   *         "contraAccounts": [ "1701" ],
   *         "counterparty": "apple",
   *         "amount": "-13050.30"
   *       }
   *     ]
   *   },
   *   'chase-saving': [
   *   ...
   */
  /**
   * @apiDefine SingleAccountTransactionsResponse
   *
   * @apiSuccess {Transaction[]}  _                                         a list of transactions
   * @apiSuccess (Transaction) {TransactionId}  transaction.id              id of the transaction
   * @apiSuccess (Transaction) {String}         transaction.date            date the transaction occurred (YYYY-MM-DD)
   * @apiSuccess (Transaction) {String}         transaction.dateEnd         for multi-day transactions, date the transaction ends (YYYY-MM-DD)
   * @apiSuccess (Transaction) {String}         transaction.comment         comment added for the transaction
   * @apiSuccess (Transaction) {AccountId[]}    transaction.contraAccounts  the account(s) with transactions that balance this transaction
   * @apiSuccess (Transaction) {CounterpartyId} transaction.counterparty    id of the transaction's counterparty
   * @apiSuccess (Transaction) {Number}         transaction.amount          amount of the transaction
   *
   * @apiSuccessExample {json} Success-Response:
   *   [
   *     {
   *       "id": "1",
   *       "date": "2014-03-07",
   *       "dateEnd": "",
   *       "comment": "123: Cleaning",
   *       "contraAccounts": [ "7022" ],
   *       "counterparty": "bedbath",
   *       "amount": "-280.28"
   *     },
   *     {
   *       "id": "2",
   *       "date": "2014-03-10",
   *       "dateEnd": "2014-05-01",
   *       "comment": "124: Apple",
   *       "contraAccounts": [ "1701" ],
   *       "counterparty": "apple",
   *       "amount": "-13050.30"
   *     }
   *  ]
   */
GeneralLedger.prototype.transactions = function (options) {
  var accountIds = ( options.accounts && options.accounts.split(',') ) ||
                   ( options.account ? [options.account] : Object.keys(this._accounts) );
  var from = options.from;
  var to = options.to;
  var filter = options.filter;
  var chunkFrequency = options.chunkFrequency;

  var accountsMap = {};
  accountIds.forEach(function (accountId) {
    accountsMap[accountId] = [];
    if (! (accountId in this._accounts)) return;
    this._getAccount(accountId).getTransactions().forEach(function (transaction) {
      var options = { from: from, to: to, chunkFrequency: chunkFrequency, filter: filter };
      var transactionChunks = transaction.chunkedForAccount(accountId, options);
      // Combines the two arrays without creating a new array
      Array.prototype.push.apply(accountsMap[accountId], _.compact(transactionChunks));
    }.bind(this));
  }.bind(this));

  return options.account ? accountsMap[options.account] : accountsMap;
};

GeneralLedger.prototype.balances = function (options) {
  options = options || {};
  var accounts = (options.accounts && options.accounts.split(',')) || _.keys(this._accounts);
  var from = options.from;
  var to = options.to;
  var filter = options.filter;
  var skipCache = options.skipCache;

  /**
   * @apiDefine BalancesResponse
   *
   * @apiSuccess {Balance[]}           _                        a list of balances
   * @apiSuccess (Balance) {AccountId} balance.id               the account's ID
   * @apiSuccess (Balance) {Number}    balance.openingBalance   the balance at the start of the period
   * @apiSuccess (Balance) {Number}    balance.shift            the change in balance during the period
   * @apiSuccess (Balance) {Number}    balance.closingBalance   the balance at the end of the period
   *
   * @apiSuccessExample {json} Success-Response:
   *  [
   *    {
   *      "id": "boa-checking",
   *      "openingBalance": "0.00",
   *      "shift": "62.62",
   *      "closingBalance": "62.62"
   *    },
   *    {
   *      "id": "boa-credit",
   *      "openingBalance": "0.00",
   *      "shift": "-62.62",
   *      "closingBalance": "-62.62"
   *    }
   *  ]
   */
  return _.chain(this._accounts).pick(accounts).values().value().map(function (account) {
    var balance = account.balance({ from: from, to: to, skipCache: skipCache, filter: filter });
    return {
      id: account.id,
      openingBalance: balance.opening,
      shift: balance.shift,
      closingBalance: balance.closing
    }
  }.bind(this));
};

GeneralLedger.prototype.transaction = function (options) {
  var transactionId = options.id;
  return _.filter(this._transactions, function (transaction) { return transactionId === transaction.id; });
};

GeneralLedger.prototype.toJson = function() {
  return { id: this.id };
};

GeneralLedger.prototype.statsJson = function () {
  return {
    id: this.id,
    accounts: _.chain(this._accounts).map(function (account) {
                 return _.extend({ id: account.id }, account.statsJson() );
               })
               .indexBy('id')
               .value(),
    transactionCount: this._transactions.length,
    baseFilters: this._baseFilters,
    balanceCacheEnabled: this._balanceCacheEnabled
  };
};

/**
 *
 */
GeneralLedger.prototype._updateTransaction = function (rawTransaction) {
  var transaction = _.find(this._transactions, function (transaction) { return transaction.id === rawTransaction.id; });
  if (!transaction) {
    throw new Error('Could not find transaction ' + rawTransaction.id);
  }
  var oldTransaction = transaction.clone();
  transaction.update(rawTransaction);

  var oldTransactionAccounts = oldTransaction.accounts();
  var newTransactionAccounts = transaction.accounts();
  var affectedAccounts = _.union(oldTransactionAccounts, newTransactionAccounts);
  var recalculateUpdatedBalancesFrom = moment.min(parseDate(oldTransaction.date), parseDate(transaction.date));

  affectedAccounts.forEach(function (accountId) {
    var account = this._getAccount(accountId);
    var oldAccountLine = _.includes(oldTransactionAccounts, accountId) && oldTransaction.forAccount(accountId);
    var newAccountLine = _.includes(newTransactionAccounts, accountId) && transaction.forAccount(accountId);

    if (!newAccountLine) {
      account.removeTransaction(transaction);
    } else if (!oldAccountLine) {
      account.addTransaction(transaction);
    } else {
      var isUnchanged =
        ( new BigNumber(newAccountLine.amount).equals(oldAccountLine.amount) ) &&
        ( parseDate(newAccountLine.date).isSame(oldAccountLine.date, 'day') ) &&
        ( (!!newAccountLine.dateEnd) === (!!oldAccountLine.dateEnd) ) && // endDate is set or unset on both
        (
          ( ! transaction.dateEnd) ||
          ( parseDate(newAccountLine.dateEnd).isSame(oldAccountLine.dateEnd, 'day') )
        );

      if ( ! isUnchanged ) {
        account.recalculateBalancesFrom({ date: recalculateUpdatedBalancesFrom });
      }
    }
  }.bind(this));
};

GeneralLedger.prototype._getAccount = function (id) {
  if (!this._accounts[sid(id)]) {
    this._accounts[sid(id)] = new Account({
      id: id,
      ledgerId: this.id,
      filters: this._baseFilters
    });
    if (!this._balanceCacheEnabled) {
      this._accounts[sid(id)].disableBalanceCache();
    }
  }

  return this._accounts[sid(id)];
};

/** @override */
GeneralLedger.prototype.merge = function(snapshot) {
  Entity.prototype.merge.call(this, snapshot);

  this._transactions = _.map(this._transactions, Transaction.deserialize);
  var idIndexedTransactions = _.indexBy(this._transactions, 'id');
  this._accounts = _.mapValues(this._accounts, function (fromSnapshot) {
    return Account.deserialize(idIndexedTransactions, _.extend({ ledgerId: this.id }, fromSnapshot));
  }.bind(this));

  return this;
};

GeneralLedger.prototype.trimSnapshot = function (snapshot) {
  Entity.prototype.trimSnapshot.call(this, snapshot);
  snapshot._accounts = _.mapValues(snapshot._accounts, Account.serialize);
  return snapshot;
};

GeneralLedger.prototype.registerFilter = function (filter) {
  this._baseFilters.push(filter);
  _.each(this._accounts, function (account) { account.registerFilter(filter); });
};

GeneralLedger.schema = {
  ledger: schema({
    id:   { type: 'string', required: true }
  }, { typecast: true }),

  /**
   * @apiDefine TransactionParams
   *
   * @apiParam {Date=YYYY-MM-DD} date
   *   The date the transaction occurred, or the start of the transaction
   *   period (if a multi-day transaction).
   *
   * @apiParam {Date=YYYY-MM-DD} [dateEnd]
   *   The end of the transaction period (if a multi-day transaction).
   *
   * @apiParam {String} comment
   *   A description of the transaction.
   *
   * @apiParam {String} [type]
   *   The transaction's type.
   *
   * @apiParam {String} [bmoId]
   *   An optional ID to link the transaction with a Business Model Object. Multiple
   *   transactions can share this ID.
   *
   * @apiParam {TransactionLine[]} lines
   *   Account entries for the transaction.
   *
   * @apiParam (TransactionLine) {AccountId} accountId
   *   The account for this entry.
   *
   * @apiParam (TransactionLine) {String} amount
   *   The amount of this entry.
   *
   * @apiParam (TransactionLine) {CounterpartyId} counterpartyId
   *   The counterparty for this line.
   *
   * @apiParam (TransactionLine) {Tag[]} tags
   *   The tags for this line.
   *
   * @apiParamExample {json} Request-Example:
   *   {
   *     "date": "2015-01-19",
   *     "comment": "Laptop purchase",
   *     "type": "equip-purchase",
   *     "bmoId": "equip-laptop-01",
   *     "lines": [
   *       { "account": "equipment", "amount": "2000.00", "counterpartyId": "apple" },
   *       { "account": "creditcard", "amount": "-2000.00", "counterpartyId": "apple" }
   *     ]
   *   }
   */
  transaction: schema({
    id:      { type: 'string', required: true },
    bmoId:   { type: 'string' },
    date:    { type: 'string', required: true },
    dateEnd: { type: 'string' },
    comment: { type: 'string', required: true },
    type:    { type: 'string' },
    lines:   {
      type: 'array',
      required: true,
      each: function (v) { GeneralLedger.schema.transactionLine.assert(v); return true; },
      use: function (v) {
        var sum = _.chain(v).pluck('amount').reduce(function (m, v) { return m.plus(v); }, new BigNumber(0)).value();
        if (! sum.equals(0)) {
          throw new Error('Transaction is unbalanced. Expected ' + sum + ' to equal 0.');
        }
        return true;
      }
    }
  }, { typecast: true }),

  transactionLine: schema({
    accountId:      { type: 'string', required: true },
    amount:         { type: 'string', required: true },
    counterpartyId: { type: 'string' },
    tags:           { type: 'array', each: function (v) { return typeof v === 'string'; } }
  }, { typecast: true })
};

module.exports = GeneralLedger;
