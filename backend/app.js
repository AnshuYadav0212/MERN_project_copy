import express from "express";
import axios from "axios";
import connectDB from "./src/configs/db.js";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import router from "./src/routes/router.js";
import morgan from "morgan";
import nodemon from "nodemon";
import crypto from "crypto";
import cors from "cors";

const app = express();
// Parsing json requests
app.use(bodyParser.json());
app.use(cookieParser());

// Loading env variables
dotenv.config();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // Allow the requesting origin dynamically
    },
    credentials: true,
  })
);

// Use Morgan for HTTP request logging
app.use(morgan("dev"));

console.log("DBMS Backend Service");

// Server Port
const PORT = process.env.PORT || 5001;

app.use(router);

// Connecting to mongodb Atlas then running Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error in  connecting to MongoDB:", error);
  });

const merchantId = "PGTESTPAYUAT"; //process.env.PHONEPE_MERCHANT_ID;
const secretKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"; //process.env.PHONEPE_SECRET_KEY;

app.post("/order", async (req, res) => {
  try {
    let merchantTransactionId = req.body.transactionID;

    const data = {
      merchantId: merchantId,
      merchantTransactionId,
      merchantUserId: req.body.MUID,
      name: req.body.name,
      amount: req.body.amount * 100,
      redirectUrl: "/status?id=${merchantTransactionId}",
      redirectMode: "POST",
      mobileNumber: req.body.phone,
      bankId: "SBIN",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + secretKey;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL =
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    await axios(options)
      .then(function (response) {
        console.log(response.data);
        return res.json(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
});

nodemon({
  ext: "js",
  ignore: ["node_modules/"], // Ignore changes in the node_modules directory
});
