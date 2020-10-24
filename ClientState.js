class ClientState {

  constructor(clientID, roomID, currentLocation, websocketConnection) {

    this.clientID = clientID;
    this.roomID = roomID;
    this.currentLocation = currentLocation;
    this.websocketConnection = websocketConnection;

  }
}

export default ClientState;
