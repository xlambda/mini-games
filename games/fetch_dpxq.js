var iconv = require("iconv-lite");

async function getList() {
    return fetch("http://www.dpxq.com/hldcg/share/xiangqigupu/zhuxiangzhai/")
        .then(response => response.arrayBuffer())
        .then(data => iconv.decode(Buffer.from(data), 'gb2312'))
        .then(data => {
            const i = data.indexOf('<P>');
            let end = data.indexOf('</div>', i);
            s = data.substring(i + 3, end);
            const result = [];
            while (true) {
                const lstart = data.indexOf('<td ', end);
                if (lstart < 0) {
                    break;
                }
                else {
                    const s = data.indexOf('<a ', lstart);
                    const e = data.indexOf('</a>', s);
                    const urlRe = /href="([^"]+)".+>(.+)</.exec(data.substring(s, e + 2));
                    result.push([urlRe[1], urlRe[2]])
                    end = e;
                }
            }
            return result;
        });
}
function getOnePage(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => iconv.decode(Buffer.from(data), 'gb2312'))
        .then(data => {
            const r = /tmlXQ_movelist = ['"](.+)['"]/.exec(data);
            const i = /\[DhtmlXQ_binit\](.+)\[\/DhtmlXQ_binit\]/.exec(data);
            if (r && i)
            return [r[1], i[1]];
        });
}
const host = "http://www.dpxq.com"
getList().then(async (s) => {
    const contents = [];
    for (let [url, name] of s) {
        if (contents.length >= 24) {
            break;
        }
        await getOnePage(`${host}${url}`).then(s => contents.push([name, s]));
    }
    console.log('content', contents);
});
// getOnePage(`${host}/hldcg/search/view_u_40506.html`).then(s => console.log(s));
