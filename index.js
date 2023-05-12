const fs = require("fs");
const moment = require("moment");
const cheerio = require("cheerio");

const path = "http://lwt3test.lsu.edu/sites/default/files/featured_images";

const xml = fs.readFileSync("./file.xml");

const $ = cheerio.load(xml, {
    xml: { xmlMode: true, normalizeWhitespace: true },
});

$("wp\\:author").remove();
$("wp\\:category").remove();
$("wp\\:tag").remove();
$("wp\\:term").remove();

console.log("-------------------------------------------------------")
console.log("--------------------Modifying URLs---------------------")
console.log("-------------------------------------------------------")

$("item").each((_, element) => {
    const postType = $(element).find("wp\\:post_type").text()
    const year = moment($(element).find("pubDate").text()).get("year");

    if (year < 2021) {
        $(element).remove()
        return;
    }

    if (postType === 'post') {

        const content = $(element).find("content\\:encoded")

        let body = content.text();

        const html = cheerio.load(body, null, false);

        html("img").each((_, img) => {
            const src = html(img).attr("src");

            const newSrc = changeURL(src)

            html(img).attr("src", newSrc);
        });

        $(element).find("content\\:encoded").replaceWith("<content:encoded><![CDATA[" + html.html() + "]]></content:encoded>");
    }

    if (postType === 'attachment') {

        const attachmentURL = $(element).find("wp\\:attachment_url")

        const src = attachmentURL.text()
        const newSrc = changeURL(src, true)

        attachmentURL.text(newSrc)

    }
})

console.log("-------------------------------------------------------")
console.log("-------------------Writing XML file--------------------")
console.log("-------------------------------------------------------")
fs.writeFileSync("./modified.xml", $.xml());

function changeURL(src, keepDomain = false) {

    // Split by "/"
    const split = src.split("/");

    // Get file (name + extension)
    const file = split[split.length - 1];

    const newFileName = stripFileName(file);

    let newSrc;
    if (keepDomain) {
        newSrc = split.slice(0, split.length - 1).join("/") + "/" + newFileName
    } else {
        newSrc = path + "/" + newFileName;
    }

    return newSrc;
}

function stripFileName(file) {

    // Split the name and extension
    const fileSplit = file.split(".");

    // Store name and extension
    const fileName = fileSplit[0];
    const fileExtension = fileSplit[1];

    // Remove everything after "-scaled"
    let newFileName = fileName.split("-scaled")[0];

    // Remove appended resolution
    const regex = new RegExp("([0-9]{0,4})x([0-9]{0,4})");
    const splitByDash = newFileName.split("-");
    const resolution = splitByDash.at(-1);
    if (regex.test(resolution)) {
        splitByDash.pop();
        newFileName = splitByDash.join("-");
    }

    return newFileName + "." + fileExtension;
}
