import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  name: String,
  email: String,
  utr: String,
  amount: Number,
  status: String,
  reason: String,
  matchScore: Number,
  analysis: {
    utrMatch: { type: Boolean, default: false },
    amountMatch: { type: Boolean, default: false },
    nameMatch: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);