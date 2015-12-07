# accountifie-svc [![Build Status](https://travis-ci.org/electronifie/accountifie-svc.svg)](https://travis-ci.org/electronifie/accountifie-svc)

A REST ledger server with support for:

 - multiple ledgers
 - multi-day transactions
 - running balances
 - fetching ledger state at arbitrary point in time

**To install:** `npm install accountifie-svc -g`  
**To run:** `PORT=5124 MONGO_URL=mongodb://localhost:27017/accountifie accountifie-server`  

# Endpoints

## Ledgers

#### `/gl/LEDGER_ID/create`
Creates a ledger with id `LEDGER_ID`.  
**Type:** `POST`  
**Responds with:** LEDGER_JSON  

#### `/gl/LEDGER_ID/balances`
Information about the ledger.  
**Type:** `GET`  
**Param `accounts` (optional):** comma separated list of account ID to fetch balances for.  
**Param `from` (optional):** start date in format 'YYYY-MM-DD'  
**Param `to` (optional):** to date in format 'YYYY-MM-DD'  
**Param `withCounterparties` (optional):** comma separated list of counterparty IDs to filter transactions by  
**Param `excludingCounterparties` (optional):** comma separated list of counterparty IDs to filter transactions by  
**Param `excludingContraAccounts` (optional):** comma separated list of account IDs to filter transactions by  
**Responds with:** LEDGER_STATS_JSON  

#### `/gl/LEDGER_ID/transactions`
A flat list of transactions in the ledger.  
**Type:** `GET`  

#### `/gl/LEDGER_ID/erase`
Delete the ledger.  
**Type:** `GET`  

#### `/gl/LEDGER_ID/stats`
Information about the ledger.  
**Type:** `GET`  
**Responds with:** LEDGER_STATS_JSON  

## Transactions

#### `/gl/LEDGER_ID/transaction/TRANSACTION_ID`
Transaction details.  
**Type:** `GET`  
**Responds with:** TRANSACTION_JSON  

#### `/gl/LEDGER_ID/transaction/TRANSACTION_ID/create`
Creates a transaction.  
**Type:** `POST`  
**Responds with:** LEDGER_JSON  

#### `/gl/LEDGER_ID/transaction/TRANSACTION_ID/update`
Updates a transaction.  
**Type:** `POST`  
**Responds with:** LEDGER_JSON  

#### `/gl/LEDGER_ID/transaction/TRANSACTION_ID/upsert`
Inserts or updates a transaction.  
**Type:** `POST`  
**Responds with:** LEDGER_JSON  

#### `/gl/LEDGER_ID/transaction/TRANSACTION_ID/delete`
Deletes a transaction.  
**Type:** `POST`  
**Responds with:** LEDGER_JSON  

## Accounts

#### `/gl/LEDGER_ID/account/ACCOUNT_ID/transactions`
List of all transactions for the account.  
**Type:** `GET`  
**Responds with:** \[ TRANSACTION_JSON \]  

#### `/gl/LEDGER_ID/account/ACCOUNT_ID/stats`
Information about the account.  
**Type:** `GET`  
**Responds with:** ACCOUNT_STATS_JSON  

## Snapshots

#### `/gl/LEDGER_ID/snapshot-transactions`  
**Type:** `GET`  

## Misc

#### `/`
**Type:** `GET`  
**Responds with:** 'ok'  

#### `/gl/LEDGER_ID/add-filter`

#### `/lpq/stats`

#### `/gl/LEDGER_ID/disable-balance-cache`

#### `/gl/LEDGER_ID/enable-balance-cache`

#### `/gl/LEDGER_ID/take-snapshot`

#### `/gl/LEDGER_ID/upload-transactions-snapshot`

# Response formats

#### LEDGER_JSON

#### ACCOUNT_JSON

#### TRANSACTION_JSON

#### LPQ_STATS_JSON

#### ACCOUNT_STATS_JSON

#### LEDGER_STATS_JSON

```
  id: String,
  accounts: {
    ACCOUNT_ID: ACCOUNT_STATS_JSON
  },
  transactionCount: Number,
  baseFilters: [ FILTER_JSON ],
  balanceCacheEnabled: Boolean
```

# Implementation details

#### Deferred balance calculation

#### Persistence with sourced
