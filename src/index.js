const path = require("path");
const http = require("http");
const Filter = require("bad-words");
const express = require("express");
const socketio = require("socket.io");
const {
  generateMsg,
  generateLocationMsg
} = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users')

app = express();
const server = http.createServer(app); //express does it anyway, but we need access to server for socket io
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

//function to run when connection is made
io.on("connection", socket => {

  //for user disconnecting
  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    //if a user did not joind becouse of an invalid user name or other error
    if (user) {
      io.to(user.room).emit("message", generateMsg(`${user.username} has left the room!`, "system message"));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });

  //when other users send a message we get it here than send it to everyone
  socket.on("sendMessage", (message, callback) => {
    const {
      room,
      username
    } = getUser(socket.id)

    //checking for bad words
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profanity is not allowed");
    }

    io.to(room).emit("message", generateMsg(message, username));
    callback(); //acknoledging msg recived
  });

  //listenning for a location from user
  socket.on("sendLocation", (location) => {
    const {
      room,
      username
    } = getUser(socket.id)

    io.to(room).emit(
      "locationMessage",
      generateLocationMsg(`https://google.com/maps?q=${location.lat},${location.long}`, username)
    );
  });

  socket.on('join', (options, callback) => {
    //what comes back from adding user
    const {
      error,
      user
    } = addUser({
      id: socket.id,
      ...options
    })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    socket.emit("message", generateMsg("Welcome!", "system message"));
    socket.broadcast.to(user.room).emit("message", generateMsg(`${user.username} hase joind`, "system message")); //transmitting to every one EXCEPT for the new user connecting
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })
});

server.listen(port, () => {
  console.log(`listening on port ${port}!`);
});