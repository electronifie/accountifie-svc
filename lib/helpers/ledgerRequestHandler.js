var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var GeneralLedger = require('../models/generalLedger');
var generalLedgerRepository = require('../models/generalLedgerRepository');
var log = require('llog');
var schema = require('validate');
var util = require('util');

var LedgerRequest = function (options) {
  this.validateBody = options.validateBody;

  // Commits the ledger before responding
  this.commitLedger = options.commitLedger;

  this.fetchLedger = !options.skipLedgerFetching;

  // Transfers req.params to req.body. Takes form: {PARAM_ID: BODY_ID}
  this.paramToBodyMap = options.mapParamsToBody || {};

  this.responseGenerator = options.responseGenerator;

  this.request = options.request;

  this.typecast = _.isBoolean(options.typecast) ? options.typecast : true;

  EventEmitter.call(this);
};

util.inherits(LedgerRequest, EventEmitter);

_.extend(LedgerRequest.prototype, {
  mapParamsToBody: function (params, body, cb) {
    _.each(this.paramToBodyMap, function (bodyId, paramId) { body[bodyId] = params[paramId]; });
    cb(null, body);
  },

  checkBody: function (body, cb) {
    if (!this.validateBody) {
      cb(null);
    } else if (_.isFunction(this.validateBody)) {
      this.validateBody(body, cb);
    } else if (_.isObject(this.validateBody) && !_.isArray(this.validateBody)) {
      var validator = _.isFunction(this.validateBody.validate) ? this.validateBody : schema(this.validateBody, { typecast: this.typecast });
      try {
        validator.assert(body);
      } catch (e) {
        return cb('Invalid request: problem with property "' + e.message.replace(/validation failed for path /, '') + '"');
      }

      cb(null);
    } else {
      throw new Error('Invalid format for this.validateBody.', this.validateBody);
    }
  },

  createLedger: function (options, cb) {
    var generalLedger = new GeneralLedger();
    generalLedger.init(options);

    generalLedgerRepository.commit(generalLedger, function (err) {
      return err ? cb(err) : cb(null, generalLedger);
    });
  },

  maybeGetLedgers: function (ledgerId, cb) {
    if (!this.fetchLedger || ledgerId === undefined) {
      cb(null, null);
    } else if (ledgerId === '*') {
      generalLedgerRepository.getAllFromCache(function (error, ledgers) {
        if (error) {
          cb(error);
        } else {
          cb(null, ledgers);
        }
      }.bind(this));
    } else {
      generalLedgerRepository.getFromCache(ledgerId, function(error, ledger) {
        if (error) {
          cb(error);
        } else if (!ledger) {
          this.createLedger({ id: ledgerId }, cb);
        } else {
          cb(null, ledger);
        }
      }.bind(this));
    }
  },

  getResponse: function (body, ledger, cb) {
    if (_.isArray(ledger)) {
      var ledgers = ledger;
      async.map(ledgers, function (ledger, cb) {
        this.responseGenerator.call(this, { body: body, ledger: ledger }, cb);
      }.bind(this), function (err, responses) {
        var responseMap = {};
        _.each(responses, function (response, i) {
          responseMap[ledgers[i].id] = response;
        });
        cb(err, ledgers, responseMap);
      }.bind(this));
    } else {
      this.responseGenerator.call(this, { body: body, ledger: ledger }, function (err, response) {
        cb(err, ledger, response);
      });
    }
  },

  maybeCommitLedger: function (ledger, response, cb) {
    if (ledger && this.commitLedger) {
      generalLedgerRepository[_.isArray(ledger) ? 'commitAll' : 'commit'](ledger, function (err) {
        return err ? cb(err) : cb(null, response);
      });
    } else {
      cb(null, response);
    }
  },

  process: function () {
    var req = this.request;
    var body = _.extend({}, req.query, req.body);

    // async.waterfall passes responses from the previous method as arguments to the next
    // call. If any methods return errors, the callback is immediately called without
    // processing the next function.
    //
    // https://github.com/caolan/async#waterfall
    async.waterfall([
      this.mapParamsToBody.bind(this, req.params, body),
      this.checkBody.bind(this /*, body */),
      this.maybeGetLedgers.bind(this, req.params.companyId),
      this.getResponse.bind(this, body /*, ledger */),
      this.maybeCommitLedger.bind(this)
    ], function (error, result) {
      if (error) {
        this.emit('error', error);
      } else {
        this.emit('response', result);
      }
    }.bind(this));
  }
});

var LedgerRequestHandler = function (options) {
  this.options = options;
};

LedgerRequestHandler.prototype = {
  handle: function (responseGenerator) {
    return function (req, res) {
      var ledgerRequest = new LedgerRequest(_.extend({}, this.options, {
        responseGenerator: responseGenerator,
        request: req
      }));

      ledgerRequest.on('error', function (error) {
        log.trace('< ERROR: %s', error);
        log.trace('< ERROR [query]:\n %s', JSON.stringify(req.query, null, 2));
        log.trace('< ERROR [body ]:\n %s',    JSON.stringify(req.body, null, 2));
        res.status(400).send({ error: error.toString(), _requestQuery: req.query, _requestBody: req.body });
      });

      ledgerRequest.on('response', function (response) {
        res.send(response);
      });

      ledgerRequest.process();
    }.bind(this)
  }
};

module.exports = LedgerRequestHandler;
