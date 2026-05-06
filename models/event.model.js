import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "processing", "completed", "failed"]
  }
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);