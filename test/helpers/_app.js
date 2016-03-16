var app;

var resetApp = function (cb) {
  var appConstructor = require('../../app');
  var GeneralLedgerRepository = require('../../lib/models/generalLedgerRepository');
  var GeneralLedger = require('../../lib/models/generalLedger');


  var testGl = new GeneralLedger();
  testGl.init({ id: 'TEST' });
  GeneralLedgerRepository.cache = { 'TEST': testGl };
  GeneralLedgerRepository.commitAll = GeneralLedgerRepository.commit = function (model, cb) { cb(); };

  // construct an instance of app that doesn't hook into mongo or start a server
  app = appConstructor({ port: '', mongoUrl: '' });
  app.setupSourcedDb = app.setupDb = function (cb) { cb(); };
  // call setup instead of start so routes + middleware get created but the server isn't started
  app.setup(cb);
};

var getApp = function () { return app; };
getApp.$contextMethod = true;

var getExpressApp = function () { return app.app; };
getExpressApp.$contextMethod = true;

module.exports = {
  getApp: getApp,
  getExpressApp: getExpressApp,
  resetApp: resetApp
};
