import app from "../../app.js";
import request from "supertest";

const adminLogin = async () => {
  const loginDetails = {
    username: "admin",
    password: "password1",
  };

  const res = await request(app)
    .post("/session/admin/login")
    .send(loginDetails);

  // Extract token from Set-Cookie header
  const cookieHeader = res.headers["set-cookie"];
  const token = extractTokenFromCookieHeader(cookieHeader);
  console.log(token);
  return token;
};

// Helper function to extract token from cookie header
const extractTokenFromCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader.find((cookie) =>
    cookie.startsWith("token=")
  );
  if (!tokenCookie) return null;

  const token = tokenCookie.split(";")[0].split("=")[1];
  return token;
};

let adminToken;

beforeAll(async () => {
  adminToken = await adminLogin();
});

describe("Testing Hall Data Addition Route", () => {
  test("addHallData with valid data", async () => {
    const reqBody = {
      Halls: [
        { hallName: "hall-6", wings: ["wing-x", "wing-y"] },
        { hallName: "hall-7", wings: ["wing-x", "wing-y", "wing-z"] },
      ],
    };

    const res = await request(app)
      .post("/admin/addHallData")
      .set("Cookie", `token=${adminToken}`)
      .send(reqBody);

    expect(res.status).toEqual(201);
    expect(res.body).toEqual({ message: "Halls added successfully" });
  });

  test("addHallData with missing data", async () => {
    const reqBody = {
      // Missing required fields
    };

    const res = await request(app)
      .post("/admin/addHallData")
      .set("Cookie", `token=${adminToken}`)
      .send(reqBody);

    expect(res.status).toEqual(500);
    expect(res.body).toEqual({
      message: "Bad Request (Wrong/Missing Keys in json)",
    });
  });
});

describe("Testing Washerman Registration Route", () => {
  test("registerWasherman with valid data", async () => {
    const reqBody = {
      contact: "6666666666",
      name: "washerman6",
      pass: "washerman6",
      halls: [
        { name: "hall-6", wings: ["wing-x", "wing-y"] },
        { name: "hall-7", wings: ["wing-z"] },
      ],
      accountID: "razorPayID6",
    };

    const res = await request(app)
      .post("/admin/washerman/register")
      .set("Cookie", `token=${adminToken}`)
      .send(reqBody);

    expect(res.status).toEqual(201);
    expect(res.body).toEqual({ message: "Washerman registered successfully" });
  });

  test("registerWasherman with missing data", async () => {
    const reqBody = {
      // Missing required fields
    };

    const res = await request(app)
      .post("/admin/washerman/register")
      .set("Cookie", `token=${adminToken}`)
      .send(reqBody);

    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      message: "Bad Request (Wrong/Missing Keys in JSON)",
    });
  });

  test("washerman already exists", async () => {
    const reqBody = {
      contact: "6666666666",
      name: "washerman6",
      pass: "washerman6",
      halls: [
        { name: "hall-6", wings: ["wing-x", "wing-y"] },
        { name: "hall-7", wings: ["wing-z"] },
      ],
      accountID: "razorPayID6",
    };

    const res = await request(app)
      .post("/admin/washerman/register")
      .set("Cookie", `token=${adminToken}`)
      .send(reqBody);

    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      message: "Washerman with the same contact already exists",
    });
  });
});
