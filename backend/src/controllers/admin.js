import crypto from "crypto";
import Washerman from "../schemas/washerman.js";
import Data from "../schemas/data.js";

const registerWasherman = async (req, res) => {
  const { contact, name, pass, halls, accountID } = req.body;

  console.log("Received request body:", JSON.stringify(req.body, null, 2));
  console.log(
    "Extracted fields:",
    JSON.stringify({ contact, name, pass, halls, accountID }, null, 2)
  );

  if (!contact || !name || !halls || !pass || !accountID) {
    return res
      .status(400)
      .json({ message: "Bad Request (Wrong/Missing Keys in JSON)" });
  }

  const passHash = crypto.createHash("sha256").update(pass).digest("hex");

  try {
    const existingWasherman = await Washerman.findOne({ contact });
    if (existingWasherman) {
      return res
        .status(400)
        .json({ message: "Washerman with the same contact already exists" });
    }

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const newWasherman = new Washerman({
      contact,
      name,
      passHash,
      upcomingDate,
      accountID,
    });

    const hallRefs = [];

    for (const hall of halls) {
      console.log(`Processing hall: ${hall.name}`);

      // Find the hall
      let existingHall = await Data.Hall.findOne({ name: hall.name });
      if (!existingHall) {
        return res
          .status(400)
          .json({ message: `Hall ${hall.name} does not exist` });
      }

      const wingIds = [];
      for (const wingName of hall.wings) {
        console.log(`Finding wing: ${wingName} in hall: ${hall.name}`);
        let wing = await Data.Wing.findOne({
          parentHall: existingHall.name,
          name: wingName,
        });

        // Create the wing if it does not exist
        if (!wing) {
          wing = new Data.Wing({
            parentHall: existingHall.name,
            name: wingName,
            washerman: newWasherman._id,
          });
          await wing.save();
        } else {
          wing.washerman = newWasherman._id;
          await wing.save();
        }

        // Ensure the wing is listed under the hall
        if (!existingHall.wings.includes(wing._id)) {
          existingHall.wings.push(wing._id);
        }

        wingIds.push(wing._id);
      }

      await existingHall.save();

      hallRefs.push({
        name: existingHall.name,
        wings: wingIds,
      });
    }

    newWasherman.halls = hallRefs;

    console.log("Saving updated washerman with hall and wing references...");
    await newWasherman.save();

    res.status(201).json({ message: "Washerman registered successfully" });
  } catch (error) {
    console.error("Error registering washerman:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addHallData = async (req, res) => {
  const { Halls } = req.body;

  if (!Halls) {
    res
      .status(500)
      .json({ message: "Bad Request (Wrong/Missing Keys in json)" });
    return;
  }

  try {
    for (const hallData of Halls) {
      const { hallName, wings } = hallData;

      const existingHall = await Data.Hall.findOne({ name: hallName });
      if (existingHall) {
        console.log(`Hall ${hallName} already exists`);
        continue;
      }

      // Create new wing objects
      const wingObjects = [];
      for (const wingName of wings) {
        const newWing = new Data.Wing({
          parentHall: hallName,
          name: wingName,
          washerman: null,
        });
        await newWing.save();
        wingObjects.push(newWing._id);
      }

      // Create new hall object with references to wings
      const newHall = new Data.Hall({ name: hallName, wings: wingObjects });
      await newHall.save();
      console.log(`Hall ${hallName} added successfully`);
    }
    res.status(201).json({ message: "Halls added successfully" });
  } catch (error) {
    console.error("Error adding halls:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

const admin = { registerWasherman, addHallData };

export default admin;
