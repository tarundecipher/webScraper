const Sequelize = require("sequelize");
const QuestionModel = require("./Question");

const sequelize = new Sequelize("postgres", "postgres", "postgres", {
  dialect: "postgres",
  host: "localhost",
  logging: false,
});
console.log(QuestionModel);
const Question = sequelize.define("Question", QuestionModel);
module.exports = { sequelize, Question };
