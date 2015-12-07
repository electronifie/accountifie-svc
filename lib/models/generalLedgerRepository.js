var _ = require('lodash');
var async = require('async');
var GeneralLedger = require('./generalLedger');
var log = require('llog');
var Repository = require('sourced-repo-mongo').Repository;
var util = require('util');

function GeneralLedgerRepository() {
  log.trace('Creating new GeneralLedgerRepository.');
  this.cache = { };
}

util.inherits(GeneralLedgerRepository, Repository);

GeneralLedgerRepository.prototype.init = function (cb) {
  Repository.call(this, GeneralLedger, {
    snapshotFrequency: 1000000
  });
  this.primeModels(cb);
};

GeneralLedgerRepository.prototype.primeModels = function (cb) {
  log.debug('Caching models for quick availability.');

  var startTime = Date.now();
  this.events.distinct('id', function (err, ids) {
    if (err) return log.error(err);
    async.each(ids || [], this.getFromCache.bind(this), function (err) {
      if (err) {
        log.error('Error caching models: ', err)
        cb(err);
      } else {
        log.info('Models are cached. Took ' + (((Date.now() - startTime) / 1000) | 0) + 's.');
        cb();
      }
    });
  }.bind(this));
};

GeneralLedgerRepository.prototype.getFromCache = function(id, cb) {
  var cached = this.cache[id];
  if (!cached) {
    var startTime = Date.now();
    log.trace('Fetching ledger %s from DB. Currently cached ledgers: ', id, _.keys(this.cache));
    this.get(id, function (err, resp) {
      if (err) return cb(err);
      if (!resp) return cb(null, null);

      this.cache[id] = resp;
      log.debug('Cached ledger ' + id + '. Took ' + (((Date.now() - startTime) / 1000) | 0) + 's.');
      this.getFromCache(id, cb); // Recurse now that the cache is populated
    }.bind(this));
  } else {
    cb(null, cached);
  }
};

GeneralLedgerRepository.prototype.getHistorical = function (id, date, cb) {
  var self = this;
  log.debug('getting %s for id %s at time %s [timestamp: %s]', this.entityType.name, id, date.toString(), date.getTime());

  this.snapshots
    .find({ id: id, timestamp: { $lte: date.getTime() } })
    .sort({ version: -1 })
    .limit(-1)
    .toArray(function (err, snapshots) {
      if (err) return cb(err);
      var snapshot = snapshots[0];
      var criteria = (snapshot) ? { id: id, version: { $gt: snapshot.version }, timestamp: { $lte: date.getTime() }  } : { id: id, timestamp: { $lte: date.getTime() } };
      self.events.find(criteria)
        .sort({ version: 1 })
        .toArray(function (err, events) {
          if (err) return cb(err);
          if (snapshot) delete snapshot._id;
          if ( ! snapshot && ! events.length) return cb(null, null);
          var entity = self._deserialize(id, snapshot, events);
          return cb(null, entity);
        });
    });
};

GeneralLedgerRepository.prototype.getAllFromCache = function (cb) {
  cb(null, _.values(this.cache));
};

module.exports = new GeneralLedgerRepository();
