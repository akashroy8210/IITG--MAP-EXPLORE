const mongoose = require('mongoose');
const { Schema } = mongoose;

const MAP_STATUS = ['available', 'full'];
const MAP_CAPACITY = 10;

/**
 * One document per virtual-campus map.
 * Each map hosts a maximum of MAP_CAPACITY (10) students.
 * assignedCount is incremented atomically when a student is assigned.
 */
const mapSchema = new Schema(
  {
    mapNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Map 01"
    },
    // The WorkAdventure / Gather URL the student clicks to open this map
    mapUrl: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: MAP_CAPACITY,
    },
    // Incremented atomically; never decremented (deletion is an admin op)
    assignedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: MAP_STATUS,
      default: 'available',
    },
    // Reference list — for display only; assignment logic uses assignedCount
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  { timestamps: true }
);

// Virtual: available slots
mapSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.capacity - this.assignedCount);
});

module.exports = mongoose.model('Map', mapSchema);
module.exports.MAP_CAPACITY = MAP_CAPACITY;
module.exports.MAP_STATUS = MAP_STATUS;
