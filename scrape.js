const rp = require("request-promise");
const cheerio = require("cheerio");
const { map } = require("bluebird");
const util = require("util");
const { sequelize, Question } = require("./db/db");
const question_format = require("./Question_format/question_format");
const queue = require("./Queue/queue");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

module.exports = class scrape {
  constructor() {
    this.concurrent = 5;
    this.backlog_queue = new queue();
    this.base_url = "https://stackoverflow.com";
    this.question_format = new question_format();
  }

  async request(url) {
    console.log(url);
    rp(url)
      .then((html) => {
        this.concurrent++;
        const upvotes = this.extract_vote_count(html, url);
        this.question_format.upvotes.set(url, upvotes);
        const answers = this.extract_answer_count(html);
        this.question_format.answers.set(url, answers);
        if (isNaN(this.question_format.freq.get(url))) {
          this.question_format.freq.set(url, 1);
          this.extract_links(html);
        } else {
          this.question_format.freq.set(
            url,
            this.question_format.freq.get(url) + 1
          );
        }
        this.update_or_create_new(url, upvotes, answers);
      })
      .catch(function (err) {
        console.log(err);
        console.log("Request to " + url + " failed");
      });
  }

  extract_vote_count(html, url) {
    try {
      const $ = cheerio.load(html);
      const temp_object = $(".question").find(".js-vote-count");
      const vote_count = $(temp_object[0]).attr("data-value");
      if (isNaN(vote_count)) {
        throw "Error";
      }
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
      if (isNaN(answer_count)) {
        throw "Error";
      }
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
    links.forEach((val, index) => {
      if (val.length > ref.length && val.slice(0, ref.length) == ref) {
        const temp_url = this.base_url + val;
        if (this.concurrent > 0 && this.backlog_queue.isempty()) {
          this.concurrent--;
          this.request(temp_url);
        } else if (this.concurrent > 0 && !this.backlog_queue.isempty()) {
          this.concurrent--;
          const queue_url = this.backlog_queue.pop();
          this.request(queue_url);
        } else if (this.concurrent <= 0) {
          this.backlog_queue.push(temp_url);
        }
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
      Question.create({
        url: url,
        upvotes: upvotes,
        answers: answers,
        frequency: 1,
      });
    } else {
      Question.update(
        {
          url: url,
          upvotes: upvotes,
          answers: answers,
          frequency: this.question_format.freq.get(url),
        },
        { where: { url: url } }
      );
    }
  }

  async export_data_tocsv() {
    console.log("Exporting Data to CSV");
    let final_data = [];
    let columns = {
      url: "url",
      upvotes: "upvotes",
      answers: "answers",
      frequency: "frequency",
    };

    this.question_format.freq.forEach((value, key, map) => {
      const upvotes = this.question_format.upvotes.get(key);
      const answers = this.question_format.answers.get(key);
      final_data.push({
        url: key,
        upvotes: upvotes,
        answers: answers,
        freq: value,
      });
    });
    console.log(final_data);
    const csvWriter = createCsvWriter({
      path: "/home/tarundecipher/Documents/CODING PROGRAMS/webCrawler/scraped_data.csv",
      header: [
        { id: "url", title: "URL" },
        { id: "upvotes", title: "Upvotes" },
        { id: "answers", title: "No of Answers" },
        { id: "freq", title: "Frequency" },
      ],
    });
    console.log(final_data);
    await csvWriter.writeRecords(final_data);
    console.log("CSV created");
  }
};
