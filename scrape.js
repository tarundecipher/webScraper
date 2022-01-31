const rp = require("request-promise");
const cheerio = require("cheerio");
const { map } = require("bluebird");
const util = require("util");
const { sequelize, Question } = require("./db/db");

module.exports = class scrape {
  constructor() {
    this.base_url = "https://stackoverflow.com";
    this.mp = new Map();
  }

  async request(url) {
    console.log(url);
    rp(url)
      .then((html) => {
        const upvotes = this.extract_vote_count(html, url);
        const answers = this.extract_answer_count(html);
        this.update_or_create_new(url, upvotes, answers);
        if (isNaN(this.mp[url])) {
          this.extract_links(html);
        }
      })
      .catch(function (err) {
        console.log("Request to " + url + " failed");
      });
  }

  extract_vote_count(html, url) {
    try {
      const $ = cheerio.load(html);
      const temp_object = $(".question").find(".js-vote-count");
      const vote_count = $(temp_object[0]).attr("data-value");
      return parseInt(vote_count);
    } catch {
      return 0;
    }
  }

  extract_answer_count(html) {
    try {
      const $ = cheerio.load(html);
      const temp_object = $('h2[class="mb0"]');
      const answer_count = $(temp_object).attr("data-answercount");
      return parseInt(answer_count);
    } catch {
      return 0;
    }
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
        // console.log(temp_url);
        if (isNaN(this.mp[temp_url])) {
          this.mp[temp_url] = 1;
        } else {
          this.mp[temp_url]++;
        }
        this.request(temp_url);
        // console.log(this.mp[temp_url]);
      }
    });
  }

  async update_or_create_new(url, upvotes, answers) {
    const record = await Question.findOne({
      where: {
        url: url,
      },
    });
    if (record == null) {
      await Question.create({
        url: url,
        upvotes: upvotes,
        answers: answers,
        frequency: 1,
      });
    } else {
      await Question.update(
        {
          url: url,
          upvotes: upvotes,
          answers: answers,
          frequency: this.mp[url],
        },
        { where: { url: url } }
      );
    }
  }

  export_data_tocsv() {}
};
