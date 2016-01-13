var _ = require('lodash');
var Account = require('../../lib/models/account');
var LedgerTask = require('../../lib/low-priority-queue/tasks/LedgerTask');
var lowPriorityQueue = require('../../lib/low-priority-queue/lowPriorityQueue');
var BigNumber = require('bignumber.js');
var chai = require('chai');
var CommitLedgerTask = require('../../lib/low-priority-queue/tasks/CommitLedgerTask');
var GeneralLedger = require('../../lib/models/generalLedger');
var log = require('llog');

chai.config.truncateThreshold = 0;
var assert = chai.assert;

var getTransactionsFromTable = function (transactionsTable) {
  return _.chain(transactionsTable.hashes())
    .filter(function (hash) {
      return !!_.values(hash).join(''); // Remove empty objects (i.e. blank lines)
    })
    .transform(function (memo, transaction) {
      var LINE_RE = /^lines\./;

      if (transaction.id) {
        var transactionInfo = _.omit(transaction, function (value, key) { return LINE_RE.test(key); });
        transactionInfo.lines = [];
        memo.push(transactionInfo);
      }

      var lineInfo = _.chain(transaction)
        .pick(function (value, key) { return LINE_RE.test(key); })
        .mapKeys(function (value, key) { return key.replace(LINE_RE, ''); })
        .mapValues(function (value, key) {
          if (key === 'tags' && !!value) {
            return value.split(',');
          } else {
            return value;
          }
        })
        .value();

      if (_.values(lineInfo).join('')) { // Only add lines with content
        _.last(memo).lines.push(lineInfo);
      }
    }, [])
    .value();
};

module.exports = function () {
  this.Before(function (scenario, cb) {
    this.generalLedger = null;
    this.commitLedgerRuns = [];

    var self = this;
    LedgerTask.prototype._getLedger = function (id, cb) {
      assert.equal(self.generalLedger.id, id);
      cb(null, self.generalLedger);
    };

    CommitLedgerTask.prototype.run = function (cb) {
      log.trace('Executing CommitLedgerTask: ', this.description);
      self.commitLedgerRuns.push(this.ledgerId);
      cb();
    };

    cb();
  });
  this.After(function (scenario, cb) {
    lowPriorityQueue.reset();
    cb();
  });

  this.Given(/^I have an empty general ledger for "([^"]*)"$/, function (ledgerName, callback) {
    this.generalLedger = new GeneralLedger();
    this.snapshot = null;
    this.generalLedger.init({
      id: ledgerName
    });

    callback();
  });

  this.Given(/^balance cache frequency is (\d+) (.+)$/, function (number, unit, callback) {
    Account.CACHE_FREQUENCY = require('moment').duration(1 * number, unit);
    callback();
  });

  this.When(/^I flush the low priority queue$/, function (callback) {
    // Mock GL fetching by the ledgerTask
    var generalLedger = this.generalLedger;

    lowPriorityQueue.flush(function (err) {
      assert.equal(err, undefined);
      callback();
    });
  });

  this.Then(/^the commit\-ledger task should have run with params \[([^\]]+)\]$/, function (expectedLedgers, callback) {
    var expectedLedgersArray = expectedLedgers.split(', ');
    assert.deepEqual(this.commitLedgerRuns, expectedLedgersArray);
    callback();
  });

  this.When(/^I add the transactions:$/, function (transactionsTable, callback) {
    getTransactionsFromTable(transactionsTable).forEach(function (transaction) {
      this.generalLedger.addTransaction({ rawTransaction: transaction });
    }.bind(this));
    callback();
  });

  this.Then(/^I get an "([^"]+)" error when I add the transactions:$/, function (errorType, transactionsTable, callback) {
    assert.throws(function () {
      getTransactionsFromTable(transactionsTable).forEach(function (transaction) {
        this.generalLedger.addTransaction({ rawTransaction: transaction });
      }.bind(this));
    }.bind(this), new RegExp(errorType));
    callback();
  });

  this.When(/^I update the transactions:$/, function (transactionsTable, callback) {
    getTransactionsFromTable(transactionsTable).forEach(function (transaction) {
      this.generalLedger.updateTransaction({ rawTransaction: transaction });
    }.bind(this));
    callback();
  });

  this.When(/^I delete transaction "([^"]*)"$/, function (transactionId, callback) {
    this.generalLedger.deleteTransaction({ id: transactionId });
    callback();
  });

  this.When(/^I save and restore from a snapshot$/, function (callback) {
    var ss = this.generalLedger.snapshot();
    this.generalLedger = new GeneralLedger(ss, []);
    callback();
  });

  this.When(/^I take a snapshot$/, function (callback) {
    this.snapshot = this.generalLedger.snapshot();
    this.generalLedger.newEvents = [];
    callback();
  });

  this.When(/^I restore the ledger$/, function (callback) {
    var oldLedger = this.generalLedger;
    this.generalLedger = new GeneralLedger(this.snapshot, oldLedger.newEvents);
    callback();
  });

  this.Then(
    /^the transaction history for account "([^"]*)" ((?:from \d{4}-\d{2}-\d{2} )?)((?:to \d{4}-\d{2}-\d{2} )?)((?:chunked at "[^"]*" )?)(?:and )?((?:excluding counterparties "[^"]*" )?)(?:and )?((?:excluding contra accounts? "[^"]*" )?)(?:and )?((?:with counterparties? "[^"]*" )?)should be:$/,
    function (account, fromDateStr, toDateStr, chunkFrequencyStr, excludingCounterpartiesStr, excludingContraAccountsStr, withCounterpartiesStr, historyTable, callback) {

      var providedFields = historyTable.raw()[0];

      var fromDate = fromDateStr ? fromDateStr.replace(/^from /, '') : undefined;
      var toDate = toDateStr ? toDateStr.replace(/^to /, '') : undefined;
      var chunkFrequency = chunkFrequencyStr ? chunkFrequencyStr.replace(/^chunked at "([^"]*)" $/, '$1') : undefined;
      var excludingCounterparties = excludingCounterpartiesStr ? excludingCounterpartiesStr.replace(/^excluding counterparties? "([^"]*)" $/, '$1').split(',') : '';
      var excludingContraAccounts = excludingContraAccountsStr ? excludingContraAccountsStr.replace(/^excluding contra accounts? "([^"]*)" $/, '$1').split(',') : '';
      var withCounterparties = withCounterpartiesStr ? withCounterpartiesStr.replace(/^with counterparties? "([^"]*)" $/, '$1').split(',') : '';

      var history = this.generalLedger.transactions({
        account: account,
        from: fromDate,
        to: toDate,
        filter: {
          excludingCounterparties: excludingCounterparties,
          excludingContraAccounts: excludingContraAccounts,
          withCounterparties: withCounterparties
        },
        chunkFrequency: chunkFrequency
      });
      var alteredExpectedHistory = historyTable.hashes().map(function (row) {
        row.contraAccounts = (row.contraAccounts || '').split(','); // contraAccounts needs to be an array
        return row;
      });
      history = history.map(function (item) {
        return _.pick(item, providedFields);
      });
      assert.deepEqual(history, alteredExpectedHistory);
      callback();
    }
  );

  this.Then(/^the transaction lines for tag "([^"]*)" should be:$/, function (tag, table, callback) {
    var providedFields = table.raw()[0];
    var transactions = this.generalLedger.transactions({
      filter: { withTags: [tag] }
    });
    var alteredExpected = table.hashes().map(function (hash) {
      hash.contraAccounts = (hash.contraAccounts || '').split(','); // contraAccounts needs to be an array
      return hash;
    });
    transactions = _.chain(transactions).map(function (t) {
      return t;
    }).flatten().map(function (item) {
      return _.pick(item, providedFields);
    }).value();

    assert.deepEqual(transactions, alteredExpected);
    callback();
  });

  this.Then(
    /^the account balances ((?:from \d{4}-\d{2}-\d{2} )?)((?:to \d{4}-\d{2}-\d{2} )?)((?:excluding counterparties "[^"]*" )?)(?:and )?((?:excluding contra accounts? "[^"]*" )?)(?:and )?((?:with counterparties? "[^"]*" )?)should be:$/,
    function (fromDateStr, toDateStr, excludingCounterpartiesStr, excludingContraAccountsStr, withCounterpartiesStr, balanceTable, callback) {

      var fromDate = fromDateStr ? fromDateStr.replace(/^from /, '') : undefined;
      var toDate = toDateStr ? toDateStr.replace(/^to /, '') : undefined;
      var excludingCounterparties = excludingCounterpartiesStr ? excludingCounterpartiesStr.replace(/^excluding counterparties? "([^"]*)" $/, '$1').split(',') : '';
      var excludingContraAccounts = excludingContraAccountsStr ? excludingContraAccountsStr.replace(/^excluding contra accounts? "([^"]*)" $/, '$1').split(',') : '';
      var withCounterparties = withCounterpartiesStr ? withCounterpartiesStr.replace(/^with counterparties? "([^"]*)" $/, '$1').split(',') : '';

      var balance = this.generalLedger.balances({
        from: fromDate,
        to: toDate,
        filter: {
          excludingCounterparties: excludingCounterparties,
          excludingContraAccounts: excludingContraAccounts,
          withCounterparties: withCounterparties
        }
      });
      assert.deepEqual(balance, balanceTable.hashes());
      callback();
    }
  );

  this.Then(
    /^the cached balances for account "([^"]*)" ((?:excluding counterparties "[^"]*" )?)(?:and )?((?:excluding contra accounts? "[^"]*" )?)(?:and )?((?:with counterparties? "[^"]*" )?)should be:$/,
    function (account, excludingCounterpartiesStr, excludingContraAccountsStr, withCounterpartiesStr, balanceCacheTable, callback) {
      var excludingCounterparties = excludingCounterpartiesStr ? excludingCounterpartiesStr.replace(/^excluding counterparties? "([^"]*)" $/, '$1').split(',') : '';
      var excludingContraAccounts = excludingContraAccountsStr ? excludingContraAccountsStr.replace(/^excluding contra accounts? "([^"]*)" $/, '$1').split(',') : '';
      var withCounterparties = withCounterpartiesStr ? withCounterpartiesStr.replace(/^with counterparties? "([^"]*)" $/, '$1').split(',') : '';
      var actual = this.generalLedger._getAccount(account)._balanceCache._balances({
        excludingCounterparties: excludingCounterparties,
        excludingContraAccounts: excludingContraAccounts,
        withCounterparties: withCounterparties
      });
      var actualTrimmed = _.map(actual, function (balance) {
        return _.extend({}, balance, { openingBalance: new BigNumber(balance.openingBalance).toFixed(2) });
      });
      assert.deepEqual(actualTrimmed, balanceCacheTable.hashes());
      callback();
    }
  );

  this.Given(/^I keep balances for a filter((?: excluding counterparties "[^"]*")?)(?:and )?((?: excluding contra accounts? "[^"]*")?)(?:and )?((?: with counterparties? "[^"]*")?)$/,
    function (excludingCounterpartiesStr, excludingContraAccountsStr, withCounterpartiesStr, callback) {
      var excludingCounterparties = excludingCounterpartiesStr ? excludingCounterpartiesStr.replace(/^ excluding counterparties "([^"]*)"$/, '$1').split(',') : '';
      var excludingContraAccounts = excludingContraAccountsStr ? excludingContraAccountsStr.replace(/^ excluding contra accounts? "([^"]*)"$/, '$1').split(',') : '';
      var withCounterparties = withCounterpartiesStr ? withCounterpartiesStr.replace(/^ with counterparties? "([^"]*)"$/, '$1').split(',') : '';
      this.generalLedger.registerFilter({
        excludingCounterparties: excludingCounterparties,
        excludingContraAccounts: excludingContraAccounts,
        withCounterparties: withCounterparties
      });
      callback();
    }
  );
};
