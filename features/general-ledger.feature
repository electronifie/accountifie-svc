@general-ledger
Feature: General Ledger

  Scenario: It provides an account history and balance for all time
    Given I have an empty general ledger for "efie"

     When I add the transactions:
          | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |lines.projectId       |
          |  1 | 2014-03-07 | 123: Cleaning  | expense |            7022 |       280.28 | bedbath              | proj123              |
          |    |            |                |         |            3000 |      -280.28 | bedbath              | proj124              |
          |    |            |                |         |                 |              |                      |                      |
          |  2 | 2014-03-10 | 124: Apple     | expense |            1701 |     13056.30 | apple                | proj234              |
          |    |            |                |         |            3000 |    -13056.30 | apple                | proj234              |

      And I save and restore from a snapshot

     Then the transaction history for account "3000" should be:
          | id | date       | dateEnd | comment        | contraAccounts     | counterparty |  amount   | project |
          |  1 | 2014-03-07 |         | 123: Cleaning  | 7022               | bedbath      |   -280.28 | proj123 |
          |  2 | 2014-03-10 |         | 124: Apple     | 1701               | apple        | -13056.30 | proj234 |

      And the account balances should be:
          | id      |  openingBalance  |  shift    | closingBalance |
          | 1701    |             0.00 |  13056.30 |       13056.30 |
          | 3000    |             0.00 | -13336.58 |      -13336.58 |
          | 7022    |             0.00 |    280.28 |         280.28 |

  Scenario: It provides an account history and trial balance for a period
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 123: Cleaning  | expense |               1 |         1.00 | bedbath              |
      |    |            |                |         |               2 |        -1.00 | bedbath              |
      |    |            |                |         |                 |              |                      |
      |  2 | 2014-04-01 | 124: Apple     | expense |               3 |         2.00 | apple                |
      |    |            |                |         |               4 |        -2.00 | apple                |
      |    |            |                |         |                 |              |                      |
      |  3 | 2014-04-01 | 125: Pear      | expense |               1 |         3.00 | pear                 |
      |    |            |                |         |               2 |        -3.00 | pear                 |
      |    |            |                |         |                 |              |                      |
      |  4 | 2014-04-02 | 126: Peach     | expense |               1 |         4.00 | peach                |
      |    |            |                |         |               4 |        -4.00 | peach                |
      |    |            |                |         |                 |              |                      |
      |  5 | 2014-05-01 | 127: Apricot   | expense |               1 |         5.00 | apricot              |
      |    |            |                |         |               4 |        -5.00 | apricot              |

    And I save and restore from a snapshot

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd | comment        | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |         | 125: Pear      | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |         | 126: Peach     | 4                  | peach        |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             1.00 |     7.00 |           8.00 |
      | 2       |            -1.00 |    -3.00 |          -4.00 |
      | 3       |             0.00 |     2.00 |           2.00 |
      | 4       |             0.00 |    -6.00 |          -6.00 |

  Scenario: It allows a transaction with multiple lines for the same account
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 123: Cleaning  | expense |               1 |        10.00 | bedbath              |
      |    |            |                |         |               1 |        -3.00 | bedbath              |
      |    |            |                |         |               1 |        -6.00 | foobath              |
      |    |            |                |         |               2 |        -1.00 | foobath              |

    And I save and restore from a snapshot

    Then the transaction history for account "1" should be:
      | id | date       | dateEnd | comment        | contraAccounts | counterparty    |  amount   |
      |  1 | 2014-03-01 |         | 123: Cleaning  |              2 | bedbath,foobath |      1.00 |

    And the account balances should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             0.00 |     1.00 |           1.00 |
      | 2       |             0.00 |    -1.00 |          -1.00 |

  Scenario: It allows transactions spanning multiple dates, and only includes the covered portion in the balance
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 2014-05-31 | 123: Depreciation    | expense |               1 |        92.00 | depreci              |
      |    |            |            |                      |         |               2 |       -92.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-04-01 |            | 124: Apple           | expense |               3 |         2.00 | apple                |
      |    |            |            |                      |         |               4 |        -2.00 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | 125: Pear            | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               2 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | 126: Peach           | expense |               1 |         4.00 | peach                |
      |    |            |            |                      |         |               4 |        -4.00 | peach                |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | 127: Apricot         | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               4 |        -5.00 | apricot              |

    And I save and restore from a snapshot

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  1 | 2014-04-01 | 2014-04-30 | 123: Depreciation (prorated) | 2                  | depreci      |     30.00 |
      |  3 | 2014-04-01 |            | 125: Pear                    | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | 126: Peach                   | 4                  | peach        |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |            31.00 |    37.00 |          68.00 |
      | 2       |           -31.00 |   -33.00 |         -64.00 |
      | 3       |             0.00 |     2.00 |           2.00 |
      | 4       |             0.00 |    -6.00 |          -6.00 |

  Scenario: It keeps a balance history for accounts (for quick balance calculations)
    Given I have an empty general ledger for "efie"
      And balance cache frequency is 6 months

    When I add the transactions:
      | id | date       | comment | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-01-04 |       - | expense |               1 |         1.00 | bedbath              |
      |    |            |         |         |               2 |        -1.00 | bedbath              |
      |    |            |         |         |                 |              |                      |
      |  2 | 2014-01-10 |       - | expense |               1 |         1.00 | bedbath              |
      |    |            |         |         |               2 |        -1.00 | bedbath              |
      |    |            |         |         |                 |              |                      |
      |  3 | 2014-07-07 |       - | expense |               1 |         2.00 | bedbath              |
      |    |            |         |         |               2 |        -2.00 | bedbath              |
      |    |            |         |         |                 |              |                      |
      |  4 | 2016-01-03 |       - | expense |               1 |        -1.00 | bedbath              |
      |    |            |         |         |               2 |         1.00 | bedbath              |
      |    |            |         |         |                 |              |                      |
      |  5 | 2017-01-03 |       - | expense |               1 |        -1.00 | bedbath              |
      |    |            |         |         |               2 |         1.00 | bedbath              |
      |    |            |         |         |                 |              |                      |

    And I save and restore from a snapshot
    And I flush the low priority queue

    Then the commit-ledger task should have run with params [efie]
    And the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-07-04 |             2.00 |
      | 2015-01-04 |             4.00 |
      | 2015-07-04 |             4.00 |
      | 2016-01-04 |             3.00 |
      | 2016-07-04 |             3.00 |

    When I add the transactions:
      | id | date       | comment | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  4 | 2015-01-04 |       - | expense |               1 |         5.00 | bedbath              |
      |    |            |         |         |               2 |        -5.00 | bedbath              |

    # balances after the date should be removed
    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-07-04 |             2.00 |
      | 2015-01-04 |             4.00 |

    When I flush the low priority queue

    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-07-04 |             2.00 |
      | 2015-01-04 |             4.00 |
      | 2015-07-04 |             9.00 |
      | 2016-01-04 |             8.00 |
      | 2016-07-04 |             8.00 |

    When I save and restore from a snapshot

    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-07-04 |             2.00 |
      | 2015-01-04 |             4.00 |
      | 2015-07-04 |             9.00 |
      | 2016-01-04 |             8.00 |
      | 2016-07-04 |             8.00 |

  Scenario: It allows transactions to be updated
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 2014-05-31 | 123: Depreciation    | expense |               1 |        92.00 | depreci              |
      |    |            |            |                      |         |               2 |       -92.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-04-01 |            | 124: Apple           | expense |               3 |         2.00 | apple                |
      |    |            |            |                      |         |               4 |        -2.00 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | 125: Pear            | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               2 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | 126: Peach           | expense |               1 |         4.00 | peach                |
      |    |            |            |                      |         |               4 |        -4.00 | peach                |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | 127: Apricot         | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               4 |        -5.00 | apricot              |

    And I save and restore from a snapshot

    And I update the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 2014-06-05 | 123: Depreciation    | expense |               1 |       194.00 | depreci              |
      |    |            |            |                      |         |               2 |      -194.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-03 |            | 125: Pear2           | expense |               3 |         4.00 | pear                 |
      |    |            |            |                      |         |               2 |        -4.00 | pear                 |

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  1 | 2014-04-01 | 2014-04-30 | 123: Depreciation (prorated) | 2                  | depreci      |     60.00 |
      |  4 | 2014-04-02 |            | 126: Peach                   | 4                  | peach        |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |            62.00 |    64.00 |         126.00 |
      | 2       |           -62.00 |   -64.00 |        -126.00 |
      | 3       |             0.00 |     6.00 |           6.00 |
      | 4       |             0.00 |    -6.00 |          -6.00 |

  Scenario: It allows transactions to be deleted
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 2014-05-31 | 123: Depreciation    | expense |               1 |        92.00 | depreci              |
      |    |            |            |                      |         |               2 |       -92.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-03-25 |            | 124: Apple           | expense |               1 |         2.00 | apple                |
      |    |            |            |                      |         |               2 |        -2.00 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | 125: Pear            | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               2 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | 126: Peach           | expense |               1 |         4.00 | peach                |
      |    |            |            |                      |         |               4 |        -4.00 | peach                |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | 127: Apricot         | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               4 |        -5.00 | apricot              |

    And I save and restore from a snapshot

    And I delete transaction "1"

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |            | 125: Pear                    | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | 126: Peach                   | 4                  | peach        |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             2.00 |     7.00 |           9.00 |
      | 2       |            -2.00 |    -3.00 |          -5.00 |
      | 4       |             0.00 |    -4.00 |          -4.00 |

  Scenario: It rejects unbalanced transactions
    Given I have an empty general ledger for "efie"

    Then I get an "unbalanced" error when I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 2014-05-31 | 123: Depreciation    | expense |               1 |        92.00 | depreci              |
      |    |            |            |                      |         |               2 |       -93.00 | depreci              |

  Scenario: It calculates balances at period edges
    Given I have an empty general ledger for "efie"
      And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-01-04 |            | -                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-03-01 | 2014-05-31 | -                    | expense |               1 |        92.92 | depreci              |
      |    |            |            |                      |         |               2 |       -92.92 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-03-03 | 2014-03-31 | -                    | expense |               1 |        29.29 | depreci              |
      |    |            |            |                      |         |               2 |       -29.29 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  7 | 2014-06-01 |            | -                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |

    And I save and restore from a snapshot
    And I flush the low priority queue

    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-02-04 |             1.01 |
      | 2014-03-04 |             5.05 |
      | 2014-04-04 |            64.64 |
      | 2014-05-04 |            94.94 |

    And the account balances from 2000-01-01 to 2014-04-01 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             0.00 |    62.62 |          62.62 |
      | 2       |             0.00 |   -62.62 |         -62.62 |

  Scenario: It remembers results of previous queries
    Given I have an empty general ledger for "efie"
    And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-01-04 |            | -                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-03-01 | 2014-05-31 | -                    | expense |               1 |        92.92 | depreci              |
      |    |            |            |                      |         |               2 |       -92.92 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-03-03 | 2014-03-31 | -                    | expense |               1 |        29.29 | depreci              |
      |    |            |            |                      |         |               2 |       -29.29 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  7 | 2014-06-01 |            | -                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |

    And I save and restore from a snapshot
    And I flush the low priority queue

    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-02-04 |             1.01 |
      | 2014-03-04 |             5.05 |
      | 2014-04-04 |            64.64 |
      | 2014-05-04 |            94.94 |

    And the account balances from 2000-01-01 to 2014-04-01 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             0.00 |    62.62 |          62.62 |
      | 2       |             0.00 |   -62.62 |         -62.62 |

    And the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-04 |             0.00 |
      | 2014-02-04 |             1.01 |
      | 2014-03-04 |             5.05 |
      | 2014-04-02 |            62.62 |
      | 2014-04-04 |            64.64 |
      | 2014-05-04 |            94.94 |

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-01-01 |            | -                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |
    And I flush the low priority queue

    Then the cached balances for account "1" should be:
      | date       |  openingBalance  |
      | 2014-01-01 |             0.00 |
      | 2014-02-01 |             2.02 |
      | 2014-03-01 |             2.02 |
      | 2014-04-01 |            62.62 |
      | 2014-05-01 |            92.92 |
      | 2014-06-01 |           124.23 |

  Scenario: It carries fractions of cents across snapshot periods
    Given I have an empty general ledger for "efie"
    And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2013-12-01 |            | -                    | expense |               1 |         0.01 | apple                |
      |    |            |            |                      |         |               2 |        -0.01 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2013-12-01 |            | -                    | expense |               1 |        -0.01 | apple                |
      |    |            |            |                      |         |               2 |         0.01 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-01-01 | 2014-12-31 | -                    | expense |               1 |       365.02 | depreci              |
      |    |            |            |                      |         |               2 |      -365.02 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2015-02-01 |            | -                    | expense |               1 |         0.01 | apple                |
      |    |            |            |                      |         |               2 |        -0.01 | apple                |

    And I flush the low priority queue

    Then the cached balances for account "1" should be:
      | date       |   openingBalance |
      | 2013-12-01 |             0.00 |
      | 2014-01-01 |             0.00 |
      | 2014-02-01 |            31.00 |
      | 2014-03-01 |            59.00 |
      | 2014-04-01 |            90.00 |
      | 2014-05-01 |           120.01 |
      | 2014-06-01 |           151.01 |
      | 2014-07-01 |           181.01 |
      | 2014-08-01 |           212.01 |
      | 2014-09-01 |           243.01 |
      | 2014-10-01 |           273.01 |
      | 2014-11-01 |           304.02 |
      | 2014-12-01 |           334.02 |
      | 2015-01-01 |           365.02 |

    And the cached balances for account "2" should be:
      | date       |   openingBalance |
      | 2013-12-01 |             0.00 |
      | 2014-01-01 |             0.00 |
      | 2014-02-01 |           -31.00 |
      | 2014-03-01 |           -59.00 |
      | 2014-04-01 |           -90.00 |
      | 2014-05-01 |          -120.01 |
      | 2014-06-01 |          -151.01 |
      | 2014-07-01 |          -181.01 |
      | 2014-08-01 |          -212.01 |
      | 2014-09-01 |          -243.01 |
      | 2014-10-01 |          -273.01 |
      | 2014-11-01 |          -304.02 |
      | 2014-12-01 |          -334.02 |
      | 2015-01-01 |          -365.02 |

    And the account balances from 2000-01-01 to 2014-12-31 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             0.00 |   365.02 |         365.02 |
      | 2       |             0.00 |  -365.02 |        -365.02 |

  Scenario: It chunks transactions at month edges
    Given I have an empty general ledger for "efie"
    And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-04-01 |            | A                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-03-04 | 2014-05-29 | B                    | expense |               1 |        87.87 | depreci              |
      |    |            |            |                      |         |               2 |       -87.87 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-03-03 | 2014-03-05 | C                    | expense |               1 |         2.02 | depreci              |
      |    |            |            |                      |         |               2 |        -2.02 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-01-01 | 2014-12-31 | D                    | expense |               1 |       365.00 | depreci              |
      |    |            |            |                      |         |               2 |      -365.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-04-01 | 2014-05-01 | E                    | expense |               1 |        31.00 | depreci              |
      |    |            |            |                      |         |               2 |       -31.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  7 | 2014-08-01 |            | F                    | expense |               1 |         1.01 | apple                |
      |    |            |            |                      |         |               2 |        -1.01 | apple                |

    And I save and restore from a snapshot

    Then the transaction history for account "1" from 2014-03-01 to 2014-06-30 chunked at "end-of-month" should be:
      | id | date       | dateEnd    | comment           | contraAccounts     | counterparty |  amount   |
      |  1 | 2014-04-01 |            | A                 | 2                  | apple        |      1.01 |
      |  2 | 2014-03-04 | 2014-03-31 | B (prorated)      | 2                  | depreci      |     28.28 |
      |  2 | 2014-04-01 | 2014-04-30 | B (prorated)      | 2                  | depreci      |     30.30 |
      |  2 | 2014-05-01 | 2014-05-29 | B (prorated)      | 2                  | depreci      |     29.29 |
      |  3 | 2014-03-03 | 2014-03-05 | C                 | 2                  | depreci      |      2.02 |
      |  4 | 2014-03-01 | 2014-03-31 | D (prorated)      | 2                  | depreci      |     31.00 |
      |  4 | 2014-04-01 | 2014-04-30 | D (prorated)      | 2                  | depreci      |     30.00 |
      |  4 | 2014-05-01 | 2014-05-31 | D (prorated)      | 2                  | depreci      |     31.00 |
      |  4 | 2014-06-01 | 2014-06-30 | D (prorated)      | 2                  | depreci      |     30.00 |
      |  5 | 2014-04-01 | 2014-04-30 | E (prorated)      | 2                  | depreci      |     30.00 |
      |  5 | 2014-05-01 | 2014-05-01 | E (prorated)      | 2                  | depreci      |      1.00 |

  Scenario: It can exclude intracompany expenses
    Given I have an empty general ledger for "INC"
      And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-02-01 |            | A                    | expense |               1 |         1.00 | depreci              |
      |    |            |            |                      |         |               2 |        -1.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-02-11 |            | B                    | expense |               1 |         2.00 | llc                  |
      |    |            |            |                      |         |               2 |        -2.00 | llc                  |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | C                    | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               2 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | D                    | expense |               1 |         4.00 | llc                  |
      |    |            |            |                      |         |               2 |        -4.00 | llc                  |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | E                    | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               2 |        -5.00 | apricot              |
      |    |            |            |                      |         |                 |              |                      |
      |  6 | 2014-07-01 |            | F                    | expense |               1 |         6.00 | apricot              |
      |    |            |            |                      |         |               2 |        -6.00 | apricot              |

    And I keep balances for a filter excluding counterparties "llc"
    And I save and restore from a snapshot
    And I flush the low priority queue

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |            | C                            | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | D                            | 2                  | llc          |      4.00 |

    And the transaction history for account "1" from 2014-04-01 to 2014-04-30 excluding counterparties "llc" should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |            | C                            | 2                  | pear         |      3.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |             3.00 |    7.00 |          10.00 |
      | 2       |            -3.00 |   -7.00 |         -10.00 |

    And the account balances from 2014-04-01 to 2014-04-30 excluding counterparties "llc" should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |             1.00 |    3.00 |           4.00 |
      | 2       |            -1.00 |   -3.00 |          -4.00 |

    And the cached balances for account "1" should be:
      | date       |   openingBalance |
      | 2014-02-01 |             0.00 |
      | 2014-03-01 |             3.00 |
      | 2014-04-01 |             3.00 |
      | 2014-05-01 |            10.00 |
      | 2014-06-01 |            15.00 |

    And the cached balances for account "1" excluding counterparties "llc" should be:
      | date       |   openingBalance |
      | 2014-02-01 |             0.00 |
      | 2014-03-01 |             1.00 |
      | 2014-04-01 |             1.00 |
      | 2014-05-01 |             4.00 |
      | 2014-06-01 |             9.00 |

  Scenario: It can exclude transactions with conta accounts
    Given I have an empty general ledger for "INC"
    And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  7 | 2014-01-01 |            | Y                    | expense |               1 |         7.00 | depreci              |
      |    |            |            |                      |         |               2 |        -7.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  8 | 2014-01-05 |            | Z                    | expense |               1 |         8.00 | depreci              |
      |    |            |            |                      |         |               3 |        -8.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  1 | 2014-02-01 |            | A                    | expense |               1 |         1.00 | depreci              |
      |    |            |            |                      |         |               4 |        -1.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-02-11 |            | B                    | expense |               1 |         2.00 | llc                  |
      |    |            |            |                      |         |               2 |        -2.00 | llc                  |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | C                    | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               3 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | D                    | expense |               1 |         4.00 | llc                  |
      |    |            |            |                      |         |               2 |        -4.00 | llc                  |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | E                    | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               2 |        -5.00 | apricot              |
      |    |            |            |                      |         |                 |              |                      |
      |  6 | 2014-07-01 |            | F                    | expense |               1 |         6.00 | apricot              |
      |    |            |            |                      |         |               2 |        -6.00 | apricot              |

    And I keep balances for a filter excluding contra account "3"
    And I save and restore from a snapshot
    And I flush the low priority queue

    Then the transaction history for account "1" from 2014-02-01 to 2014-04-30 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  1 | 2014-02-01 |            | A                            | 4                  | depreci      |      1.00 |
      |  2 | 2014-02-11 |            | B                            | 2                  | llc          |      2.00 |
      |  3 | 2014-04-01 |            | C                            | 3                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | D                            | 2                  | llc          |      4.00 |

    And the transaction history for account "1" from 2014-02-01 to 2014-04-30 excluding contra account "3" should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  1 | 2014-02-01 |            | A                            | 4                  | depreci      |      1.00 |
      |  2 | 2014-02-11 |            | B                            | 2                  | llc          |      2.00 |
      |  4 | 2014-04-02 |            | D                            | 2                  | llc          |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |            18.00 |    7.00 |          25.00 |
      | 2       |            -9.00 |   -4.00 |         -13.00 |
      | 3       |            -8.00 |   -3.00 |         -11.00 |
      | 4       |            -1.00 |    0.00 |          -1.00 |

    And the account balances from 2014-04-01 to 2014-04-30 excluding contra account "3" should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |            10.00 |    4.00 |          14.00 |
      | 2       |            -9.00 |   -4.00 |         -13.00 |
      | 3       |            -8.00 |   -3.00 |         -11.00 |
      | 4       |            -1.00 |    0.00 |          -1.00 |

    And the cached balances for account "1" should be:
      | date       |   openingBalance |
      | 2014-01-01 |             0.00 |
      | 2014-02-01 |            15.00 |
      | 2014-03-01 |            18.00 |
      | 2014-04-01 |            18.00 |
      | 2014-05-01 |            25.00 |
      | 2014-06-01 |            30.00 |

    And the cached balances for account "1" excluding contra account "3" should be:
      | date       |   openingBalance |
      | 2014-01-01 |             0.00 |
      | 2014-02-01 |             7.00 |
      | 2014-03-01 |            10.00 |
      | 2014-04-01 |            10.00 |
      | 2014-05-01 |            14.00 |
      | 2014-06-01 |            19.00 |

  Scenario: It can restrict to a set of counterparties
    Given I have an empty general ledger for "INC"
      And balance cache frequency is 1 month

    When I add the transactions:
      | id | date       | dateEnd    | comment              | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-02-01 |            | A                    | expense |               1 |         1.00 | pear                 |
      |    |            |            |                      |         |               2 |        -1.00 | depreci              |
      |    |            |            |                      |         |                 |              |                      |
      |  2 | 2014-02-11 |            | B                    | expense |               1 |         2.00 | llc                  |
      |    |            |            |                      |         |               2 |        -2.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  3 | 2014-04-01 |            | C                    | expense |               1 |         3.00 | pear                 |
      |    |            |            |                      |         |               2 |        -3.00 | pear                 |
      |    |            |            |                      |         |                 |              |                      |
      |  4 | 2014-04-02 |            | D                    | expense |               1 |         4.00 | pear                 |
      |    |            |            |                      |         |               2 |        -4.00 | llc                  |
      |    |            |            |                      |         |                 |              |                      |
      |  5 | 2014-05-01 |            | E                    | expense |               1 |         5.00 | apricot              |
      |    |            |            |                      |         |               2 |        -5.00 | apricot              |
      |    |            |            |                      |         |                 |              |                      |
      |  6 | 2014-07-01 |            | F                    | expense |               1 |         6.00 | pear                 |
      |    |            |            |                      |         |               2 |        -6.00 | apricot              |
      |    |            |            |                      |         |                 |              |                      |
      |  7 | 2014-09-01 |            | G                    | expense |               1 |         7.00 | apricot              |
      |    |            |            |                      |         |               2 |        -7.00 | apricot              |

    And I keep balances for a filter with counterparties "pear"

    And I save and restore from a snapshot

    And I flush the low priority queue

    Then the transaction history for account "1" from 2014-02-02 to 2014-05-31 should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  2 | 2014-02-11 |            | B                            | 2                  | llc          |      2.00 |
      |  3 | 2014-04-01 |            | C                            | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | D                            | 2                  | pear         |      4.00 |
      |  5 | 2014-05-01 |            | E                            | 2                  | apricot      |      5.00 |

    And the transaction history for account "1" from 2014-02-02 to 2014-05-31 with counterparties "pear" should be:
      | id | date       | dateEnd    | comment                      | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |            | C                            | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |            | D                            | 2                  | pear         |      4.00 |

    And the account balances from 2014-02-02 to 2014-05-31 should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |             1.00 |   14.00 |          15.00 |
      | 2       |            -1.00 |  -14.00 |         -15.00 |

    And the account balances from 2014-02-02 to 2014-05-31 with counterparties "pear" should be:
      | id      |  openingBalance  | shift   | closingBalance |
      | 1       |             1.00 |    7.00 |           8.00 |
      | 2       |             0.00 |   -5.00 |          -5.00 |

    And the cached balances for account "1" should be:
      | date       |   openingBalance |
      | 2014-02-01 |             0.00 |
      | 2014-02-02 |             1.00 |
      | 2014-03-01 |             3.00 |
      | 2014-04-01 |             3.00 |
      | 2014-05-01 |            10.00 |
      | 2014-06-01 |            15.00 |
      | 2014-07-01 |            15.00 |
      | 2014-08-01 |            21.00 |

    And the cached balances for account "1" with counterparties "pear" should be:
      | date       |   openingBalance |
      | 2014-02-01 |             0.00 |
      | 2014-02-02 |             1.00 |
      | 2014-03-01 |             1.00 |
      | 2014-04-01 |             1.00 |
      | 2014-05-01 |             8.00 |
      | 2014-06-01 |             8.00 |
      | 2014-07-01 |             8.00 |
      | 2014-08-01 |            14.00 |

  Scenario: It can restore from snapshots + events
    Given I have an empty general ledger for "efie"

    When I add the transactions:
      | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  1 | 2014-03-01 | 123: Cleaning  | expense |               1 |         1.00 | bedbath              |
      |    |            |                |         |               2 |        -1.00 | bedbath              |
      |    |            |                |         |                 |              |                      |
      |  2 | 2014-04-01 | 124: Apple     | expense |               3 |         2.00 | apple                |
      |    |            |                |         |               4 |        -2.00 | apple                |
      |    |            |                |         |                 |              |                      |

    And I take a snapshot

    And I add the transactions:
      | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  3 | 2014-04-01 | 125: Pear      | expense |               1 |         3.00 | pear                 |
      |    |            |                |         |               2 |        -3.00 | pear                 |
      |    |            |                |         |                 |              |                      |
      |  4 | 2014-04-02 | 126: Peach     | expense |                 |              |                      |
      |    |            |                |         |                 |              |                      |
      |  5 | 2014-05-01 | 127: Plum      | expense |               1 |         1.00 | plum                 |
      |    |            |                |         |               4 |        -1.00 | plum                 |
      |    |            |                |         |                 |              |                      |
      |  6 | 2014-05-01 | 127: Apricot   | expense |               1 |         5.00 | apricot              |
      |    |            |                |         |               4 |        -5.00 | apricot              |

    And I delete transaction "5"

    And I update the transactions:
      | id | date       | comment        | type    | lines.accountId | lines.amount | lines.counterpartyId |
      |  4 | 2014-04-02 | 126: Peach     | expense |               1 |         4.00 | peach                |
      |    |            |                |         |               4 |        -4.00 | peach                |

    And I restore the ledger

    Then the transaction history for account "1" from 2014-04-01 to 2014-04-30 should be:
      | id | date       | dateEnd | comment        | contraAccounts     | counterparty |  amount   |
      |  3 | 2014-04-01 |         | 125: Pear      | 2                  | pear         |      3.00 |
      |  4 | 2014-04-02 |         | 126: Peach     | 4                  | peach        |      4.00 |

    And the account balances from 2014-04-01 to 2014-04-30 should be:
      | id      |  openingBalance  | shift    | closingBalance |
      | 1       |             1.00 |     7.00 |           8.00 |
      | 2       |            -1.00 |    -3.00 |          -4.00 |
      | 3       |             0.00 |     2.00 |           2.00 |
      | 4       |             0.00 |    -6.00 |          -6.00 |
