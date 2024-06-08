import express from "express"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Server } from "socket.io"
import sqlite3 from "sqlite3"
import { open } from "sqlite"

// open the database file
const db = await open({
  filename: "chat.db",
  driver: sqlite3.Database,
})

// create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`)

const app = express()
const server = createServer(app)
const io = new Server(server, {
  connectionStateRecovery: {},
})

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"))
})

io.on("connection", (socket) => {
  console.log("a user connected")
  socket.on("chat message", (msg) => {
    console.log("message: " + msg)
    io.emit("chat message", msg)
  })
  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
})

server.listen(3000, () => {
  console.log("server running at http://localhost:3000")
})
