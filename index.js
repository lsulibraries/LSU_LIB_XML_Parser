var parseString = require('xml2js').parseString;
    fs = require('fs')
    moment = require("moment")

const xml = fs.readFileSync("./file.xml");
parseString(xml, function (err, result) {

    const modified = result

    delete modified.rss.channel[0]["wp:author"];
    delete modified.rss.channel[0]["wp:category"];
    delete modified.rss.channel[0]["wp:tag"];
    delete modified.rss.channel[0]["wp:term"];

    const posts = []

    modified.rss.channel[0].item.forEach(post => {
        const publishedDate = moment(post.pubDate[0]);
        const year = publishedDate.get("year");
        const postType = post['wp:post_type'][0]

        if((postType == 'attachment' || postType == 'post') && Number(year) >= 2021){
            posts.push(post)
        }

    });

    console.log(posts.length)

});

