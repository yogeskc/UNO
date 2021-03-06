// Pusher
const gameStateChannel = pusher.subscribe(`presence-STATE_${roomId}${userId}`);
const gameChannel = pusher.subscribe(`presence-STATE${roomId}`);
const gameData = { members: {}, memberCount: 0 }
// Bootstrap Modals
const colorChooserModal = new bootstrap.Modal(document.getElementById('choose-color-modal'), { backdrop: 'static', keyboard:false, focus: true } ); 
const gameOverModal = new bootstrap.Modal(document.getElementById('game-over-modal'), { backdrop: 'static', keyboard:false, focus: true });

// ====================================================================
// Event Listeners
// ====================================================================
gameChannel.bind("pusher:subscription_succeeded", async (data) => {
  gameData.members = data.members;
  gameData.memberCount = data.count;

  // Get initial state on initial channel subscription.
  requestGameState();
})

gameChannel.bind("pusher:member_added", (member) => {
  gameData.members[member.id] = member.info;
  gameData.memberCount += 1;
});

gameChannel.bind("pusher:member_removed", (member) => {
  delete gameData.members[member.id];
  gameData.memberCount -= 1;
})

gameStateChannel.bind("GAME_STATE", (state) => {
  console.log(state);
  renderGameInfo(state);
  renderCards(state);
  if(state.isGameOver) {
    renderGameOverModal(state);
  }
})

gameStateChannel.bind("GAME_COLOR_CHOOSER", (state) => {
  colorChooserModal.show()
})

// Listen for the draw card being clicked.
document.getElementById("draw-card").addEventListener("click", async () =>  {
  drawCard();
});

// Listen for chat sidebar being open/closed.
document.getElementById("chat-close-btn").addEventListener("click", function(event) {
  closeChat(event);
});

document.getElementById("chat-open-btn").addEventListener("click", function(event) {
  openChat(event);
});

// ====================================================================
// Communicating with the backend API
// ====================================================================
async function requestGameState() {
  await fetch(`/api/game/state/${roomId}`).then(res => res.json());
}

async function drawCard() {
  await fetch(`/api/game/makeMove/${roomId}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: "-1" }),
    method: "POST"
  }).then(res => res.json());
}

async function playCard(cardId) {
  await fetch(`/api/game/makeMove/${roomId}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: "-2", cardId: cardId }),
    method: "POST"
  }).then(res => res.json());
}

async function chooseColor(color) {
  await fetch(`/api/game/makeMove/${roomId}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: "-3", color: color}),
    method: "POST"
  }).then(res => res.json());
  colorChooserModal.hide()
}

// ====================================================================
// render functions
// ====================================================================

// Renders text and styling for the game over modal.
function renderGameOverModal(state) {
  let gameOverStatus = document.getElementById('game-over-status');
  
  if(state.user.isWinner) {
    gameOverStatus.innerText = "You won!";
    gameOverStatus.classList.add("text-success");
  } else {
    gameOverStatus.innerText = "You lost!";
    gameOverStatus.classList.add('text-danger');
  }

  gameOverModal.show();
}


// Renders all game/user info on the screen such as usernames, curret_player status,
// and direction the game is going in.
function renderGameInfo(state) {
  // Calculate other players location based on this player.
  const leftPlayer = ((state.user.playerNum + 1) % 4) == 0 ? 4 : ((state.user.playerNum + 1) % 4);
  const topPlayer = ((state.user.playerNum + 2) % 4) == 0 ? 4 : ((state.user.playerNum + 2) % 4);
  const rightPlayer = ((state.user.playerNum + 3) % 4) == 0 ? 4 : ((state.user.playerNum + 3) % 4);
  let user;

  // Render user info
  document.querySelectorAll(".username-container").forEach((element) => {
    switch(element.firstElementChild.id) {
      case "left-player-username": {
        user = state.otherPlayers[leftPlayer];
        break;
      }
      case "top-player-username": {
        user = state.otherPlayers[topPlayer];
        break;
      }
      case "right-player-username": {
        user = state.otherPlayers[rightPlayer];
        break;
      }
      case "username": {
        user = state.user;
        break;
      }
    }

    const username =  gameData.members[user.userId] ? gameData.members[user.userId].username : "Offline";
    element.firstElementChild.innerText = username;
    
    if(user.isCurrentPlayer) {
      element.firstElementChild.classList.add("username-current-player");
      element.firstElementChild.classList.add("text-success");
    } else {
      element.firstElementChild.classList.remove("username-current-player");
      element.firstElementChild.classList.remove("text-success");
    }
  });

  // Render game direction
  document.querySelector('#game-direction').innerHTML = `
    <span>
      <strong> ${state.isClockwise ? `<i class="fa fa-2x fa-chevron-circle-left"></i>` : `<i class="fa fa-2x fa-chevron-circle-right"></i>`}</strong>
    </span>
  `
}

// Renders all cards on the screen based on the game state.
function renderCards(state) {
    // Calculate other players location based on this player.
    let leftPlayer = ((state.user.playerNum + 1) % 4) == 0 ? 4 : ((state.user.playerNum + 1) % 4);
    let topPlayer = ((state.user.playerNum + 2) % 4) == 0 ? 4 : ((state.user.playerNum + 2) % 4);
    let rightPlayer = ((state.user.playerNum + 3) % 4) == 0 ? 4 : ((state.user.playerNum + 3) % 4);

    // Clear all previous cards HTML from the page.
    document.querySelector("#left-player").innerHTML = null;
    document.querySelector("#top-player").innerHTML = null;
    document.querySelector("#right-player").innerHTML = null;
    document.querySelector("#last-played-card").innerHTML = null;
    document.querySelector("#user-player").innerHTML = null;

    // Render the last played card.
    document
      .querySelector("#last-played-card")
      .insertAdjacentHTML(
        'beforeend', 
        getFaceUpCardHTML(
          state.lastPlayedCard.id, 
          state.lastPlayedCard.color, 
          state.lastPlayedCard.value, 
          false
        )); 

    // Render other players' face down cards.
    for( let i=0; i<state.otherPlayers[leftPlayer].handLength; i++) {
      document
        .querySelector("#left-player")
        .insertAdjacentHTML('beforeend', getFaceDownCardHTML());
    }
    for( let i=0; i<state.otherPlayers[topPlayer].handLength; i++) {
      document
        .querySelector("#top-player")
        .insertAdjacentHTML('beforeend', getFaceDownCardHTML());
    }
    for( let i=0; i<state.otherPlayers[rightPlayer].handLength; i++) {
      document
        .querySelector("#right-player")
        .insertAdjacentHTML('beforeend', getFaceDownCardHTML());
    }
        
    // Render this user's face up cards.
    state.user.cards.forEach(card => {
      document
        .querySelector("#user-player")
        .insertAdjacentHTML('beforeend', getFaceUpCardHTML(card.id, card.color, card.value));
    });
}

// Helper function that returns the HTML for a face up card.
function getFaceUpCardHTML(cardId, color, value, isPlayable=true) {
  if(isPlayable) {
    return `
      <div class="my-card" onclick="playCard('${cardId}')">
        <svg class="face-up uno-card uno-card-${color}-${value}"></svg>
      </div>
    `;
  }
  return `
    <div class="my-card">
      <svg class="face-up uno-card uno-card-${color}-${value}"></svg>
    </div>
  `;
}

// Helper function that returns that HTML for a face down card.
function getFaceDownCardHTML() {
  return `
    <div class="my-card">
      <img src="../images/unocards.png".face-down height = '100'>
    </div>
  `;
}

function openChat(event) {
  event.preventDefault()
  chatSidebar = document.getElementsByClassName("chat-sidebar")[0];
  chatClosed = document.getElementById("chat-sidebar-closed");

  chatSidebar.classList.remove("hidden");
  chatClosed.classList.add("hidden");
}


function closeChat(event) {
  event.preventDefault();
  chatSidebar = document.getElementsByClassName("chat-sidebar")[0];
  chatClosed = document.getElementById("chat-sidebar-closed");

  chatSidebar.classList.add("hidden")
  chatClosed.classList.remove("hidden")
}