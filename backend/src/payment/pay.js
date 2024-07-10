// import Razorpay from "razorpay";
// import Student from "../schemas/student.js";

// const razorpay = new Razorpay({
//   key_id: process.env.KEY_ID,
//   key_secret: process.env.KEY_SECRET,
// });

// const createOrder = async (amount, currency, accountID, description) => {
//   try {
//     const options = {
//       amount: amount * 100, // razor pay config expects paise for INR
//       currency: currency,
//       receipt: "receipt_" + Date.now(),
//       payment_capture: 1,
//       notes: {
//         accountID: accountID,
//         description: description,
//       },
//     };

//     const order = await razorpay.orders.create(options);
//     return order;
//   } catch (error) {
//     throw error;
//   }
// };

// const verifyPayment = async (req, res) => {
//   const { orderId, paymentId, signature } = req.body;

//   try {
//     const isValidSignature = razorpay.webhooks.validateWebhookSignature(
//       JSON.stringify(req.body),
//       signature,
//       process.env.WEBHOOK_SECRET
//     );
//     if (!isValidSignature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid webhook signature" });
//     }

//     const order = await razorpay.orders.fetch(orderId);

//     if (
//       order &&
//       order.status === "paid" &&
//       order.amount_paid === order.amount
//     ) {
//       const receipt = {
//         orderId: orderId,
//         paymentId: paymentId,
//         amount: order.amount / 100,
//         currency: order.currency,
//         timestamp: new Date(),
//       };

//       const student = await Student.findOne({ roll: req.user.roll }).populate(
//         "washerman"
//       );
//       if (!student) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Student not found" });
//       }

//       student.receipts.push(receipt);

//       student.lastCleared = new Date();

//       await student.save();

//       // Transfering Payment to washerman after verification
//       await transferPayment(
//         student.dueAmount,
//         "INR",
//         student.washerman.accountID,
//         "Clothes Due clearance"
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Payment verified successfully",
//         receipt,
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment verification failed" });
//     }
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

// const transferPayment = async (amount, currency, accountID, description) => {
//   try {
//     // Create a payout order to transfer payment to washerman
//     const options = {
//       amount: amount * 100,
//       currency: currency,
//       account: accountID,
//       notes: {
//         description: description,
//       },
//     };

//     const payout = await razorpay.payouts.create(options);
//     return payout;
//   } catch (error) {
//     throw error;
//   }
// };

// const pay = { createOrder, verifyPayment };

// export default pay;
/*

import axios from "axios";
import Student from "../schemas/student.js";

const phonepeBaseUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg"; // Replace with actual PhonePe API base URL
const merchantId = "PGTESTPAYUAT"; //process.env.PHONEPE_MERCHANT_ID;
const secretKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"; //process.env.PHONEPE_SECRET_KEY;

const generateTransactionId = () => {
  const timestamp = new Date().getTime().toString();
  const randomNum = Math.floor(Math.random() * 1000000).toString();
  return `TXN${timestamp}${randomNum}`;
};

const createOrder = async (amount, currency, accountID, description) => {
  try {
    const transactionId = generateTransactionId();
    const requestBody = {
      merchantId: merchantId,
      merchantTransactionID: generateTransactionId(),
      merchantUserID: "M22C34JYMOPKS",
      amount: amount * 100, // Amount in paise
      transactionId: transactionId,
      currency: currency,
      callbackUrl: `${process.env.REACT_APP_BACKEND_URL}/verifyPayment`, // Replace with your actual callback URL
      description: description,
      accountID: accountID,
    };

    const signature = generateSignature(requestBody, secretKey);

    const response = await axios.post(
      ` ${phonepeBaseUrl}/v1/payment/initiate`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
        },
      }
    );

    if (response.data.success) {
      return { ...response.data, transactionId };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    throw error;
  }
};

// Helper function to generate signature for PhonePe requests
const generateSignature = (data, key) => {
  const encodedData = JSON.stringify(data);
  const crypto = require("crypto");
  return crypto.createHmac("sha256", key).update(encodedData).digest("base64");
};

const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    const isValidSignature = validateSignature(req.body, signature, secretKey);
    if (!isValidSignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid webhook signature" });
    }

    const response = await axios.get(
      `${phonepeBaseUrl}/v1/payment/status/${orderId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": generateSignature({ orderId }, secretKey),
        },
      }
    );

    const paymentStatus = response.data;

    if (paymentStatus.success && paymentStatus.data.status === "PAID") {
      const receipt = {
        orderId: orderId,
        paymentId: paymentId,
        amount: paymentStatus.data.amount / 100,
        currency: paymentStatus.data.currency,
        timestamp: new Date(),
      };

      const student = await Student.findOne({ roll: req.user.roll }).populate(
        "washerman"
      );
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      student.receipts.push(receipt);
      student.lastCleared = new Date();
      await student.save();

      await transferPayment(
        student.dueAmount,
        "INR",
        student.washerman.accountID,
        "Clothes Due clearance"
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        receipt,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const validateSignature = (data, signature, key) => {
  const encodedData = JSON.stringify(data);
  const crypto = require("crypto");
  const computedSignature = crypto
    .createHmac("sha256", key)
    .update(encodedData)
    .digest("base64");
  return computedSignature === signature;
};

const transferPayment = async (amount, currency, accountID, description) => {
  try {
    const transactionId = generateTransactionId();
    const requestBody = {
      merchantId: merchantId,
      amount: amount * 100, // Amount in paise
      transactionId: transactionId,
      currency: currency,
      accountID: accountID,
      description: description,
    };

    const signature = generateSignature(requestBody, secretKey);

    const response = await axios.post(
      `${phonepeBaseUrl}/v1/payment/transfer`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
        },
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    throw error;
  }
};

const pay = { createOrder, verifyPayment };

export default pay;
*/

// import crypto from "crypto";
// import axios from "axios";
// import dotenv from "dotenv";

// // Load environment variables from .env file
// dotenv.config();

// // Helper function to generate signature for PhonePe requests
// const generateSignature = (data, key) => {
//   const encodedData = JSON.stringify(data);
//   const crypto = require("crypto");
//   return crypto.createHmac("sha256", key).update(encodedData).digest("base64");
// };
// const generateTransactionId = () => {
//   const timestamp = new Date().getTime().toString();
//   const randomNum = Math.floor(Math.random() * 1000000).toString();
//   return `TXN${timestamp}${randomNum}`;
// };

// const createOrder = async (req, res) => {
//   try {
//     const merchantTransactionId = "M" + Date.now();
//     const { user_id, price, phone, name } = req.body;
//     const data = {
//       merchantId: process.env.MERCHANT_ID,
//       merchantTransactionId: generateTransactionId(),
//       merchantUserId: "MUID" + user_id,
//       name: name,
//       amount: price * 100,
//       redirectUrl: `http://localhost:3001/api/v1/status/${merchantTransactionId}`,
//       redirectMode: "POST",
//       mobileNumber: phone,
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };
//     const payload = JSON.stringify(data);
//     const payloadMain = Buffer.from(payload).toString("base64");
//     const keyIndex = 1;
//     const string = payloadMain + "/pg/v1/pay" + process.env.SALT_KEY;
//     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//     const checksum = sha256 + "###" + keyIndex;
//     const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
//     const options = {
//       method: "POST",
//       url: prod_URL,
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/json",
//         "X-VERIFY": checksum,
//       },
//       data: {
//         request: payloadMain,
//       },
//     };
//     axios
//       .request(options)
//       .then(function (response) {
//         return res.redirect(
//           response.data.data.instrumentResponse.redirectInfo.url
//         );
//       })
//       .catch(function (error) {
//         console.error(error);
//       });
//   } catch (error) {
//     res.status(500).send({
//       message: error.message,
//       success: false,
//     });
//   }
// };
// const checkStatus = async (req, res) => {
//   const merchantTransactionId = req.params["txnId"];
//   const merchantId = process.env.MERCHANT_ID;
//   const keyIndex = 2;
//   const string =
//     `/pg/v1/status/${merchantId}/${merchantTransactionId}` +
//     process.env.SALT_KEY;
//   const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//   const checksum = sha256 + "###" + keyIndex;
//   const options = {
//     method: "GET",
//     url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
//     headers: {
//       accept: "application/json",
//       "Content-Type": "application/json",
//       "X-VERIFY": checksum,
//       "X-MERCHANT-ID": `${merchantId}`,
//     },
//   };
//   // CHECK PAYMENT STATUS
//   axios
//     .request(options)
//     .then(async (response) => {
//       if (response.data.success === true) {
//         console.log(response.data);
//         return res
//           .status(200)
//           .send({ success: true, message: "Payment Success" });
//       } else {
//         return res
//           .status(400)
//           .send({ success: false, message: "Payment Failure" });
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send({ msg: err.message });
//     });
// };
// const pay = { createOrder, checkStatus };

// export default pay;

import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables from .env file
dotenv.config();

const generateSignature = (data, key) => {
  const encodedData = JSON.stringify(data);
  return crypto.createHmac("sha256", key).update(encodedData).digest("base64");
};

const generateTransactionId = () => {
  const timestamp = new Date().getTime().toString();
  const randomNum = Math.floor(Math.random() * 1000000).toString();
  return `TXN${timestamp}${randomNum}`;
};

const merchantId = "PGTESTPAYUAT"; //process.env.PHONEPE_MERCHANT_ID;
const secretKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"; //process.env.PHONEPE_SECRET_KEY;

// const createOrder = async (req, res) => {
//   try {
//     let merchantTransactionId = req.body.transactionID;
//     const data = {
//       merchantId: merchantId,
//       merchantTransactionId,
//       merchantUserId: req.body.MUID,
//       name: req.body.name,
//       amount: req.body.amount * 100,
//       redirectUrl: `http://localhost:5001/status?id=${merchantTransactionId}`,
//       redirectMode: "POST",
//       mobileNumber: req.body.phone,
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     const payload = JSON.stringify(data);
//     const payloadMain = Buffer.from(payload).toString("base64");
//     const keyIndex = 1;
//     const string = payloadMain + "/pg/v1/pay" + secretKey;
//     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//     const checksum = sha256 + "###" + keyIndex;

//     const prod_URL =
//       "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
//     const options = {
//       method: "POST",
//       url: prod_URL,
//       headers: {
//         accept: "application/json",
//         "content-Type": "application/json",
//         "X-VERIFY": checksum,
//       },
//       data: {
//         request: payloadMain,
//       },
//     };

//     axios
//       .request(options)
//       .then(function (response) {
//         console.log(response.data);
//         return res.json(response.data);
//       })
//       .catch(function (error) {
//         console.error(error);
//       });
//   } catch (error) {
//     res.status(500).send({
//       message: error.message,
//       success: false,
//     });
//   }
// };

const checkStatus = async (req, res) => {
  const merchantTransactionId = req.params["txnId"];
  const merchantId = merchantId;
  const keyIndex = 2;
  const string =
    `/pg/v1/status/${merchantId}/${merchantTransactionId}` +
    process.env.SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;
  const options = {
    method: "GET",
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };
  axios
    .request(options)
    .then(async (response) => {
      if (response.data.success === true) {
        await sendEmailReceipt(req.user.email, response.data);
        return res
          .status(200)
          .send({ success: true, message: "Payment Success" });
      } else {
        return res
          .status(400)
          .send({ success: false, message: "Payment Failure" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ msg: err.message });
    });
};

const sendEmailReceipt = async (email, paymentData) => {
  const transporter = nodemailer.createTransport({
    service: "iitk.ac.in",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Payment Receipt",
    text: `Your payment was successful. Here are the details: ${JSON.stringify(
      paymentData
    )}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Receipt email sent successfully");
  } catch (error) {
    console.error("Error sending receipt email:", error);
  }
};

const pay = { checkStatus };
export default pay;
