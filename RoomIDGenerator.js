/* Function used to generate random Room IDs*/

// List of characters that can potentially show up in the Room ID
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROOM_ID_LEN = 6;

function generateRandomRoomID() {

  let roomID = "";

  for(let i = 0; i< ROOM_ID_LEN; i++) {
    roomID += CHARS[Math.round(Math.random() * CHARS.length)];
  }

  return roomID;

}

module.exports = generateRandomRoomID;
