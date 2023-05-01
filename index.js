const xml2js = require("xml2js");
const builder = new xml2js.Builder();
const parseString = xml2js.parseString;
const fs = require("fs");
const moment = require("moment");
const cheerio = require("cheerio");

const path = "";

const xml = fs.readFileSync("./file.xml");

const $ = cheerio.load(xml, {
  xml: { xmlMode: true, normalizeWhitespace: true },
});

$("wp\\:author").remove();
$("wp\\:category").remove();
$("wp\\:tag").remove();
$("wp\\:term").remove();

$("content\\:encoded").text();

// console.log($("wp\\:author").text());

//fs.writeFileSync("./modified.xml", $.xml());

// parseString(xml, function (err, result) {
//   const modified = result;

//   delete modified.rss.channel[0]["wp:author"];
//   delete modified.rss.channel[0]["wp:category"];
//   delete modified.rss.channel[0]["wp:tag"];
//   delete modified.rss.channel[0]["wp:term"];

//   const items = [];

//   modified.rss.channel[0].item.forEach((post) => {
//     const publishedDate = moment(post.pubDate[0]);

//     if (!publishedDate) {
//       return;
//     }

//     const year = publishedDate.get("year");
//     const postType = post["wp:post_type"][0];

//     if (
//       (postType == "attachment" || postType == "post") &&
//       Number(year) >= 2021
//     ) {
//       items.push(post);
//     }
//   });

//   items.forEach((item) => {
//     if (item["wp:post_type"] == "post") {
//       const $ = cheerio.load(item["content:encoded"][0]);

//       $("img").each((i, element) => {
//         const src = $(element).attr("src");

//         const split = src.split("/");
//         const file = split[split.length - 1];

//         const fileSplit = file.split(".");
//         const fileName = fileSplit[0];
//         const fileExtension = fileSplit[1];

//         const newFileName = stripFileName(fileName);

//         $(element).attr("src", path + "/" + newFileName + "." + fileExtension);
//       });

//       item["content:encoded"][0] = String($.html());
//     }
//   });

//   modified.rss.channel[0].item = items;

//   console.log(modified.rss.channel[0].item[0]);

//   //const xml = builder.buildObject(modified);

//   //fs.writeFileSync("./modified.xml", xml);
// });

function stripFileName(fileName) {
  // Remove everything following "scaled"
  let newFileName = fileName.split("-scaled")[0];

  // Remove appended resolution
  const regex = new RegExp("([0-9]{0,4})x([0-9]{0,4})");
  const splitByDash = newFileName.split("-");
  const resolution = splitByDash.at(-1);
  if (regex.test(resolution)) {
    splitByDash.pop();
    newFileName = splitByDash.join("-");
  }

  return newFileName;
}
