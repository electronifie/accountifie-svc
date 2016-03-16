var request = require('supertest');

module.exports = function (url, data, cb) {
  if (!cb) {
    cb = data;
    data = {};
  }
  request(this.getExpressApp())
    .post(url)
    .type('form')
    .send(data)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .end(cb);
};
