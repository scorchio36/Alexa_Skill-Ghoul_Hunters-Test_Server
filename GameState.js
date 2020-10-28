/*The GameState object will keep track of what clients are associated with which
rooms. This will make searching for a certain ClientState much more efficient, as
you won't have to search through all ClientStates on the server in order to find
a certain ClientState. */

class GameState {

  constructor() {

    this.clientStates = new Map();
    this.remainingPlayers = 0;

  }

  addClientState(clientState) {

    this.clientStates.set(clientState.clientID, clientState);

  }

  getClientState(clientID) {

    return this.clientStates.get(clientID);

  }

  removeClientState(clientID) {

    this.clientStates.delete(clientID);

  }
}

export default GameState;
