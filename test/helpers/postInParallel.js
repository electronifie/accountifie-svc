var async = require('async');
var request = require('supertest');

module.exports = function (calls, cb) {
  async.each(calls, function (call, cb) {
    var url = call[0];
    var data = call[1];
    request(this.getExpressApp())
      .post(url)
      .type('form')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(cb);
  }.bind(this), cb);
};
