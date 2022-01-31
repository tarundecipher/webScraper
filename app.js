const rp = require("request-promise");
const cheerio = require("cheerio");
const scrape = require("./scrape");
const url = "https://stackoverflow.com/questions";

async function func() {
  const scp = new scrape();
  await scp.request(url);
}
func();
