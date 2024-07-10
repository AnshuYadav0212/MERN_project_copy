import Washerman from "../schemas/washerman.js";

import PDFDocument from "pdfkit";

const printSummary = async (req, res) => {
  try {
    const { hall, wing } = req.body;

    // Find the washerman
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: { path: "records" },
        },
      },
    });

    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const students = wingData.students.filter((student) =>
      student.records.some((record) => record.accept)
    );

    const summary = students.map((student) => ({
      Name: student.name,
      Roll: student.roll,
      Wing: student.wing,
      Hall: student.hall,
      "Total Clothes": student.records.reduce((total, record) => {
        if (record.accept) {
          return (
            total +
            record.clothes.reduce(
              (subtotal, cloth) => subtotal + cloth.quantity,
              0
            )
          );
        }
        return total;
      }, 0),
      "Total Dues": student.dueAmount,
      Month: new Date().toLocaleString("en-us", { month: "long" }),
    }));

    // Create a PDF document
    const doc = new PDFDocument();

    // Pipe the PDF into a writable stream and send it to the client
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(18).text("Summary Report", { align: "center" });
    doc.moveDown();

    summary.forEach((item, index) => {
      doc.fontSize(12).text(`Student ${index + 1}`);
      doc.text(`Name: ${item.Name}`);
      doc.text(`Roll: ${item.Roll}`);
      doc.text(`Wing: ${item.Wing}`);
      doc.text(`Hall: ${item.Hall}`);
      doc.text(`Total Clothes: ${item["Total Clothes"]}`);
      doc.text(`Total Dues: ${item["Total Dues"]}`);
      doc.text(`Month: ${item.Month}`);
      doc.moveDown();
    });

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const wingRecord = async (req, res) => {
  try {
    const { date, hall, wing } = req.body;

    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: { path: "records" },
        },
      },
    });

    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const students = wingData.students;
    const records = students.map((student) => ({
      name: student.name,
      roll: student.roll,
      record: student.records.find(
        (record) => record.date.toDateString() === new Date(date).toDateString()
      ),
    }));

    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Error fetching wing record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const upcomingDate = async (req, res) => {
  try {
    const { upcomingDate } = req.body;
    console.log(upcomingDate);
    console.log(new Date(upcomingDate));
    const options = { timeZone: "Asia/Kolkata" };
    const indianDate = upcomingDate.toLocaleString("en-IN", options);
    console.log(indianDate);
    const washerman = await Washerman.findOne({ contact: req.user.contact });
    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    washerman.upcomingDate = new Date(upcomingDate);
    await washerman.save();
    res
      .status(200)
      .json({ success: true, message: "Upcoming date updated successfully" });
  } catch (error) {
    console.error("Error updating upcoming date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
function isToday(someDate) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  return (
    someDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) ===
    currentDate
  );
}
const fetchStudentCashRequests = async (req, res) => {
  const { hall, wing } = req.body;

  try {
    // Find the washerman by contact and populate the necessary data
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: {
            path: "cashRequests",
            options: { sort: { date: -1 } }, // Sort requests by date in descending order
          },
        },
      },
    });

    if (!washerman) {
      console.error("Washerman not found");
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      console.error("Hall not found for this washerman");
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      console.error("Wing not found for this hall");
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const currentDate = new Date().toDateString();
    const studentsWithPendingRequests = wingData.students.filter((student) => {
      const lastRequest = student.cashRequests[0];
      return (
        lastRequest &&
        !lastRequest.accept &&
        new Date(lastRequest.date).toDateString() === currentDate
      );
    });

    if (studentsWithPendingRequests.length === 0) {
      console.error("No pending cash requests found for today");
      return res.status(404).json({
        success: false,
        message: "No pending cash requests found for today",
      });
    }

    // Collect only the last unaccepted cash request for each student
    const students = studentsWithPendingRequests.map((student) => {
      const lastPendingRequest = student.cashRequests[0];
      return {
        name: student.name,
        roll: student.roll,
        hall: student.hall,
        wing: student.wing,
        cashRequest: lastPendingRequest, // Only the last unaccepted request
      };
    });

    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Error fetching student cash requests:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const collectCloths = async (req, res) => {
  try {
    const { hall, wing } = req.body;

    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: { path: "records" },
        },
      },
    });

    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const students = wingData.students;
    const validStudents = students.filter((student) =>
      student.records.some((record) => !record.accept && isToday(record.date))
    );

    const records = validStudents.map((student) => ({
      name: student.name,
      roll: student.roll,
      wing: student.wing,
      hall: student.hall,
      records: student.records.filter(
        (record) => !record.accept && isToday(record.date)
      ),
    }));

    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Error fetching wing record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const pendingCashRequests = async (req, res) => {
  try {
    const { hall, wing } = req.body;

    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: { path: "cashRequests" },
        },
      },
    });

    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const students = wingData.students;
    const validStudents = students.filter((student) =>
      student.cashRequests.some(
        (record) => !record.accept && isToday(record.date)
      )
    );

    const studentData = validStudents.map((student) => ({
      name: student.name,
      roll: student.roll,
      wing: student.wing,
      hall: student.hall,
      cashRequests: student.cashRequests.filter(
        (record) => !record.accept && isToday(record.date)
      ),
    }));

    res
      .status(200)
      .json({ success: true, students: studentData.length ? studentData : [] });
  } catch (error) {
    console.error("Error fetching wing record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addEvents = async (req, res) => {
  try {
    const { hall, wing, events } = req.body;
    console.log(events);
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
        },
      },
    });
    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }
    if (!events) {
      return res.status(404).json({ success: false, message: "Empty events" });
    }

    const students = wingData.students;
    for (const student of students) {
      for (const event of events) {
        const existingEventIndex = student.events.findIndex(
          (e) => e.date.toDateString() === new Date(event.date).toDateString()
        );

        if (existingEventIndex !== -1) {
          // Merge the event types if the event date already exists
          student.events[existingEventIndex].eventType.push(event.title);
        } else {
          // Create a new event object if the event date doesn't exist
          student.events.push({
            date: new Date(event.date),
            eventType: [event.title],
          });
        }
      }
      await student.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error fetching wing record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const fetchSummary = async (req, res) => {
  try {
    const { hall, wing } = req.body;

    // Find the washerman
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          populate: { path: "records" },
        },
      },
    });

    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const students = wingData.students.filter((student) =>
      student.records.some((record) => record.accept)
    );

    const summary = students.map((student) => ({
      Name: student.name,
      Wing: student.wing,
      Hall: student.hall,
      Roll: student.roll,
      "Total Clothes": student.records.reduce((total, record) => {
        if (record.accept) {
          return (
            total +
            record.clothes.reduce(
              (subtotal, cloth) => subtotal + cloth.quantity,
              0
            )
          );
        }
        return total;
      }, 0),
      "Total Dues": student.dueAmount,
      Month: new Date().toLocaleString("en-us", { month: "long" }),
    }));

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const acceptRecord = async (req, res) => {
  try {
    const { hall, wing, roll } = req.body;
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          match: { roll: roll }, // Directly find the student by roll
          populate: { path: "records" },
        },
      },
    });
    if (!washerman) {
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }
    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }
    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }
    const student = wingData.students[0]; // Since we matched by roll, there should be only one student
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found in this wing" });
    }
    const recordToUpdate = student.records.find(
      (record) => !record.accept && isToday(record.date)
    );
    if (!recordToUpdate) {
      return res
        .status(200)
        .json({ success: true, message: "No records to update for today" });
    }
    recordToUpdate.accept = true;
    await student.save(); // Save the student object to persist the changes
    res
      .status(200)
      .json({ success: true, message: "Record updated successfully" });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const acceptCashPayment = async (req, res) => {
  try {
    const { hall, wing, roll } = req.body;

    // Fetch washerman with nested population
    const washerman = await Washerman.findOne({
      contact: req.user.contact,
    }).populate({
      path: "halls",
      match: { name: hall },
      populate: {
        path: "wings",
        match: { name: wing },
        populate: {
          path: "students",
          match: { roll: roll },
          populate: { path: "cashRequests" }, // Populate cashRequests instead of records
        },
      },
    });

    if (!washerman) {
      console.log("Washerman not found");
      return res
        .status(404)
        .json({ success: false, message: "Washerman not found" });
    }

    const hallData = washerman.halls.find((h) => h.name === hall);
    if (!hallData) {
      console.log("Hall not found for this washerman");
      return res
        .status(404)
        .json({ success: false, message: "Hall not found for this washerman" });
    }

    const wingData = hallData.wings.find((w) => w.name === wing);
    if (!wingData) {
      console.log("Wing not found for this hall");
      return res
        .status(404)
        .json({ success: false, message: "Wing not found for this hall" });
    }

    const student = wingData.students[0];
    if (!student) {
      console.log("Student not found in this wing");
      return res
        .status(404)
        .json({ success: false, message: "Student not found in this wing" });
    }

    const cashRequestToUpdate = student.cashRequests.find(
      (request) => !request.accept && isToday(request.date)
    );

    if (!cashRequestToUpdate) {
      console.log("No cash requests to update for today");
      return res.status(200).json({
        success: true,
        message: "No cash requests to update for today",
      });
    }

    console.log("Original dueAmount:", student.dueAmount);
    console.log(
      "Cash Request dueAmountcash:",
      cashRequestToUpdate.dueAmountcash
    );

    cashRequestToUpdate.accept = true;
    student.dueAmount -= cashRequestToUpdate.dueAmountcash;

    console.log("Updated dueAmount before save:", student.dueAmount);

    // Explicitly mark modified paths
    student.markModified("cashRequests");
    student.markModified("dueAmount");

    student.save();

    console.log("Updated dueAmount after save:", student.dueAmount);

    res.status(200).json({
      success: true,
      message: "Cash payment accepted and due amount updated successfully",
    });
  } catch (error) {
    console.error("Error accepting cash payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const washerman = {
  printSummary,
  wingRecord,
  upcomingDate,
  addEvents,
  collectCloths,
  fetchSummary,
  acceptRecord,
  acceptCashPayment,
  pendingCashRequests,
  fetchStudentCashRequests,
};

export default washerman;
