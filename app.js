var async = require('async');
var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var log = require('llog');
var lowPriorityQueue = require('./lib/low-priority-queue/lowPriorityQueue');
var mongo = require('./lib/mongo');
var path = require('path');
var responseTime = require('response-time');
var routes = require('./lib/routes');
var sourcedMongo = require('sourced-repo-mongo/mongo');
var generalLedgerRepository = require('./lib/models/generalLedgerRepository');

function FinancifieService(options) {
  this.port = options.port;
  this.mongoUrl = options.mongoUrl;
  this.app = express();
  this.server = null;
}

FinancifieService.prototype = {
  setup: function (cb) {
    async.parallel([
      this.setupMiddleware.bind(this),
      this.setupLogging.bind(this),
      this.setupRoutes.bind(this),
      this.setupErrorHandling.bind(this),
      this.setupSourcedDb.bind(this),
      this.setupDb.bind(this)
    ], cb);
  },

  setupMiddleware: function (cb) {
    log.trace('setupMiddleware started.');
    this.app.use(bodyParser.json({ limit: '20mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    log.trace('setupMiddleware completed.');
    cb();
  },

  setupLogging: function (cb) {
    log.trace('setupLogging started.');
    this.app.use(function (req, res, next) {
      log.trace('> %s: %s', req.method, req.originalUrl);
      next();
    });

    this.app.use(responseTime(function (req, res, time) {
      log.debug('< %s: %s took %ss', req.method, req.path, (time / 1000).toFixed(2));
    }));
    log.trace('setupLogging completed.');
    cb();
  },

  setupRoutes: function (cb) {
    log.trace('setupRoutes started.');
    routes.init(this.app);
    log.trace('setupRoutes completed.');
    cb();
  },

  setupErrorHandling: function (cb) {
    // catch 404 and forward to error handler
    log.trace('setupErrorHandling started.');
    this.app.use(function (req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    this.app.use(function (err, req, res, next) {
      log.error('error:', err);
      res.status(500).send({
        message: err.message,
        error: (this.app.get('env') === 'development') ? err : {}
      });
      if (err.status !== 404) throw err;
    }.bind(this));

    log.trace('setupErrorHandling completed.');
    cb();
  },

  setupSourcedDb: function (cb) {
    log.trace('setupSourcedDb started.');
    sourcedMongo.on('connected', function () {
      generalLedgerRepository.init(function (err) {
        log.trace('setupSourcedDb completed.');
        cb(err);
      });
    });
    sourcedMongo.connect(this.mongoUrl);
  },

  setupDb: function (cb) {
    log.trace('setupDb started.');
    mongo.on('connected', function () {
      log.trace('setupDb completed.');
      cb();
    });
    mongo.connect(this.mongoUrl);
  },

  start: function () {
    this.setup(function (err) {
      if (err) {
        log.error('Error starting:', err);
        process.exit(1);
      }

      lowPriorityQueue.start();

      this.app.set('port', this.port);
      this.server = this.app.listen(this.app.get('port'), function () {
        log.info('Express server listening on port ' + this.server.address().port);
      }.bind(this));
      this.server.maxConnections = 20000;
    }.bind(this));
  }
};

module.exports = function (options) { return new FinancifieService(options); };
