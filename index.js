import express from "express"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Server } from "socket.io"
// import sqlite3 from "sqlite3"
import { open } from "sqlite"

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const server = createServer(app)

// // open the database file
// const db = await open({
//   filename: "chat.db",
//   driver: sqlite3.Database,
// })

// // create our 'messages' table (you can ignore the 'client_offset' column for now)
// await db.exec(`
//   CREATE TABLE IF NOT EXISTS messages (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       client_offset TEXT UNIQUE,
//       content TEXT
//   );
// `)

try {
  // store the message in the database
  result = await prisma.message.create({
    data: {
      content: msg,
    },
  })
} catch (e) {
  // TODO handle the failure
  console.error(e)
}

const io = new Server(server, {
  connectionStateRecovery: {},
})

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"))
})

io.on("connection", async (socket) => {
  console.log("a user connected")
  socket.on("chat message", async (msg) => {
    console.log("message: " + msg)
    let result
    try {
      // store the message in the database
      result = await db.run("INSERT INTO messages (content) VALUES (?)", msg)
    } catch (e) {
      // TODO handle the failure
      return
    }
    // include the offset with the message
    io.emit("chat message", msg, result.lastID)
  })

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      await db.each(
        "SELECT id, content FROM messages WHERE id > ?",
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit("chat message", row.content, row.id)
        }
      )
    } catch (e) {
      // something went wrong
    }
  }

  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
})

server.listen(3000, () => {
  console.log("server running at http://localhost:3000")
})
