/**
 * Custom Queue Data Structure as JS does not contain one inherently.
 */
module.exports = class queue {
  constructor() {
    this.array = [];
  }
  push(val) {
    this.array.push(val);
  }
  pop() {
    if (!(this.array.length == 0)) {
      return this.array.shift();
    }
  }
  front() {
    if (!(this.array.length == 0)) {
      return this.array[0];
    }
  }
  isempty() {
    return this.array.length == 0;
  }
};
