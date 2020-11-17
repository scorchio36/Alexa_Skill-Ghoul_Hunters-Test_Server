/*The GameState object will keep track of what clients are associated with which
rooms. This will make searching for a certain ClientState much more efficient, as
you won't have to search through all ClientStates on the server in order to find
a certain ClientState. */

class GameState {

  constructor() {

    this.clients = []; // stores the clientIDs for clients in this game
    this.clientStates = new Map(); // stores the relevant ClientStates in this game
    this.remainingPlayers = 0; //

  }

  addClient(clientID) {
    this.clients = this.clients.concat(clientID);
  }

  addClientState(clientState) {

    this.clientStates.set(clientState.clientID, clientState);

  }

  removeClientState(clientID) {

    let removalIndex = this.clients.indexOf(clientID);
    if (removalIndex != -1) {
      this.clients.splice(removalIndex, 1);
    }
    this.clientStates.delete(clientID);
  }

  getClientState(clientID) {

    return this.clientStates.get(clientID);

  }

  removeClientState(clientID) {

    this.clientStates.delete(clientID);

  }

  getSimilarClientStates(clientID) {
    let similarClientStates = [];
    for(let clientState of this.clientStates.values()) {

      if(clientState.clientID != clientID) {
        similarClientStates = similarClientStates.concat(clientState);
      }
    }

    return similarClientStates;
  }

  // return the client that is the ghoul
  getGhoulClientState() {

    for(let clientState of this.clientStates.values()) {

      if(clientState.role == "ghoul") {
        return clientState;
      }
    }

    return null;
  }

  assignRandomClientAsGhoul() {

    let randomGhoulIndex = Math.floor(Math.random() * (this.clients.length));
    this.clientStates.get(this.clients[randomGhoulIndex]).role = "ghoul";

  }
}

export default GameState;
