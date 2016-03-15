var _ = require('lodash');
var assert = require('chai').assert;
var helper = require('./helpers');

describe('accountifie-svc', function () {
  beforeEach(function (done) { helper().resetApp().run(done); });

  describe('ledger', function () {
    it('stores transactions', function (cb) {
      helper()
        .post('/gl/TEST/transaction/TRANSACTION_ONE/create', { date: '2015-01-19', comment: 'tx1', lines: [{ accountId: 'ac1', amount: '123.00' }, { accountId: 'ac2', amount: '-123.00' }] })
        .post('/gl/TEST/transaction/TRANSACTION_TWO/create', { date: '2015-01-20', comment: 'tx2', lines: [{ accountId: 'ac2', amount: '23.00' },  { accountId: 'ac3', amount: '-23.00'  }] })
        .get('/gl/TEST/transactions')
        .transformResult(function (transactionsResponse) {
          assert.deepEqual(transactionsResponse.body, {
            'ac1': [
              { id: 'TRANSACTION_ONE', date: '2015-01-19', dateEnd: '', comment: 'tx1', contraAccounts: ['ac2'], counterparty: '', amount: '123.00' }
            ],
            'ac2': [
              { id: 'TRANSACTION_ONE', date: '2015-01-19', dateEnd: '', comment: 'tx1', contraAccounts: ['ac1'], counterparty: '', amount: '-123.00' },
              { id: 'TRANSACTION_TWO', date: '2015-01-20', dateEnd: '', comment: 'tx2', contraAccounts: ['ac3'], counterparty: '', amount: '23.00' }
            ],
            'ac3': [
              { id: 'TRANSACTION_TWO', date: '2015-01-20', dateEnd: '', comment: 'tx2', contraAccounts: ['ac2'], counterparty: '', amount: '-23.00' }
            ]
          });
        })
        .run(cb);
    });
  });
});
