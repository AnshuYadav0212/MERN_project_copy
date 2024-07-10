import mongoose from "mongoose";

const washermanSchema = new mongoose.Schema(
  {
    // Every washerman contact (phone number) is unique
    contact: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passHash: { type: String, required: true },
    halls: [
      {
        name: { type: String, required: true },
        wings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wing" }],
      },
    ],
    upcomingDate: { type: Date, required: true },
    accountID: { type: String, required: true },
    wsConn: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Washerman = new mongoose.model("Washerman", washermanSchema);
export default Washerman;
