import fetch from "node-fetch";
import HTMLParser from "node-html-parser";

fetch("https://manhwahentai.me/webtoon/is-there-an-empty-room/", { method: "GET" })
  .then((data) => data.text())
  .then((data) => {
    const document = HTMLParser(data);
    const chapters = document.querySelectorAll(".wp-manga-chapter");
    console.log(chapters.map((chapt) => chapt.innerHTML));
  });
