const rp = require("request-promise");
const cheerio = require("cheerio");
const scrape = require("./scrape");
const { sequelize } = require("./db/db");
// import { sequelize } from "./db/db";

const url = "https://stackoverflow.com/questions";
const url2 =
  "https://stackoverflow.com/questions/5062614/how-to-decide-when-to-use-node-js";

const scp = new scrape();

async function scrape_stack() {
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

process.on("SIGINT", async function () {
  await scp.export_data_tocsv();
  process.exit();
});
