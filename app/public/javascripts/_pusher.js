const pusher = new Pusher('968799b8f88c1d76da50', { 
  cluster: "us3",
  authEndpoint: "/api/auth/pusher"
});

const roomId = document.getElementById("roomId").value;
const userId = document.getElementById("userId").value;