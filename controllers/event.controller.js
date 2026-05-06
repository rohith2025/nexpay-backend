import Event from "../models/event.model.js";
import Transaction from "../models/transaction.model.js";

// create event
export const createEvent = async (req, res) => {
  const { name } = req.body;

  const event = await Event.create({
    name,
    user: req.user._id
  });

  res.json(event);
};

// get all events
export const getEvents = async (req, res) => {
  const events = await Event.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(events);
};

export const getEventById = async (req, res) => {
  const { id } = req.params;

  const event = await Event.findOne({ _id: id, user: req.user._id });
  if (!event) return res.status(404).json({ message: "Event not found" });

  res.json(event);
};

// 🔥 NEW: event summary
export const getEventSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const total = await Transaction.countDocuments({ event: id });

    const verified = await Transaction.countDocuments({
      event: id,
      status: "Verified"
    });

    const partial = await Transaction.countDocuments({
      event: id,
      status: "Partially Matched"
    });

    const suspicious = await Transaction.countDocuments({
      event: id,
      status: "Suspicious"
    });

    const notVerified = await Transaction.countDocuments({
      event: id,
      status: "Not Verified"
    });

    res.json({
      total,
      verified,
      partial,
      suspicious,
      notVerified
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};