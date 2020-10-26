class ClientState {

  constructor(clientID, roomID, currentLocation, websocketConnection, role) {

    this.clientID = clientID;
    this.roomID = roomID;
    this.currentLocation = currentLocation;
    this.websocketConnection = websocketConnection;
    this.role = role;

  }
}

export default ClientState;
