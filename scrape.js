const fs = require('fs');
const { totalmem } = require('os');
const Parser = require('rss-parser');
const parser = new Parser();

const primary_url = "https://www.upwork.com/ab/feed/jobs/rss?sort=recency&or_terms=%22artificial+intelligence%22%2C+%22deep+learning%22%2C+%22machine+learning%22&job_type=hourly%2Cfixed&budget=500-999%2C1000-4999%2C5000-&verified_payment_only=1&hourly_rate=40-&paging=0%3B50&api_params=1&q=%28%22artificial+intelligence%22+OR+%22deep+learning%22+OR+%22machine+learning%22%29&securityToken=304f9ca446b59a5c976f4e3e1097e3a1346d6daf961ac94ae08fc611810866da96f5be6e633a17a996a4a3db48a1a0c6d3eb8397e3b3351b83e8506fd8099f63&userUid=1682473442114174976&orgUid=1682473442114174977";

const splitNewLine = (str, idx) => idx == -1 ? '' : str.slice(idx, -1).split('\n')[0].split(':')[1].trimStart();

const getTitles = async () => {
    const results = [];
    const total_num = 2800
    const n_inPage = 50
    for (let i = 0; i < total_num / n_inPage; i++) {
        let url = primary_url.replace('paging=0', 'paging=' + (i * n_inPage))
        const feed = await parser.parseURL(url);
        // console.log(feed.title);
        // console.log(feed.description);
        console.log("iteration: ", i);
        feed.items.forEach(item => {
            const snippet = item.contentSnippet;
            const budgetIdx = snippet.indexOf('Budget:');
            const hourlyIdx = snippet.indexOf('Hourly Range:');
            const postIdx = snippet.indexOf('Posted On:');
            const subSnippet = snippet.slice(postIdx, -1);
            const categoryIdx = subSnippet.indexOf('Category:');
            const skillsIdx = subSnippet.indexOf('Skills:');
            const countryIdx = subSnippet.indexOf('Country:');
            // const idx = Math.min(...([budgetIdx, hourlyIdx, postIdx].filter((v) => v > 0)));
            const idx = item.content.indexOf('<b>');
            let budget = splitNewLine(snippet, budgetIdx);
            if (!(/^[$0-9.,]+$/).test(budget)) {
                budget = budget.slice(budget.indexOf('$'), -1).split(' ')[0];
            }
            results.push({
                title: item.title,
                jobURL: item.link.split('?')[0],
                link: '%' + item.link.split('%')[1].split('?')[0],
                content: item.content.slice(0, idx),
                budget,
                hourly: splitNewLine(snippet, hourlyIdx),
                postOn: (new Date(item.pubDate)).getTime(),
                category: splitNewLine(subSnippet, categoryIdx),
                skills: splitNewLine(subSnippet, skillsIdx).split(',').map((skill) => skill.trimStart().trimEnd()),
                country: splitNewLine(subSnippet, countryIdx),
                unread: true,
            });
        });
    }
    return JSON.stringify(results);
};

(async () => {
    const data = await getTitles();
    fs.writeFile('output.json', data, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
})();