define({ "api": [
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/account/:ACCOUNT_ID/transactions",
    "title": "transactions",
    "group": "Account",
    "version": "v1.0.0",
    "description": "<p>A list of transactions for the account.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "from",
            "description": "<p>Start date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "to",
            "description": "<p>End date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": false,
            "field": "excludingCounterparties",
            "description": "<p>exclude transactions that have these counterparties</p>"
          },
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": false,
            "field": "excludingContraAccounts",
            "description": "<p>exclude transactions that have these contra accounts</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": true,
            "field": "withCounterparties",
            "description": "<p>only return transactions with these counterparties</p>"
          }
        ]
      }
    },
    "filename": "lib/routes/gl/account/transactions.js",
    "groupTitle": "Account",
    "name": "GetGlLedger_idAccountAccount_idTransactions",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Transaction[]",
            "optional": false,
            "field": "_",
            "description": "<p>a list of transactions</p>"
          }
        ],
        "Transaction": [
          {
            "group": "Transaction",
            "type": "TransactionId",
            "optional": false,
            "field": "transaction.id",
            "description": "<p>id of the transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.date",
            "description": "<p>date the transaction occurred (YYYY-MM-DD)</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.dateEnd",
            "description": "<p>for multi-day transactions, date the transaction ends (YYYY-MM-DD)</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.comment",
            "description": "<p>comment added for the transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "AccountId[]",
            "optional": false,
            "field": "transaction.contraAccounts",
            "description": "<p>the account(s) with transactions that balance this transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "CounterpartyId",
            "optional": false,
            "field": "transaction.counterparty",
            "description": "<p>id of the transaction's counterparty</p>"
          },
          {
            "group": "Transaction",
            "type": "Number",
            "optional": false,
            "field": "transaction.amount",
            "description": "<p>amount of the transaction</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": " [\n   {\n     \"id\": \"1\",\n     \"date\": \"2014-03-07\",\n     \"dateEnd\": \"\",\n     \"comment\": \"123: Cleaning\",\n     \"contraAccounts\": [ \"7022\" ],\n     \"counterparty\": \"bedbath\",\n     \"amount\": \"-280.28\"\n   },\n   {\n     \"id\": \"2\",\n     \"date\": \"2014-03-10\",\n     \"dateEnd\": \"2014-05-01\",\n     \"comment\": \"124: Apple\",\n     \"contraAccounts\": [ \"1701\" ],\n     \"counterparty\": \"apple\",\n     \"amount\": \"-13050.30\"\n   }\n]",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/balances",
    "title": "balances",
    "group": "Ledger",
    "version": "v1.0.0",
    "description": "<p>Fetch the balances for a ledger's accounts.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": true,
            "field": "accounts",
            "description": "<p>IDs of accounts to include</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "from",
            "description": "<p>Start date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "to",
            "description": "<p>End date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": false,
            "field": "excludingCounterparties",
            "description": "<p>IDs of transaction counterparties to exclude from the balances</p>"
          },
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": false,
            "field": "excludingContraAccounts",
            "description": "<p>IDs of transaction countra accounts to exclude from the balances</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": true,
            "field": "withCounterparties",
            "description": "<p>IDs of transaction counterparties that should be included in the balances. All others will be excluded.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "accounts=boa-checking,boa-credit\nfrom=2015-01-01\nto=2015-05-31\nexcludingCounterparties=foobar-llc,foobar-inc\nexcludingContraAccounts=chase-saving,chase-checking\nwithCounterparties=staples,ubs",
          "type": "x-www-form-urlencoded"
        }
      ]
    },
    "filename": "lib/routes/gl/balances.js",
    "groupTitle": "Ledger",
    "name": "GetGlLedger_idBalances",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Balance[]",
            "optional": false,
            "field": "_",
            "description": "<p>a list of balances</p>"
          }
        ],
        "Balance": [
          {
            "group": "Balance",
            "type": "AccountId",
            "optional": false,
            "field": "balance.id",
            "description": "<p>the account's ID</p>"
          },
          {
            "group": "Balance",
            "type": "Number",
            "optional": false,
            "field": "balance.openingBalance",
            "description": "<p>the balance at the start of the period</p>"
          },
          {
            "group": "Balance",
            "type": "Number",
            "optional": false,
            "field": "balance.shift",
            "description": "<p>the change in balance during the period</p>"
          },
          {
            "group": "Balance",
            "type": "Number",
            "optional": false,
            "field": "balance.closingBalance",
            "description": "<p>the balance at the end of the period</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "[\n  {\n    \"id\": \"boa-checking\",\n    \"openingBalance\": \"0.00\",\n    \"shift\": \"62.62\",\n    \"closingBalance\": \"62.62\"\n  },\n  {\n    \"id\": \"boa-credit\",\n    \"openingBalance\": \"0.00\",\n    \"shift\": \"-62.62\",\n    \"closingBalance\": \"-62.62\"\n  }\n]",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/transaction",
    "title": "transactions",
    "group": "Ledger",
    "version": "v1.0.0",
    "description": "<p>A list of transactions in the ledger.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": true,
            "field": "accounts",
            "description": "<p>IDs of accounts to include</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "from",
            "description": "<p>Start date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "to",
            "description": "<p>End date of the period to be returned</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": false,
            "field": "excludingCounterparties",
            "description": "<p>exclude transactions that have these counterparties</p>"
          },
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": false,
            "field": "excludingContraAccounts",
            "description": "<p>exclude transactions that have these contra accounts</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": true,
            "field": "withCounterparties",
            "description": "<p>only return transactions with these counterparties</p>"
          },
          {
            "group": "Parameter",
            "type": "Tag[]",
            "optional": true,
            "field": "withTags",
            "description": "<p>only return transaction lines with these tags</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "'end-of-month'"
            ],
            "optional": true,
            "field": "chunkFrequency",
            "description": "<p>split multi-day transactions into chunks, returning potentially multiple results for the one transaction. 'from' and 'to' for these transactions will be set to the start/end of the chunk period, and the amount will be the amount for the chunk period.</p>"
          }
        ]
      }
    },
    "filename": "lib/routes/gl/transactions.js",
    "groupTitle": "Ledger",
    "name": "GetGlLedger_idTransaction",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "TransactionId:Transaction[]",
            "optional": false,
            "field": "_",
            "description": "<p>an account-id-indexed list of transactions</p>"
          }
        ],
        "Transaction": [
          {
            "group": "Transaction",
            "type": "TransactionId",
            "optional": false,
            "field": "transaction.id",
            "description": "<p>id of the transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.date",
            "description": "<p>date the transaction occurred (YYYY-MM-DD)</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.dateEnd",
            "description": "<p>for multi-day transactions, date the transaction ends (YYYY-MM-DD)</p>"
          },
          {
            "group": "Transaction",
            "type": "String",
            "optional": false,
            "field": "transaction.comment",
            "description": "<p>comment added for the transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "AccountId[]",
            "optional": false,
            "field": "transaction.contraAccounts",
            "description": "<p>the account(s) with transactions that balance this transaction</p>"
          },
          {
            "group": "Transaction",
            "type": "CounterpartyId",
            "optional": false,
            "field": "transaction.counterparty",
            "description": "<p>id of the transaction's counterparty</p>"
          },
          {
            "group": "Transaction",
            "type": "Number",
            "optional": false,
            "field": "transaction.amount",
            "description": "<p>amount of the transaction</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n  'chase-checking': [\n    {\n      \"id\": \"1\",\n      \"date\": \"2014-03-07\",\n      \"dateEnd\": \"\",\n      \"comment\": \"123: Cleaning\",\n      \"contraAccounts\": [ \"7022\" ],\n      \"counterparty\": \"bedbath\",\n      \"amount\": \"-280.28\"\n    },\n    {\n      \"id\": \"2\",\n      \"date\": \"2014-03-10\",\n      \"dateEnd\": \"2014-05-01\",\n      \"comment\": \"124: Apple\",\n      \"contraAccounts\": [ \"1701\" ],\n      \"counterparty\": \"apple\",\n      \"amount\": \"-13050.30\"\n    }\n  ]\n},\n'chase-saving': [\n...",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/create",
    "title": "create",
    "group": "Ledger",
    "version": "v1.0.0",
    "description": "<p>Creates a ledger. Not strictly necessary as any Ledger request to an non-existant ledger will be created.</p>",
    "filename": "lib/routes/gl/create.js",
    "groupTitle": "Ledger",
    "name": "PostGlLedger_idCreate"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/erase",
    "title": "erase",
    "group": "Ledger",
    "version": "v1.0.0",
    "description": "<p>Deletes the ledger.</p>",
    "filename": "lib/routes/gl/erase.js",
    "groupTitle": "Ledger",
    "name": "PostGlLedger_idErase"
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/snapshot-transactions",
    "title": "transactions (snapshot)",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>Get a list of all transactions in the ledger at a given date. Excludes back-dated transactions inserted after the date. Useful for reconciling balance differences in report for the same period but generated at different times.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "snapshotDate",
            "description": "<p>The date of the snapshot.</p>"
          }
        ]
      }
    },
    "filename": "lib/routes/gl/snapshotTransactions.js",
    "groupTitle": "Ledger_Utils",
    "name": "GetGlLedger_idSnapshotTransactions"
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/stats",
    "title": "stats",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>General information about the ledger (e.g. transaction counts, accounts...)</p>",
    "filename": "lib/routes/gl/stats.js",
    "groupTitle": "Ledger_Utils",
    "name": "GetGlLedger_idStats"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/add-filter",
    "title": "add filter",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>Add a filter for caching balances. This will speed up balance requests containing a matching filters.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": false,
            "field": "excludingCounterparties",
            "description": "<p>IDs of transaction counterparties to exclude with the filter</p>"
          },
          {
            "group": "Parameter",
            "type": "AccountId[]",
            "optional": false,
            "field": "excludingContraAccounts",
            "description": "<p>IDs of transaction countra accounts to exclude with the filter</p>"
          },
          {
            "group": "Parameter",
            "type": "CounterpartyId[]",
            "optional": true,
            "field": "withCounterparties",
            "description": "<p>IDs of transaction counterparties to limit with the filter. All others will be excluded.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "excludingCounterparties=foobar-llc,foobar-inc\nexcludingContraAccounts=chase-saving,chase-checking\nwithCounterparties=staples,ubs",
          "type": "x-www-form-urlencoded"
        }
      ]
    },
    "filename": "lib/routes/gl/addFilter.js",
    "groupTitle": "Ledger_Utils",
    "name": "PostGlLedger_idAddFilter"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/disable-balance-cache",
    "title": "disable balance cache",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>DEPRECATED. Speed up insertion of transactions by preventing auto-generation of balances. No longer necessary, as the Low Priority Queue now means that requests take precedence over balance generation.</p>",
    "filename": "lib/routes/gl/disableBalanceCache.js",
    "groupTitle": "Ledger_Utils",
    "name": "PostGlLedger_idDisableBalanceCache"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/enable-balance-cache",
    "title": "enable balance cache",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>DEPRECATED. Re-enable the balance cache. See &quot;disable balance cache&quot;.</p>",
    "filename": "lib/routes/gl/enableBalanceCache.js",
    "groupTitle": "Ledger_Utils",
    "name": "PostGlLedger_idEnableBalanceCache"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/take-snapshot",
    "title": "take snapshot",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>Generates a snapshot for the ledger. Improving startup time and snapshot-transaction request time.</p>",
    "filename": "lib/routes/gl/takeSnapshot.js",
    "groupTitle": "Ledger_Utils",
    "name": "PostGlLedger_idTakeSnapshot"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/upload-transactions-snapshot",
    "title": "",
    "group": "Ledger_Utils",
    "version": "v1.0.0",
    "description": "<p>Upload a list of transactions to be used as a fallback for /gl/:LEDGER_ID/snapshot-transactions for use when the transactions aren't available (e.g. from before accountifie-svc was in use).</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date of the snapshot.</p>"
          },
          {
            "group": "Parameter",
            "type": "Transaction[]",
            "optional": false,
            "field": "transactions",
            "description": "<p>The list of transactions.</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "update",
            "description": "<p>Update a previously uploaded snapshot.</p>"
          }
        ]
      }
    },
    "filename": "lib/routes/gl/uploadTransactionsSnapshot.js",
    "groupTitle": "Ledger_Utils",
    "name": "PostGlLedger_idUploadTransactionsSnapshot"
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/transaction/:TRANSACTION_ID",
    "title": "info",
    "group": "Transaction",
    "version": "v1.0.0",
    "description": "<p>Information about the transaction.</p>",
    "filename": "lib/routes/gl/transaction/index.js",
    "groupTitle": "Transaction",
    "name": "GetGlLedger_idTransactionTransaction_id",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/transaction/:TRANSACTION_ID/create",
    "title": "create",
    "group": "Transaction",
    "version": "v1.0.0",
    "description": "<p>Create a transaction</p>",
    "filename": "lib/routes/gl/transaction/create.js",
    "groupTitle": "Transaction",
    "name": "PostGlLedger_idTransactionTransaction_idCreate",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/transaction/:TRANSACTION_ID/delete",
    "title": "delete",
    "group": "Transaction",
    "version": "v1.0.0",
    "description": "<p>Deletes the transaction.</p>",
    "filename": "lib/routes/gl/transaction/delete.js",
    "groupTitle": "Transaction",
    "name": "PostGlLedger_idTransactionTransaction_idDelete"
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/transaction/:TRANSACTION_ID/update",
    "title": "update",
    "group": "Transaction",
    "version": "v1.0.0",
    "description": "<p>Update the transaction's details.</p>",
    "filename": "lib/routes/gl/transaction/update.js",
    "groupTitle": "Transaction",
    "name": "PostGlLedger_idTransactionTransaction_idUpdate",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/gl/:LEDGER_ID/transaction/:TRANSACTION_ID/upsert",
    "title": "upsert",
    "group": "Transaction",
    "version": "v1.0.0",
    "description": "<p>Update a transaction's details, or insert the transaction if it doesn't exist.</p>",
    "filename": "lib/routes/gl/transaction/upsert.js",
    "groupTitle": "Transaction",
    "name": "PostGlLedger_idTransactionTransaction_idUpsert",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": false,
            "field": "date",
            "description": "<p>The date the transaction occurred, or the start of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "allowedValues": [
              "YYYY-MM-DD"
            ],
            "optional": true,
            "field": "dateEnd",
            "description": "<p>The end of the transaction period (if a multi-day transaction).</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "comment",
            "description": "<p>A description of the transaction.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "type",
            "description": "<p>The transaction's type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "bmoId",
            "description": "<p>An optional ID to link the transaction with a Business Model Object. Multiple transactions can share this ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "TransactionLine[]",
            "optional": false,
            "field": "lines",
            "description": "<p>Account entries for the transaction.</p>"
          }
        ],
        "TransactionLine": [
          {
            "group": "TransactionLine",
            "type": "AccountId",
            "optional": false,
            "field": "accountId",
            "description": "<p>The account for this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "String",
            "optional": false,
            "field": "amount",
            "description": "<p>The amount of this entry.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "CounterpartyId",
            "optional": false,
            "field": "counterpartyId",
            "description": "<p>The counterparty for this line.</p>"
          },
          {
            "group": "TransactionLine",
            "type": "Tag[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The tags for this line.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"date\": \"2015-01-19\",\n  \"comment\": \"Laptop purchase\",\n  \"type\": \"equip-purchase\",\n  \"bmoId\": \"equip-laptop-01\",\n  \"lines\": [\n    { \"account\": \"equipment\", \"amount\": \"2000.00\", \"counterpartyId\": \"apple\" },\n    { \"account\": \"creditcard\", \"amount\": \"-2000.00\", \"counterpartyId\": \"apple\" }\n  ]\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/",
    "title": "ping",
    "name": "Basic_response",
    "group": "Util",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ok",
            "description": "<p>The text 'ok'</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{ ok: \"ok\" }",
          "type": "json"
        }
      ]
    },
    "version": "1.0.0",
    "filename": "lib/routes/index.js",
    "groupTitle": "Util"
  },
  {
    "type": "get",
    "url": "/lpq/stats",
    "title": "LPQ stats",
    "group": "Util",
    "version": "v1.0.0",
    "description": "<p>General information about the Low Priority Queue (e.g. number of items in the queue, timing information...).</p>",
    "filename": "lib/routes/lpq/stats.js",
    "groupTitle": "Util",
    "name": "GetLpqStats"
  },
  {
    "type": "get",
    "url": "/gl/:LEDGER_ID/account/:ACCOUNT_ID/stats",
    "title": "stats",
    "group": "Utils",
    "version": "v1.0.0",
    "description": "<p>General information about the account (e.g. transaction counts, cached balances...)</p>",
    "filename": "lib/routes/gl/account/stats.js",
    "groupTitle": "Utils",
    "name": "GetGlLedger_idAccountAccount_idStats"
  }
] });