import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const cashRequestSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dueAmountcash: { type: Number, required: true },
  accept: { type: Boolean, default: false },
});

const recordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  clothes: [
    {
      type: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  accept: { type: Boolean, default: false },
});

const eventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  eventType: [{ type: String }],
});

const studentSchema = new mongoose.Schema(
  {
    roll: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hall: { type: String, required: true },
    wing: { type: String, required: true },
    passHash: { type: String, required: true },
    washerman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Washerman",
      required: true,
    },
    records: [recordSchema],
    cashRequests: [cashRequestSchema],
    events: [eventSchema],
    lastCleared: { type: Date },
    receipts: [receiptSchema],
    dueAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Student = new mongoose.model("Student", studentSchema);
export default Student;
