[![Build Status](https://travis-ci.org/electronifie/accountifie-svc.svg)](https://travis-ci.org/electronifie/accountifie-svc)
[![npm version](https://badge.fury.io/js/accountifie-svc.svg)](https://www.npmjs.com/package/accountifie-svc)
[![GitHub stars](https://img.shields.io/github/release/electronifie/accountifie-svc.svg?style=social&label=Source)](https://github.com/electronifie/accountifie-svc)

<hr>

**To install:** `npm install accountifie-svc -g`  

**To run:** `PORT=5124 MONGO_URL=mongodb://localhost:27017/accountifie accountifie-server`

**To test:** `npm test`

<hr>

A few-frills REST ledger server built to support [**Accountifie**](https://github.com/electronifie/accountifie), but
also works as a standalone server.

Basic features:
 - stores ledgers for multiple companies.
 - stores transactions.
 - groups a transaction's balancing entries across multiple accounts.
 - generates balances for an account at a given date.

Special features:
 - balance caching for faster balance retrieval.
 - multi-day transactions for cases like depreciation.
 - fetching of transaction-list state at a given point in time. Useful for troubleshooting discrepencies.
   in a report for a given date caused by back-dated or updated transactions.
 - filtering of balances to exclude transactions for selected counterparties or contra accounts.

**Accountifie** is a django frontend with advanced permission and reporting features. It provides a platform for you to create custom
objects for your business's domain that result in generated transactions, and tools for tailoring your own financial
reports with advanced export options. More information is available [on github](https://github.com/electronifie/accountifie).

## Ledgers and Accounts and Transactions, oh my!

The world consists of [**General Ledgers**](https://github.com/electronifie/accountifie-svc/blob/master/lib/models/generalLedger.js),
also known as **GLs**. Each GL contains sets of [**Transactions**](https://github.com/electronifie/accountifie-svc/blob/master/lib/models/transaction.js)
and [**Accounts**](https://github.com/electronifie/accountifie-svc/blob/master/lib/models/account.js).

A Transaction contains **Lines**, each with a balance and an Account. All a Transaction's Lines should balance to 0. A Line's
**Contra Accounts** are the Accounts of _all other_ Lines for that transaction. A Transaction may occur on a single date
or, to avoid highly repetitive transactions like depreciation, may be spread across a period (referred to as a **multi-date**
transaction).

An Account contains references to all Transactions that have at least one Line for that Account. An Account also has a
**Balance** at any date. The Balance is calculated by summing the Account's Line amounts up to that date.

The models also contain references to **Counterparties** and **Business Model Objects (BMOs)** which are stored and
returned for convenience, but not really used by the service (except for filtering).

## How it works

The service's focus has been on operational speed, especially when calculating balances. All objects are kept in
memory, sometimes at the cost of startup time. Changes are persisted to mongo using the event sourcing pattern provided
by sourced. Most implementation details have been spec'd out in 
[the tests](https://github.com/electronifie/accountifie-svc/blob/master/features/general-ledger.feature).

#### Persistence with sourced

The system uses [**sourced**](https://github.com/mateodelnorte/sourced) for
persistence, a library that persists and replays method calls with their passed params to restore an entity's
(in our case GeneralLedger) state. This can have some impact on startup time, though uses snapshotting to minimise the
effect.

Sourced has the advantages of leaving a comprehensive audit trail, and enabling us to recreate the state of the system
at a given timestamp - something we've built upon with the
[`/gl/:LEDGER_ID/snapshot/transactions`](http://electronifie.github.io/accountifie-svc/#api-Ledger_Utils-GetGlLedger_idSnapshotTransactions) endpoint.

The best way to see a ledger's state via the database is in the `GeneralLedger.snapshots` collection. To get the latest
snapshot, query by `{id: LEDGER_ID}`, sort by `{version: -1}` and limit to 1 result.

#### Balance generation

Generating balances based on thousands of transactions has some impact on performance, especially as we're using BigNumber to
prevent floating point arithmetic issues. To improve performance, we use a
[**Balance Cache**](https://github.com/electronifie/accountifie-svc/blob/master/lib/models/accountBalanceCache.js) for each
account at the monthly anniversary of the account's first transaction. Generating a balance for a date then involves only
adding the transactions between the date and the Balance Cache immediately prior to the date. To make things even snappier
we also cache the result of every balance request that's processed, so the second time you hit `/gl/myco/balances?date=2015-01-13`
will probably be faster than the first.

Whenever a transaction is added, updated, or deleted, all caches with dates after the transaction are invalidated. Regenerating the
caches can take seconds and, since node is unithreaded, get in the way of processing requests. To overcome this, the task is split
into microtasks (one per cache) which are placed on the
[**Low Priority Queue**](https://github.com/electronifie/accountifie-svc/blob/master/lib/low-priority-queue/lowPriorityQueue.js)
(aka the **LPQ**). The LPQ processes a microtask then sleeps for a bit so requests can be processed. This means the balance caches
could take a few minutes to generate after CUDing some old transactions, resulting in slowed balance fetching, but this is unlikely
to have much real-world impact. You can monitor the status of the LPQ at
[`/lpq/stats`](http://electronifie.github.io/accountifie-svc/#api-Util-GetLpqStats).

Balances may be requested with a **Filter** that excludes Counterparties or Conta Accounts, or limit to a set of Counterparties.
Filtered transactions are unable to use the cached balances generated for unfiltered transactions, nor is a filter able to
use the cached balances for a different filter, as a different set of transactions may be used to calculate the transactions. Because
of this, each balance cache is also associated with a filter.

By default, only unfiltered transactions have balance caches generated automatically, though all requests will have the balance
cached against the filter provided in the request. You can get caches to generate automatically for a filter by using the
[`/gl/:LEDGER_ID/add-filter`](http://electronifie.github.io/accountifie-svc/#api-Ledger_Utils-PostGlLedger_idAddFilter) endpoint.

#### Multi-day transactions

Some Transactions, like depreciation, occur over a period instead of on a given date. These transactions have a `dateEnd` as well
as a `date`. When a balance is calculated on a date that falls part-way through the period, it will contain only the portion of
the transaction's amount for the period that has lapsed. For instance, for a transaction with
`date='2015-01-01', dateEnd='2015-01-04', amount='4.00'`:
  - a balance on `2015-01-01` would include only $1 for that transaction.
  - a balance on `2015-01-02` would include $2
  - a balance on `2015-01-03` would include $3
  - balances on `2015-01-04` and beyond would include all $4

When requesting a list of transactions for a period that contains only a portion of the transaction, the transaction's amount will
reflect the amount during the overlap and the transaction's `date` or `endDate` will be adjusted so the transaction fits within
the specified period. E.g. a transaction with `date='2015-01-01', dateEnd='2015-01-04', amount='4.00'`:
 - for `/gl/myco/tranactions?from=2015-01-02&to=2015-01-10` will return `date='2015-01-02', dateEnd='2015-01-04', amount='3.00'`
 - for `/gl/myco/tranactions?from=2014-12-01&to=2015-01-02` will return `date='2015-01-01', dateEnd='2015-01-02', amount='2.00'`
 - for `/gl/myco/tranactions?from=2015-01-02&to=2015-01-03` will return `date='2015-01-02', dateEnd='2015-01-03', amount='2.00'`

For reporting convenience, you can provide the `chunkFrequency=end-of-month` param to
[`/gl/:LEDGER_ID/transactions`](http://electronifie.github.io/accountifie-svc/#api-Ledger-GetGlLedger_idTransaction), which
will break a multi-day transaction into multiple transactions at each month's boundary.

#### Version history
 - *v1.1.4*  - 2016-12-02 - Add /gl/:LEDGER_ID/cpBalances
 - *v1.1.3*  - 2016-05-18 - Verify unique ID when using /gl/:LEDGER_ID/transaction/:TX_ID/create
 - *v1.1.2*  - 2016-04-08 - Prevent snapshot generation if snapshot already exists
 - *v1.1.1*  - 2016-03-17 
    - Return error if no data available for /gl/:LEDGER_ID/snapshot/create
    - Attempt to use semver properly - the last release should have had a minor version bump. This is a patch.
 - *v1.0.10* - 2016-03-16 
    - Add /gl/:LEDGER_ID/snapshot/balances
    - Move /gl/:LEDGER_ID/snapshot-transactions to /gl/:LEDGER_ID/snapshot/transactions
    - Move /gl/:LEDGER_ID/take-snapshot to /gl/:LEDGER_ID/snapshot/create and require a date be provided
    - Add 'excludeTags' option to /gl/:LEDGER_ID/transactions
    - Accept 'withTags' and 'excludeTags' filter options to /gl/:LEDGER_ID/balances
 - *v1.0.9*  - 2016-03-01 - Fix digest of deleteBmoTransactions.
 - *v1.0.8*  - 2016-02-26 - Fix cconfig bug when globally installed.
 - *v1.0.7*  - 2016-02-26 - Add /gl/:LEDGER_ID/bmo-transactions/:BMO_ID/delete
