var lowPriorityQueue = require('../../low-priority-queue/lowPriorityQueue');

module.exports = function (req, res) {
  res.send(lowPriorityQueue.statsJson());
};
