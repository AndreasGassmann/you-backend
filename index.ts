import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as socketio from "socket.io";
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

router.post("/push/register", async (ctx, next) => {
  const { address, pushToken } = ctx.request.body;
  console.log("address", address);
  console.log("pushToken", pushToken);
  state.set(address, pushToken);

  db.set(address, pushToken);

  ctx.status = 200;
});

router.post("/login/response", async (ctx, next) => {
  const { uuid, username, password } = ctx.request.body;

  if (OPEN_SOCKETS[uuid] !== undefined) {
    OPEN_SOCKETS[uuid].emit("login_response_" + uuid, { username: username, password: password })
    ctx.status = 200
  } else {
    ctx.status = 400
  }
});

app.use(router.routes()).use(router.allowedMethods());

const server = http.createServer(app.callback());
const io = socketio(server)

const OPEN_SOCKETS = {};

(app as any).io = io;

io.on("connection", socket => {
  console.log("a user connected: " + socket.id)
  socket.on("login_request", (msg) => {
    OPEN_SOCKETS[msg.uuid] = socket
    const registrationToken = db.get(msg.address)
    if (registrationToken) {
      const message = {
        notification: {
          title: "New login request",
          body: "Do you want to log in to '" + msg.location + "'?"
        },
        data: {
          location: msg.location,
          uuid: msg.uuid
        },
        token: registrationToken
      }
      admin.messaging()
        .send(message)
        .then(response => {
          console.log("Successfully sent message:", response);
        })
        .catch(error => {
          console.log("Error sending message:", error);
        })
    }
  })
})


const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log("Application is starting on port " + port);
});
