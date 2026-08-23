const Map = require('../models/Map');
const validator = require('validator');
const isURL = validator.isURL.bind(validator);

/**
 * Auto-increment mapNumber by finding the current max.
 * This is fine for admin-initiated map creation (low concurrency).
 */
async function nextMapNumber() {
  const last = await Map.findOne().sort({ mapNumber: -1 }).select('mapNumber').lean();
  return last ? last.mapNumber + 1 : 1;
}

// ─── GET /api/admin/maps ─────────────────────────────────────────────────────

async function listMaps(req, res) {
  const maps = await Map.find()
    .sort({ mapNumber: 1 })
    .populate('studentIds', 'userNumber username name status')
    .lean();

  // Attach availableSlots virtual manually since we're using .lean()
  const enriched = maps.map(m => ({
    ...m,
    availableSlots: Math.max(0, m.capacity - m.assignedCount),
  }));

  res.json(enriched);
}

// ─── POST /api/admin/maps ────────────────────────────────────────────────────

async function createMap(req, res) {
  const { mapUrl } = req.body;

  if (!mapUrl || !mapUrl.trim()) {
    return res.status(400).json({ message: 'mapUrl is required' });
  }

  // Validate URL
  const trimmedUrl = mapUrl.trim();
  const validUrl = isURL(trimmedUrl, { require_protocol: true, protocols: ['http', 'https'] });
  if (!validUrl) {
    return res.status(400).json({ message: 'mapUrl must be a valid http/https URL' });
  }

  const mapNumber = await nextMapNumber();
  const name = `Map ${String(mapNumber).padStart(2, '0')}`;

  const map = await Map.create({
    mapNumber,
    name,
    mapUrl: trimmedUrl,
    capacity: 10,
    assignedCount: 0,
    status: 'available',
  });

  res.status(201).json({
    success: true,
    map: {
      id: map._id,
      mapNumber: map.mapNumber,
      name: map.name,
      mapUrl: map.mapUrl,
      capacity: map.capacity,
      assignedCount: map.assignedCount,
      availableSlots: map.capacity - map.assignedCount,
      status: map.status,
      createdAt: map.createdAt,
    },
  });
}

// ─── GET /api/admin/maps/:id ──────────────────────────────────────────────────

async function getMap(req, res) {
  const map = await Map.findById(req.params.id)
    .populate('studentIds', 'userNumber username name status routeKey');

  if (!map) return res.status(404).json({ message: 'Map not found' });

  res.json({
    ...map.toObject(),
    availableSlots: map.availableSlots,
  });
}

module.exports = { listMaps, createMap, getMap };
