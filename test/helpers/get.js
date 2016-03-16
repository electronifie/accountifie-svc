var request = require('supertest');

module.exports = function (url, data, cb) {
  if (!cb) {
    cb = data;
    data = {};
  }
  request(this.getExpressApp())
    .get(url)
    .query(data)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .end(cb);
};
