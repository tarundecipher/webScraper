const rp = require("request-promise");
const cheerio = require("cheerio");
const { map } = require("bluebird");
const util = require("util");

module.exports = class scrape {
  constructor() {
    this.base_url = "https://stackoverflow.com";
    this.mp = new Map();
    this.cnt = 0;
  }

  async request(url) {
    this.cnt++;
    // if (this.cnt >= 5) {
    //   return;
    // }
    rp(url)
      .then((html) => {
        this.extract_links(html);
      })
      .catch(function (err) {
        console.log("hag diya");
      });
  }

  extract_links(html) {
    const $ = cheerio.load(html);
    const links = [];
    const temp_object = $(".question-hyperlink");
    temp_object.each((index, element) => {
      links.push($(element).attr("href"));
    });
    const ref = "/questions";
    links.forEach((val) => {
      if (val.length > ref.length && val.slice(0, ref.length) == ref) {
        const temp_url = this.base_url + val;
        console.log(temp_url);
        if (isNaN(this.mp[temp_url])) {
          this.mp[temp_url] = 1;
          try {
            this.request(temp_url);
          } catch {
            console.log("not able to make the request");
          }
        } else {
          this.mp[temp_url]++;
        }
        console.log(this.mp[temp_url]);
      }
    });
  }
};
