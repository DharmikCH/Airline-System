const crypto = require('crypto');

// O, I, 0 and 1 are deliberately left out. A passenger reading a PNR off a
// printed ticket cannot then confuse O with 0 or I with 1 when typing it in.
// That leaves 32 symbols, so a 6 character PNR has 32^6 combinations, about
// 1.07 billion.
const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PNR_LENGTH = 6;

// Returns a candidate PNR. It is only a candidate: this function does not and
// cannot promise the code is unused. The unique index on Booking.pnr is what
// actually guarantees uniqueness - the controller inserts, and if MongoDB
// rejects the write with duplicate key error 11000 it asks for another code.
//
// crypto.randomInt is used rather than Math.random because Math.random is a
// predictable generator: given enough previous outputs, the next one can be
// worked out. A PNR is what identifies a booking, so it should not be
// guessable. A sequential counter would be worse still - it would be trivially
// guessable and would also leak how many bookings the airline has taken.
function generatePNR() {
  let pnr = '';
  for (let i = 0; i < PNR_LENGTH; i++) {
    pnr += PNR_ALPHABET[crypto.randomInt(0, PNR_ALPHABET.length)];
  }
  return pnr;
}

module.exports = { generatePNR, PNR_ALPHABET, PNR_LENGTH };
