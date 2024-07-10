import mongoose from "mongoose";

const wingSchema = new mongoose.Schema({
  parentHall: { type: String, required: true },
  name: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  washerman: { type: mongoose.Schema.Types.ObjectId, ref: "Washerman" },
});

const hallSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  wings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wing" }],
});

const Hall = new mongoose.model("Hall", hallSchema);
const Wing = new mongoose.model("Wing", wingSchema);

const Data = { Hall, Wing };
export default Data;

//give the refrence in the body of the json for the registeration of washerman
