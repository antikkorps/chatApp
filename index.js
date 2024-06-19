import express from "express"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Server } from "socket.io"

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const server = createServer(app)

const io = new Server(server, {
  connectionStateRecovery: {},
})

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"))
})

io.on("connection", async (socket) => {
  console.log("a user connected")
  socket.on("chat message", async (msg, clientOffset) => {
    let result
    try {
      // store the message in the database
      result = await prisma.message.create({
        data: {
          content: msg,
          client_offset: clientOffset,
        },
      })
    } catch (e) {
      // TODO handle the failure
      console.error(e)
      return
    }
    // include the offset with the message
    io.emit("chat message", msg, result.lastID)
  })

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      const serverOffset = socket.handshake.auth.serverOffset || 0
      const messages = await prisma.message.findMany({
        where: {
          id: {
            gt: serverOffset.toString(),
          },
        },
        orderBy: {
          id: "asc",
        },
      })
      messages.forEach((message) => {
        socket.emit("chat message", message.content, message.id)
      })
    } catch (e) {
      // handle error
      console.error(e)
    }
  }

  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
})

server.listen(3000, () => {
  console.log("server running at http://localhost:3000")
})
