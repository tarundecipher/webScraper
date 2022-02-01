const rp = require("request-promise");
const cheerio = require("cheerio");
const { map } = require("bluebird");
const util = require("util");
const { sequelize, Question } = require("./db/db");
const question_format = require("./Question_format/question_format");
const queue = require("./Queue/queue");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

module.exports = class scrape {
  /**
   * concurrent forces only 5 concurrent requests at a time.
   * It is set to 4 because it gets incremented to 5 on first call to request method.
   * backlog_queue pushes urls into it when concurrent<=0 so that we dont miss any
   * request in order.
   * question_format contains 3 Hashmaps, one for each frequency of occurence of url,
   * no. of upvotes, no. of  answers.
   */
  constructor() {
    this.concurrent = 4;
    this.backlog_queue = new queue();
    this.base_url = "https://stackoverflow.com";
    this.question_format = new question_format();
  }

  /**
   *
   * @param {String} url
   * request is the function that makes request to the provided url
   * It also extracts votecount, answercount, links and sets them
   * in the database. It is recursively called by extract_links
   * method. It uses question_format.freq as its visited Hashmap
   * as well as using it to keep track of frequency of every url
   */

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

  /**
   *
   * @param {*} html
   * @param {String} url
   * @returns {Integer}
   * This method extracts the upvotes from the html and returns.
   * if it does not find it, it returns 0.
   *
   */

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

  /**
   *
   * @param {*} html
   * @returns {Integer}
   * This method extracts the answers from the html and returns.
   * if it does not find it, it returns 0.
   */

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

  /**
   *
   * @param {*} html
   * This method extracts the links only with prefix '/questions' as they
   * belong specifically to stackoverflow.
   * While iterating through them it decides whether to make request from
   * the one extracted at the moment or to make request from one in the
   * backlog queue or push the current links into backlog queue
   * when concurrent<=0.
   */
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

  /**
   *
   * @param {String} url
   * @param {Integer} upvotes
   * @param {Integer} answers
   * If the entry corresponding to url is already in the database
   * It updates it with new frequency. If it is not present then
   * It is creates a new entry.
   */
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

  /**
   * This method is attached to an event "SIGINT".
   * It exports whatever data it has scraped before after
   * user terminates the script.
   */
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
    const base_path = path.join(__dirname, "/scraped_data.csv");
    console.log(base_path);
    const csvWriter = createCsvWriter({
      path: base_path,
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
