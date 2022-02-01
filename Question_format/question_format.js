/**
 * This is an object contructor which creates 3
 * Hashmaps to store, Frequency, upvotes and answers
 * for a particular url
 */
function question_format() {
  this.freq = new Map();
  this.upvotes = new Map();
  this.answers = new Map();
}
module.exports = question_format;
