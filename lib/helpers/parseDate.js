var _ = require('lodash');
var log = require('llog');
var moment = require('moment');

// Kill the deprication warning by parsing acceptable date formats
// https://github.com/moment/moment/issues/1407

var validFormats = {
  'YYYY-MM-DD': /^\d\d\d\d\-\d\d\-\d\d$/,
  'YYYY-MM-DDTHH:mm:ss.SSSSZZ': /^\d\d\d\d-\d\d?-\d\d?T\d\d:\d\d:\d\d(.\d\d?\d?\d?)?[\w\d\+]*$/
};

module.exports = function (date) {
  if (_.isString(date)) date = date.trim();
  var format = _.isString(date) && _.findKey(validFormats, function (regex) { return regex.test(date); });
  if (date && _.isString(date) && (!format)) log.warn('Could not determine format for date:', date);
  return moment(date, format);
};
