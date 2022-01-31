const rp = require("request-promise");
const cheerio = require("cheerio");
const scrape = require("./scrape");
const { sequelize } = require("./db/db");
// import { sequelize } from "./db/db";

const url = "https://stackoverflow.com/questions";
const url2 =
  "https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript";

async function scrape_stack() {
  const scp = new scrape();
  await scp.request(url2);
}

sequelize
  .sync()
  .then((res) => {
    scrape_stack();
  })
  .catch((err) => {
    console.log(err);
  });
