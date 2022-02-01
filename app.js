const rp = require("request-promise");
const cheerio = require("cheerio");
const scrape = require("./scrape");
const { sequelize } = require("./db/db");

//I experimented with 2 sample urls which are passed in request method from scrape.
const url = "https://stackoverflow.com/questions";
const url2 =
  "https://stackoverflow.com/questions/5062614/how-to-decide-when-to-use-node-js";

//creating a new scrape object
const scp = new scrape();

/**
 * Async call to request method from the scrape object with url
 * as its arguement. Which is actually the starting point for it.
 */
async function scrape_stack() {
  await scp.request(url2);
}

/**
 * Syncing i.e. connecting to the postgres instance and
 * creating the Table if it does not exist.
 */
sequelize
  .sync()
  .then((res) => {
    /**
     *  Async function is called when Table is created otherwise it
     * will lead to errors while making IO calls to the database.
     */

    scrape_stack();
  })
  .catch((err) => {
    console.log(err);
  });

/**
 * Attaching a method to Ctrl+C event
 * i.e. User terminating the script.
 */
process.on("SIGINT", async function () {
  await scp.export_data_tocsv();
  process.exit();
});
