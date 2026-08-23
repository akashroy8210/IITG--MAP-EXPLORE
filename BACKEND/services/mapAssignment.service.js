const Map = require('../models/Map');

/**
 * Atomically claim one slot on an available map.
 *
 * Uses findOneAndUpdate with $inc so that even under concurrent requests
 * only one caller can claim any given slot — MongoDB guarantees the
 * document-level atomic write.
 *
 * Returns the Map document after incrementing, or null if no map is available.
 */
async function claimMapSlot() {
  const map = await Map.findOneAndUpdate(
    { status: 'available', $expr: { $lt: ['$assignedCount', '$capacity'] } },
    { $inc: { assignedCount: 1 } },
    { new: true, sort: { mapNumber: 1 } } // always fill lowest map first
  );

  if (!map) return null;

  // If this increment just filled the map, mark it full
  if (map.assignedCount >= map.capacity) {
    await Map.updateOne({ _id: map._id }, { $set: { status: 'full' } });
    map.status = 'full';
  }

  return map;
}

/**
 * Release a slot on a map (used when student creation fails after slot claim).
 */
async function releaseMapSlot(mapId) {
  await Map.findOneAndUpdate(
    { _id: mapId, assignedCount: { $gt: 0 } },
    { $inc: { assignedCount: -1 }, $set: { status: 'available' } }
  );
}

module.exports = { claimMapSlot, releaseMapSlot };
