var lowPriorityQueue = require('../../low-priority-queue/lowPriorityQueue');

/**
 * @api {get} /lpq/stats Low Priority Queue stats
 * @apiGroup Util
 * @apiVersion v1.0.0
 */
module.exports = function (req, res) {
  res.send(lowPriorityQueue.statsJson());
};
