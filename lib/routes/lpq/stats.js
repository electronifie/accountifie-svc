var lowPriorityQueue = require('../../low-priority-queue/lowPriorityQueue');

/**
 * @api {get} /lpq/stats LPQ stats
 * @apiGroup Util
 * @apiVersion v1.0.0
 *
 * @apiDescription
 *   General information about the Low Priority Queue (e.g. number of items
 *   in the queue, timing information...).
 */
module.exports = function (req, res) {
  res.send(lowPriorityQueue.statsJson());
};
