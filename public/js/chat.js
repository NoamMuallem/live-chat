const socket = io();

//elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {
  username,
  room
} = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

//autoscrolling functionality
const autoscroll = () => {
  // New message
  const $newMessage = $messages.lastElementChild

  //height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //visible height
  const visibleHeight = $messages.offsetHeight

  //height of messages container
  const containerHeight = $messages.scrollHeight

  //how far have i scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  //making sur we wer on the buttom when the new message was recived
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }

}

//handleing message response
socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("H:mm"),
    username: message.name
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

//handleing location response
socket.on('locationMessage', (location) => {
  const html = Mustache.render(locationTemplate, {
    url: location.location,
    createdAt: moment(location.createdAt).format("H:mm"),
    username: location.name
  })
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
})

//handle room users changes
socket.on('roomData', ({
  room,
  users
}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

//submit msg
document.querySelector(`#message-form`).addEventListener("submit", e => {
  e.preventDefault();
  //disable form
  $messageFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", $messageFormInput.value, error => {
    //enaable form
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    //will run after every thing finished, if a bad word will get an error
    if (error) {
      console.log(error);
    }
  });
});

//send location
document.querySelector("#send-location").addEventListener("click", () => {
  //disableing send location button
  $locationButton.setAttribute("disabled", "disabled");

  if (!navigator.geolocation) {
    //if navigation is not available
    return alert("not supported by you'r browser");
  }

  navigator.geolocation.getCurrentPosition(position => {
    //enableing send location button
    $locationButton.removeAttribute("disabled");

    //sending the server the data
    socket.emit(
      "sendLocation", {
        lat: position.coords.latitude,
        long: position.coords.longitude
      }
    );
  });
});

socket.emit('join', {
  username,
  room
}, (error) => {
  if (error) {
    alert(error)
    //redirect to main directory
    location.href = '/'
  }
})