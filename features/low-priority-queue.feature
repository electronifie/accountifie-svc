@low-priority-queue
Feature: Low Priority Queue

  Scenario: It processes an item
    Given I have an empty low priority queue
    When I add the tasks:
      | description | uniquenessHash | retainQueueLocationOnReplace | runFunction |
      | test-1      |                |                              | defaultFn1  |
      | test-2      |                |                              | defaultFn1  |
      | test-3      |                |                              | defaultFn1  |
    And I process the next queue item

    Then function "defaultFn1" should have run 1 times
    And queue should contain items [test-2, test-3]
    And no error should occur

  Scenario: It processes all items
    Given I have an empty low priority queue
    When I add the tasks:
      | description | uniquenessHash | retainQueueLocationOnReplace | runFunction |
      | test-1      |                |                              | defaultFn1  |
      | test-2      |                |                              | defaultFn1  |
      | test-3      |                |                              | defaultFn1  |
    And I flush the queue

    Then function "defaultFn1" should have run 3 times
    And queue should contain items []
    And no error should occur

  Scenario: It keeps a single copy of tasks sharing a uniqueness hash, bumping a replaced task to the end of queue by default
    Given I have an empty low priority queue
    When I add the tasks:
      | description | uniquenessHash | retainQueueLocationOnReplace | runFunction |
      | test-1      |                |                              | defaultFn1  |
      | test-2      | butterfly      |                              | defaultFn1  |
      | test-3      |                |                              | defaultFn1  |
      | test-4      | butterfly      |                              | defaultFn1  |
      | test-5      |                |                              | defaultFn1  |

    Then queue should contain items [test-1, test-3, test-4, test-5]

  Scenario: It can keep a unique task's place in the queue when it is replaced
    Given I have an empty low priority queue
    When I add the tasks:
      | description | uniquenessHash | retainQueueLocationOnReplace | runFunction |
      | test-1      |                |                              | defaultFn1  |
      | test-2      | butterfly      | true                         | defaultFn1  |
      | test-3      |                |                              | defaultFn1  |
      | test-4      | butterfly      | true                         | defaultFn1  |
      | test-5      |                |                              | defaultFn1  |
      | test-6      | butterfly      | true                         | defaultFn1  |
      | test-7      |                |                              | defaultFn1  |

    Then queue should contain items [test-1, test-6, test-3, test-5, test-7]
