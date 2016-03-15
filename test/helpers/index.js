var _ = require('lodash');
var chainBuilder = require('chainbuilder');
var llog = require('llog');
var requireDir = require('require-dir');

// exclude files starting with _
var methods = _.transform(requireDir('.'), function (result, method, methodName) {
  if (methodName[0] !== '_') result[methodName] = method;
});

module.exports = chainBuilder({
  methods: methods,
  mixins: [
    require('chainbuilder-lodash')({ exclude: ['get'] }),
    require('chainbuilder-flow')(),
    require('chainbuilder-save')(),
    require('chainbuilder-log-console')({
      log: function (msg) { llog.trace(msg); },
      detailed: process.env.CB_VERBOSE === 'true',
      colors: true
    }),
    require('./_app')
  ]
});
