import crypto from "crypto";
import Student from "../schemas/student.js";
import AuthCode from "../schemas/auth.js";
import Data from "../schemas/data.js";
import pay from "../payment/pay.js";
import Washerman from "../schemas/washerman.js";
import jwt from "jsonwebtoken";

const fetchUpcomingDate = async (req, res) => {
  try {
    // Find the student by their roll number
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Get the washerman ObjectID from the student document
    const washermanId = student.washerman;
    if (!washermanId) {
      return res.status(404).json({
        success: false,
        message: "Washerman not assigned to the student",
      });
    }

    // Find the washerman by their ObjectID
    const washerman = await Washerman.findById(washermanId);
    if (!washerman) {
      return res.status(404).json({
        success: false,
        message: "Washerman not found",
      });
    }

    // Respond with the washerman details and upcoming date
    return res.status(200).json({
      success: true,
      upcomingDate: washerman.upcomingDate,
      washermanName: washerman.name,
      washermanContact: washerman.contact,
    });
  } catch (error) {
    console.error("Error fetching upcoming date:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const register = async (req, res) => {
  const { roll, name, email, hall, wing, pass, authCode } = req.body;

  try {
    const existingStudent = await Student.findOne({
      $or: [{ roll }, { email }],
    });
    if (existingStudent) {
      console.log("Student with the same ID or email already exists");
      return res
        .status(400)
        .json({ message: "Student with the same ID or email already exists" });
    }

    // Verify authentication code
    const storedAuthCode = await AuthCode.findOne({ email });
    if (!storedAuthCode || storedAuthCode.authCode !== authCode) {
      console.log("Invalid authentication code");
      return res.status(400).json({ message: "Invalid authentication code" });
    }

    const hallObject = await Data.Hall.findOne({ name: hall });
    if (!hallObject) {
      console.log("Hall does not exist");
      return res.status(400).json({ message: "Hall does not exist" });
    }

    const wingObject = await Data.Wing.findOne({
      parentHall: hall,
      name: wing,
    });
    if (!wingObject) {
      console.log("Wing does not exist in the specified hall");
      return res
        .status(400)
        .json({ message: "Wing does not exist in the specified hall" });
    }

    // Hash the password using SHA256
    const passHash = sha256(pass);

    // Create a new student object
    const newStudent = new Student({
      roll,
      name,
      email,
      hall,
      wing,
      passHash,
      washerman: wingObject.washerman,
    });

    // Save the new student to the database
    await newStudent.save();
    console.log("New student saved:", newStudent);

    wingObject.students.push(newStudent._id);
    await wingObject.save();

    // Delete the used auth code
    await AuthCode.deleteOne({ _id: storedAuthCode._id });

    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const requestWash = async (req, res) => {
  try {
    const student = await Student.findOne({ roll: req.user.roll }).populate(
      "washerman"
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const { clothes } = req.body;
    const currentDate = new Date().toDateString();

    // Find existing record for today that is not accepted yet
    const existingRecordIndex = student.records.findIndex((record) => {
      return record.date.toDateString() === currentDate && !record.accept;
    });

    // Calculate total amount for the current wash request
    const totalAmount = clothes.reduce((acc, cloth) => {
      const clothPrice = 10; // Example price per cloth unit
      return acc + cloth.quantity * clothPrice;
    }, 0);

    // If there's an existing pending request, update it
    if (existingRecordIndex !== -1) {
      // Get the old amount for the existing request
      const oldAmount = student.records[existingRecordIndex].clothes.reduce(
        (acc, cloth) => {
          const clothPrice = 10; // Example price per cloth unit
          return acc + cloth.quantity * clothPrice;
        },
        0
      );

      // Update the dueAmount by removing the old amount and adding the new amount
      student.dueAmount = student.dueAmount - oldAmount + totalAmount;

      // Update the clothes details in the existing request
      student.records[existingRecordIndex].clothes = clothes.map((cloth) => ({
        type: cloth.type,
        quantity: cloth.quantity,
      }));
      await student.save();
      return res.status(200).json({
        success: true,
        message: "Update success",
        totalAmount: totalAmount,
      });
    }

    // If there's an accepted request for today, reject the new request
    const existingAcceptedRecordIndex = student.records.findIndex((record) => {
      return record.date.toDateString() === currentDate && record.accept;
    });

    if (existingAcceptedRecordIndex !== -1) {
      return res
        .status(400)
        .json({ success: false, message: "Request already accepted" });
    }

    // Add the total amount to the existing due amount for a new request
    student.dueAmount += totalAmount;

    // Create a new record for the wash request
    const record = {
      date: new Date(),
      clothes: clothes.map((cloth) => ({
        type: cloth.type,
        quantity: cloth.quantity,
      })),
      accept: false,
    };

    student.records.push(record);
    await student.save();

    res.status(200).json({
      success: true,
      message: "Request sent successfully",
      totalAmount: totalAmount,
    });
  } catch (error) {
    console.error("Error handling requestWash:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const requestCash = async (req, res) => {
  try {
    const student = await Student.findOne({ roll: req.user.roll }).populate(
      "washerman"
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const { dueAmountcash } = req.body;
    const currentDate = new Date().toDateString();

    console.log("Current Date:", currentDate);
    console.log("Received dueAmount:", dueAmountcash);

    // Check if there's an accepted request for today
    const existingAcceptedRecordIndex = student.cashRequests.findIndex(
      (record) => record.date.toDateString() === currentDate && record.accept
    );

    if (existingAcceptedRecordIndex !== -1) {
      return res
        .status(400)
        .json({ success: false, message: "Request already accepted" });
    }

    // Find existing record for today that is not accepted yet
    const existingcashRequestsIndex = student.cashRequests.findIndex(
      (record) => record.date.toDateString() === currentDate && !record.accept
    );

    if (existingcashRequestsIndex !== -1) {
      // Update the existing pending request
      student.cashRequests[existingcashRequestsIndex].dueAmount = dueAmount;
      await student.save();
      return res.status(200).json({
        success: true,
        message: "Cash request updated successfully",
        dueAmountcash: dueAmountcash,
      });
    }

    // Add a new cash request if none exists for today
    const cashRequest1 = {
      date: new Date(),
      dueAmountcash: dueAmountcash,
      accept: false,
    };
    student.cashRequests.push(cashRequest1);
    await student.save();

    console.log("Cash request saved:", cashRequest1);

    // Notify the washerman
    // (Assuming you have a function to send notifications)

    res.status(200).json({
      success: true,
      message: "Cash request sent successfully",
      dueAmountcash: dueAmountcash,
    });
  } catch (error) {
    console.error("Error handling requestCash:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const fetchDates = async (req, res) => {
  try {
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found " });
    }
    const dates = student.records.map((record) => record.date.toDateString());

    return res.status(200).json({ success: true, dates });
  } catch (error) {
    console.error("Error in  fetching dates:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// const clearDue = async (req, res) => {
//   try {
//     const student = await Student.findOne({ roll: req.user.roll }).populate(
//       "washerman"
//     );
//     if (!student) {
//       console.log("Student not found");
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     // No Due
//     if (student.dueAmount === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No dues to clear" });
//     }

//     // Prepare data for creating a payment order
//     const orderData = {
//       user_id: student.roll,
//       price: student.dueAmount, // Due amount to be paid
//       phone: student.phone, // Assuming phone number is stored in student object
//       name: student.name, // Assuming student name is stored in student object
//     };

//     console.log("Order data prepared:", orderData);

//     // Creating a payment order to PhonePe
//     const order = await pay.createOrder({ body: orderData }, res);

//     console.log("Order response:", order);

//     if (order.success) {
//       return res.status(200).json({
//         success: true,
//         message: "Order created successfully",
//         paymentUrl: order.paymentUrl,
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "Failed to create order" });
//     }
//   } catch (error) {
//     console.error("Error in clearing dues:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

// const clearDue = async (req, res) => {
//   try {
//     const student = await Student.findOne({ roll: req.user.roll }).populate(
//       "washerman"
//     );
//     if (!student) {
//       console.log("Student not found");
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     // No Due
//     if (student.dueAmount === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No dues to clear" });
//     }

//     // Validate if due amount is positive
//     if (student.dueAmount < 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid due amount" });
//     }

//     // Get the phone number from the request body or from the student object
//     const phone = req.body.phone || student.phone;

//     // Validate if phone number is provided
//     if (!phone) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Phone number is required for online payments",
//         });
//     }

//     // Prepare data for creating a payment order
//     const orderData = {
//       user_id: student.roll,
//       price: student.dueAmount, // Due amount to be paid
//       phone: phone,
//       name: student.name,
//     };

//     console.log("Order data prepared:", orderData);

//     // Creating a payment order to PhonePe
//     const order = await pay.createOrder({ body: orderData }, res);

//     console.log("Order response:", order);

//     if (order.success) {
//       return res.status(200).json({
//         success: true,
//         message: "Order created successfully",
//         paymentUrl: order.paymentUrl,
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "Failed to create order" });
//     }
//   } catch (error) {
//     console.error("Error in clearing dues:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

const clearDue = async (req, res) => {
  try {
    const student = await Student.findOne({ roll: req.user.roll }).populate(
      "washerman"
    );
    if (!student) {
      console.log("Student not found");
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (student.dueAmount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No dues to clear" });
    }

    if (student.dueAmount < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid due amount" });
    }

    const phone = req.body.phone || student.phone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for online payments",
      });
    }

    const orderData = {
      user_id: student.roll,
      price: student.dueAmount,
      phone: phone,
      name: student.name,
    };

    const order = await pay.createOrder({ body: orderData });

    if (order.success) {
      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        paymentUrl: order.paymentUrl,
      });
    } else {
      return res.status(400).json({ success: false, message: order.message });
    }
  } catch (error) {
    console.error("Error in clearing dues:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const fetchRecord = async (req, res) => {
  const { date } = req.body;
  try {
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    // getting record of requested date
    const recordForDate = student.records.filter((record) => {
      const recordDate = new Date(record.date);
      const queryDate = new Date(date);
      return recordDate.toDateString() === queryDate.toDateString();
    });
    // clothes given on that date
    const clothesForDate = recordForDate
      .map((record) => ({
        clothes: record.clothes,
        accept: record.accept,
      }))
      .flat();

    return res.status(200).json({ success: true, clothes: clothesForDate });
  } catch (error) {
    console.error("Error fetching records:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const fetchDueAmount = async (req, res) => {
  if (!req.user || !req.user.roll) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  console.log(`Fetching due amount for roll: ${req.user.roll}`);

  try {
    // Find the student by their roll number
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    console.log(student.dueAmount);
    // Respond with the due amount
    return res
      .status(200)
      .json({ success: true, dueAmount: student.dueAmount });
  } catch (error) {
    console.error("Error in fetching due amount :", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const fetchNameandDueAmount = async (req, res) => {
  if (!req.user || !req.user.roll) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Find the student by their roll number
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    console.log(student.dueAmount);
    // Respond with the due amount
    return res.status(200).json({
      success: true,
      name: student.name,
      dueAmount: student.dueAmount,
    });
  } catch (error) {
    console.error("Error in fetching due amount :", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const fetchReceipt = async (req, res) => {
  const { date } = req.body;

  try {
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Getting receipts for the requested date
    const receiptsForDate = student.receipts.filter((receipt) => {
      const receiptDate = new Date(receipt.timestamp);
      const queryDate = new Date(date);
      return receiptDate.toDateString() === queryDate.toDateString();
    });

    return res.status(200).json({ success: true, receipts: receiptsForDate });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const paymentDates = async (req, res) => {
  try {
    const student = await Student.findOne({ roll: req.user.roll });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const paymentDates = student.receipts.map((receipt) =>
      receipt.timestamp.toDateString()
    );

    return res.status(200).json({ success: true, paymentDates });
  } catch (error) {
    console.error("Error fetching payment dates:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
//reset password
const resetPassword = async (req, res) => {
  const { roll, email, newPass, authCode } = req.body;

  try {
    // Find the student by roll or email
    const student = await Student.findOne({ $and: [{ roll }, { email }] });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify authentication code
    const storedAuthCode = await AuthCode.findOne({
      $or: [{ roll }, { email }],
    });
    if (!storedAuthCode || storedAuthCode.authCode !== authCode) {
      return res.status(400).json({ message: "Invalid authentication code" });
    }
    // Generate a new password hash
    const passHash = sha256(newPass);

    // Update the student's password hash
    student.passHash = passHash;
    await student.save();
    console.log("done");
    // Delete the authentication code from the database
    await AuthCode.deleteOne({ _id: storedAuthCode._id });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

const student = {
  register,
  requestWash,
  fetchDates,
  clearDue,
  fetchRecord,
  fetchReceipt,
  fetchDueAmount,
  paymentDates,
  resetPassword,
  fetchUpcomingDate,
  requestCash,
  fetchNameandDueAmount,
};

export default student;
