var EventEmitter = require('events').EventEmitter;
var log = require('llog');
var client = require('mongodb').MongoClient;
var util = require('util');

function Mongo () {
  EventEmitter.call(this);
}

util.inherits(Mongo, EventEmitter);

Mongo.prototype.connect = function connect (mongoUrl, cb) {
  var self = this;
  if (cb) {
    return client.connect(mongoUrl, cb);
  } else {
    return client.connect(mongoUrl, {
      logger: {
        error: log.error,
        log: log.info,
        debug: log.debug,
      }
    }, function (err, db) {
      if (err) {
        log.debug('✗ MongoDB Connection Error. Please make sure MongoDB is running: ', err);
        self.emit('error', err);
      }
      log.debug('initialized connection to mongo at %s', mongoUrl);
      self.db = db;
      self.emit('connected', db);
    });
  }
};

module.exports = new Mongo();
