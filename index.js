const fs = require("fs");
const moment = require("moment");
const cheerio = require("cheerio");
const axios = require('axios').default;

const path = "https://libwebtest3.lsu.edu/sites/default/files/featured_images";

const xml = fs.readFileSync("./file.xml");

const $ = cheerio.load(xml, {
    decodeEntities: true,
    xml: true,
});

$("wp\\:author").remove();
$("wp\\:category").remove();
$("wp\\:tag").remove();
$("wp\\:term").remove();

console.log("-------------------------------------------------------")
console.log("--------------------Modifying URLs---------------------")
console.log("-------------------------------------------------------")

const promises = []

$("item").each((_, element) => {
    const postType = $(element).find("wp\\:post_type").text()
    const year = moment($(element).find("pubDate").text()).get("year");

    if (year < 2021) {
        $(element).remove()
        return;
    }

    if (postType === 'post') {

        const title = $(element).find("title")
        const parsedTitle = cheerio.load(title.text()).text()

        title.html("<![CDATA[" + parsedTitle + "]]>")

        const content = $(element).find("content\\:encoded")

        let body = content.text();

        const regexImgWithCaption = /(\[caption)(.*?)(\[\/caption])/gs;

        body = body.replace(regexImgWithCaption, (match) => {
            const regexImgTag = /(?<=])(.*?)(?<=>)/gs;
            const regexCaption = /(?<=> )(.*?)(?=\[)/gs;

            const imgTag = match.match(regexImgTag)[0];
            const caption = match.match(regexCaption);

            const modified = imgTag.slice(0, -2) + `data-caption="${caption}" data-title="${caption}"` + imgTag.slice(-2);

            return modified;
        });

        const regexEmbed = /(\[embed)(.*?)(\[\/embed])/gs;

        let promise = replaceAsync(body, regexEmbed, async (match) => {
            const regexURL = /(?<=\])(.*?)(?=\[)/gs;
            const url = match.match(regexURL)[0];
            const modifiedURL = "https://" + cheerio.load(url).text().split("/").slice(-2).join("/")

            const response = await axios.get(`https://www.youtube.com/oembed?url=${modifiedURL}&format=json`);

            const modified = response.data.html;

            return modified
        })

        promises.push(promise)

        promise.then((modifiedStr) => {

            const html = cheerio.load(modifiedStr, { decodeEntities: false }, false);

            html("img").each((_, img) => {
                const src = html(img).attr("src");

                const newSrc = changeURL(src)

                html(img).attr("src", newSrc);
            });

            $(element).find("content\\:encoded").html("<![CDATA[" + html.html({ xml: true }) + "]]>");
        })

    }

    if (postType === 'attachment') {

        const attachmentURL = $(element).find("wp\\:attachment_url")

        const src = attachmentURL.text()
        const newSrc = changeURL(src, true)

        attachmentURL.text(newSrc)

    }

})


Promise.all(promises).then(() => {
    console.log("-------------------------------------------------------")
    console.log("-------------------Writing XML file--------------------")
    console.log("-------------------------------------------------------")
    fs.writeFileSync("./modified.xml", $.html({ xml: true }));
})

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

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}
