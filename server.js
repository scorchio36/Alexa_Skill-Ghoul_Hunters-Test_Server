import ClientState from './ClientState.js';

const http = require('http');
const url = require('url');
const uniqid = require('uniqid');
const WebSocket = require('ws');
let generateRandomRoomID = require('./RoomIDGenerator.js');

/***** I am introducing some terminology here:

Similar Clients: clients within the same room as the current Client

This will make naming my functions easier... *****/



const SERVER_PORT = 8080;

let payload_storage = null;
let activeRoomIDs = [];
let activeClientStates = [];
let websocketConnection = null; //stores the websocket object returned by on 'connection'

// Set up the HTTP server needed for WS
let server = http.createServer(function(req, res) {

}).listen(SERVER_PORT, function() {
  console.log("Server is now listening on port " + SERVER_PORT);
});

// mount the websockets "server" onto the http server
let wsServer = new WebSocket.Server({
  server: server,
  clientTracking: true
});

// Register the request handler with the WS server object
wsServer.on('connection', handleWS_onConnection);


/* ===== WS Handlers ===== */
function handleWS_onConnection(websocket, request) {

  console.log(`(+(${new Date()}) Connection to ${request.socket.remoteAddress} accepted.`);

  // client ID will be generated server-side
  let newClientID = uniqid();

  // it may be better to create a ClientState on connection, let's try that here
  activeClientStates.push(new ClientState(newClientID, null, null, websocket, "player"));

  // register message, error, and close handlers with websocket object
  websocket.on('message', handleWS_onMessage);
  websocket.on('error', handleWS_onError);
  websocket.on('close', handleWS_onClose);

  // let the client know what their new ID will be
  websocket.send(JSON.stringify({
    action: "client_id_and_ws_connection_created",
    clientID: newClientID
  }));
}

function handleWS_onMessage(message) {

  let jsonPayload = JSON.parse(message);
  let currentClientState = getClientState(jsonPayload.clientID);

  console.log(`(${new Date()}) Message received: ${message}`);


  /* Similar to the client's conditional action monitoring, this set of
  conditionals within the handleWS_onMessage function check the incoming action
  from the client, perform operations according the intercepted action, and return
  any necessary results to the client. */
  if(jsonPayload.action == "create_room") {

    // The client is creating a new room, so generate a new room ID
    let newRoomID = generateRandomRoomID();
    while (activeRoomIDs.includes(newRoomID)) { // don't repeat room IDs
      newRoomID = generateRandomRoomID();
    }

    // add the new roomID to the tracking array and update the current ClientState's roomID
    activeRoomIDs.push(newRoomID);
    currentClientState.roomID = newRoomID;

    // let the client know the operation was successful and give them the new RoomID
    currentClientState.websocketConnection.send(JSON.stringify({
      action: "create_room_successful",
      roomID: newRoomID
    }));
  }


  // a new client has requested to join a room
  if(jsonPayload.action == "join_room") {

    /* Since the client is joining a room, make sure that the given roomID is active.
    If it is not active, let the client know. */
    if (!(activeRoomIDs.includes(jsonPayload.roomID))) {
        // send back a response saying that the roomID is invalid
        currentClientState.websocketConnection.send(JSON.stringify({
          action: "join_room_failed"
        }));
    }
    else {

      //If the room is valid, update the RoomID of the current ClientState
      currentClientState.roomID = jsonPayload.roomID;

      /* Let each similar client know that a new player has joined their room. This
      allows each similar client to keep track of each other and allows UI to be
      properly updated on the client side. */
      let similarClientStates = getSimilarClientStates(currentClientState.clientID);
      for (let clientState of similarClientStates) {
        clientState.websocketConnection.send(JSON.stringify({
          action: "new_client_joined_room",
          similarClientID: currentClientState.clientID
        }));


      }

      /* Return a list of similar clients to the current client, so the current
      client may properly update it's UI and know which clients are in the room
      that was just joined */
      currentClientState.websocketConnection.send(JSON.stringify({
        action: "join_room_successful",
        roomID: currentClientState.roomID,
        similarClients: getSimilarClientIDs(currentClientState.clientID)
      }));
    }
  }




  if (jsonPayload.action == "start_game") {

    /* We will need all the similar clients to update their roles and alert them
    that the game has started */
    let similarClientStates = getSimilarClientStates(currentClientState.clientID);
    console.log(similarClientStates.length);
    let currentAndSimilarClientStates = similarClientStates.concat(currentClientState);
    console.log(currentAndSimilarClientStates[currentAndSimilarClientStates.length-1]);
    // randomly assign one of the clients to be a ghoul
    let randomGhoulIndex = Math.floor(Math.random() * (currentAndSimilarClientStates.length + 1)); // add 1 to account for the currenClient
    currentAndSimilarClientStates[randomGhoulIndex].role = "ghoul";

    // let each similar client know their role and alert them of game start
    for (let clientState of similarClientStates) {
      clientState.websocketConnection.send(JSON.stringify({
        action: "game_started",
        role: clientState.role
      }));
    }

    // alert the current client and also tell the client his role
    currentClientState.websocketConnection.send(JSON.stringify({
      action: "game_started",
      role: currentClientState.role
    }));

  }


  // ghoul has hidden the treasure. Let users know that they can now play and move around
  if (jsonPayload.action == "treasure_hidden") {

    let similarClientStates = getSimilarClientStates(currentClientState.clientID);

    // let each similar client know their role and alert them of game start
    for (let clientState of similarClientStates) {
      clientState.websocketConnection.send(JSON.stringify({
        action: "allow_player_movement"
      }));
    }

    // alert the current client and also tell the client his role
    currentClientState.websocketConnection.send(JSON.stringify({
      action: "allow_player_movement"
    }));
  }




  /* If a player moves, update the location in their respective ClientState.
  Also, check if a player and ghoul's location coincide with each other. If they
  do, then let the ghoul know he killed a player, and the player know that they
  died. */
  if (jsonPayload.action == "update_location") {

    currentClientState.location = jsonPayload.location;

    // if the player is the ghoul, compare their location with all players
    let similarClientState = null;
    if (currentClientState.role == "ghoul") {
      for (let similarClientID of jsonPayload.similarClients) {
        similarClientState = getClientState(similarClientID);
        if (similarClientState.location == currentClientState.location) { //let player know they were killed
          similarClientState.websocketConnection.send(JSON.stringify({
            action: "killed_by_ghoul"
          }));
          currentClientState.websocketConnection.send(JSON.stringify({ //let ghoul know he killed someone
            action: "killed_a_player",
            killedClient: similarClientState.clientID
          }));
        }
      }
    }
    // if the player is not a ghoul, compare their location to the ghoul
    else {
      let ghoulClientState = null;
      for(let similarClientID of jsonPayload.similarClients) {
        ghoulClientState = getClientState(similarClientID);
        if (ghoulClientState.role == "ghoul") {
          if (currentClientState.location == ghoulClientState.location) {
            currentClientState.websocketConnection.send(JSON.stringify({
              action: "killed_by_ghoul"
            }));
            ghoulClientState.websocketConnection.send(JSON.stringify({ //let ghoul know he killed someone
              action: "killed_a_player",
              killedClient: similarClientState.clientID
            }));
          }
        }
      }
    }
  }
}

function handleWS_onError(err) {
  console.log(`(${new Date()}) Error: ${err}`);
}

function handleWS_onClose(reasonCode, description, connection) {
  console.log((new Date()) + ': Connection closed.');
}


// Retrieve a ClientState that matches the given clientID
// Clean this up with For...of loops later...
function getClientState(clientID) {
  for (let i=0; i<activeClientStates.length; i++) {
    if (activeClientStates[i].clientID == clientID) {
      return activeClientStates[i];
    }
  }
}


/* Return a list of a ClientStates mactching the given roomID, except for the
ClientState that has the same clientID that was passed in as an input param. */
function getSimilarClientStates(clientID) {

  let similarClientStates = [];
  let currentClientState = getClientState(clientID);

  for (let i=0; i<activeClientStates.length; i++) {

    // we want to include every ClientState with the same roomID except for the one with the given clientID
    if (activeClientStates[i].roomID == currentClientState.roomID && activeClientStates[i].clientID != clientID) {
      similarClientStates.push(activeClientStates[i]);
    }
  }

  return similarClientStates;
}

/* Return a list of a Client IDs corresponding to matching the given roomID. Every
matching client ID is returned except for the client ID that was passed into the
function. */
function getSimilarClientIDs(clientID) {

  let similarClientIDs = [];
  let currentClientState = getClientState(clientID);

  for (let i=0; i<activeClientStates.length; i++) {

    // we want to include every ClientState with the same roomID except for the one with the given clientID
    if (activeClientStates[i].roomID == currentClientState.roomID && activeClientStates[i].clientID != clientID) {
      similarClientIDs.push(activeClientStates[i].clientID);
    }
  }

  return similarClientIDs;
}




/*let pathname = url.parse(req.url).pathname;
  let query = url.parse(req.url, true).query;

  enable_CORS(res);

  if (req.method == 'GET') {

    console.log('Received an HTTP GET request...');

    // "Host a game" button is pressed on the client side
    if(pathname === "/create_room") {



      // Let the client-side know that the operation was successful
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        roomID: newRoomID
      }));

    }

    if (pathname === "/join_room") {

      /* Since the client is joining a room, make sure that the given roomID is active.
         If it is not active, let the client know. */
         /*if (!activeRoomIDs.includes(roomID)) {
           // send back a response saying that the roomID is invalid
         }
         else { //If the room is valid, create a new ClientState to keep track of the new client
           activeClientStates.push(new ClientState(query.clientID, roomID, null));

           // return a list of clientIDs that are also associated with that room
           res.writeHead(200, { 'Content-Type': 'application/json' });
           res.write(JSON.stringify({
             clientsInRoom: clientIDsInRoom()
           }));
         }
    }


  }
  else if(req.method == 'POST') {
    console.log('Received an HTTP POST request...');

    // at some point move this parsing into a helper function
    let body = '';
    req.on('data', function(chunks) {
      body += chunks.toString();
    });

    req.on('end', function() {
      console.log(`Posted Data: ${body}`);
      console.log(`Parsed Json: ${JSON.parse(body)["location"]}`)
    });
  }

  res.end();

});

server.listen(SERVER_PORT, function() {
  console.log(`Server is now listening on port ${SERVER_PORT}`);
});


/* This set of statements allows the client to talk to the test server.
CORS will give you issues otherwise. */
/*function enable_CORS(res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
}

/* Returns an array of clientIDs in a given room. This information will be used
on the client side so that the user can see the other players in the room*/
/*function clientIDsInRoom(roomID) {

  let clientsInRoom = [];
  for (const clientState in activeClientStates) {
    if (clientState['roomID'] == roomID) {
      clientsInRoom.push(clientState['clientID']);
    }
  }

  return clientsInRoom;
}*/
