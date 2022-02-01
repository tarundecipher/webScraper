const Sequelize = require("sequelize");
const QuestionModel = require("./Question");

/**postgres related initializations */
const sequelize = new Sequelize("postgres", "postgres", "postgres", {
  dialect: "postgres",
  host: "localhost",
  logging: false,
});

const Question = sequelize.define("Question", QuestionModel);
module.exports = { sequelize, Question };
