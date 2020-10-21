import ClientState from './ClientState.js';

const http = require('http');
const url = require('url');
const WebSocket = require('ws');
let generateRandomRoomID = require('./RoomIDGenerator.js');


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

  // register message, error, and close handlers with websocket object
  websocket.on('message', handleWS_onMessage);
  websocket.on('error', handleWS_onError);
  websocket.on('close', handleWS_onClose);

  websocketConnection = websocket;
}

function handleWS_onMessage(message) {
  console.log(`(${new Date()}) Message received: ${message}`);
  websocketConnection.send(`Your message, ${message}, was received. Thank you.`);
}

function handleWS_onError(err) {
  console.log(`(${new Date()}) Error: ${err}`);
}

function handleWS_onClose(reasonCode, description, connection) {
  console.log((new Date()) + ': Connection closed.');
}



/*let pathname = url.parse(req.url).pathname;
  let query = url.parse(req.url, true).query;

  enable_CORS(res);

  if (req.method == 'GET') {

    console.log('Received an HTTP GET request...');

    // "Host a game" button is pressed on the client side
    if(pathname === "/create_room") {

      // The client is creating a new room, so generate a new room ID
      let newRoomID = generateRandomRoomID();
      while (activeRoomIDs.includes(newRoomID)) { // don't repeat room IDs
        newRoomID = generateRandomRoomID();
      }

      // Create a new ClientState object to keep track of the current client
      let newClientState = new ClientState(query.clientID, newRoomID, null);

      // add a new ClientState object and the new roomID to the tracking arrays
      activeRoomIDs.push(newRoomID);
      activeClientStates.push(new ClientState(query.clientID, newRoomID, null));

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
