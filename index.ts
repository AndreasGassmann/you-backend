import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
// import * as socketio from "socket.io";
import * as http from "http";
import * as admin from "firebase-admin";

import { config } from "./config";

import { init } from "./store";

var db = init("index.json");

admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccount as any),
  databaseURL: config.databaseURL
});

let state = new Map();

const cors = require("@koa/cors");
const app = new Koa();

// use cors
app.use(cors());
// use bodyparser
app.use(bodyParser());

const router = new Router();

router.post("/login-request", async (ctx, next) => {
  const { address, location } = ctx.request.body;

  // This registration token comes from the client FCM SDKs.
  const registrationToken = db.get(address);
  if (!registrationToken) {
    // throw new Error("No push token for address");
    ctx.status = 404;
    ctx.body = "No push token for address";
    return;
  }

  // See documentation on defining a message payload.
  var message = {
    notification: {
      title: "New login request",
      body: "Do you want to log in to '" + location + "'?"
    },
    data: {
      location: location
    },
    token: registrationToken
  };

  console.log("Sending message", message);

  // Send a message to the device corresponding to the provided
  // registration token.
  // admin
  //   .messaging()
  //   .send(message)
  //   .then(response => {
  //     // Response is a message ID string.
  //     console.log("Successfully sent message:", response);
  //   })
  //   .catch(error => {
  //     console.log("Error sending message:", error);
  //   });

  ctx.status = 200;
});

router.post("/push/register", async (ctx, next) => {
  const { address, pushToken } = ctx.request.body;
  console.log("address", address);
  console.log("pushToken", pushToken);
  state.set(address, pushToken);

  db.set(address, pushToken);

  ctx.status = 200;
});

// router.post("/login/response", async (ctx, next) => {
//   const { requestId, challenge, signedChallenge } = ctx.request.body;
//   console.log("requestId", requestId);
//   console.log("challenge", challenge);
//   console.log("signedMessage", signedChallenge);
//   (ctx.app as any).io.emit("signResponse", { key: "value" });
//   ctx.status = 200;
// });

app.use(router.routes()).use(router.allowedMethods());

const server = http.createServer(app.callback());
// const io = socketio(server);

// (app as any).io = io;

// io.on("connection", socket => {
//   console.log("a user connected: " + socket.id);
//   socket.on("processedMessage", (msg: string) => {
//     socket.broadcast.emit("processedMessage", msg);
//   });
//   socket.on("stats", (msg: string) => {
//     socket.broadcast.emit("stats", msg);
//   });
// });

server.listen(3000, () => {
  console.log("Application is starting on port 3000");
});
