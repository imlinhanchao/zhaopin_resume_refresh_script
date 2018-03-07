const request = require('request-promise').defaults({
    jar: true,
    simple: false,
    resolveWithFullResponse: true
});
const { JSDOM } = require('jsdom')

post = async (url, data, cookie = null) => {
    let options = {
        url: url,
        headers: {},
    };

    if (typeof data == 'string') {
        options.form = data;
    } else {
        options.json = true;
        options.body = data;
    }

    if (cookie) {
        options.headers.Cookie = cookie;
    }

    let rsp = await request.post(options);
    if (!rsp || rsp.statusCode >= 400) {
        console.error(`网络错误！${rsp.statusCode}`);
        return null;
    }

    return rsp;
};

get = async (url, cookie) => {
    let options = {
        url: url,
        headers: {},
    };

    if (cookie) {
        options.headers.Cookie = cookie;
    }

    let rsp = await request.get(options);
    if (rsp.statusCode >= 400) {
        throw (App.error.network('访问失败！'));
    }

    return rsp;
};

login = async (account) => {
    let rsp = await post(
        'https://m.zhaopin.com/account/logon',
        `userName=${account.user}&pwd=${account.password}&vKey=&vCode=`
    );
    if (rsp) {
        rsp.body = rsp.body || '{}';
    }
    let data = JSON.parse(rsp.body);
    if (data.cookies) {
        console.info('登录成功');
        return data.cookies;
    }
    console.error('登录失败！');
    console.info(`body: ${rsp.body}`);
    return null;
};

getResumeId = async (cookies) => {
    let rsp = await get('https://m.zhaopin.com/resume/index', cookies);
    let window = new JSDOM(rsp.body).window;
    let document = window.document;
    let resumes = Array.from(document.getElementsByClassName('myZhilianList'))
    return resumes.map(l => l.getElementsByTagName('input')[0].getAttribute('data-resumeid'))
}

refresh_resume = async (id, cookies) => {
    let rsp = await post(
        'https://m.zhaopin.com/resume/refreshresume',
        `resumeId=${id}&language=1`,
        cookies
    );
    if (rsp && JSON.parse(rsp.body).StatusCode) {
        console.info(`刷新简历 id=${id} 成功！`);
        return true;
    }
    console.error('刷新失败！');
    console.info(`body: ${rsp.body}`);
    return false;
};

module.exports = async (account) => {
    let cookies = await login(account);
    if (cookies) {
        let zpAuth = cookies.filter(c => c.Name == 'zp-auth')[0].Value;
        let JSsUserInfo = cookies.filter(c => c.Name == 'JSsUserInfo')[0].Value;
        cookies = `${JSsUserInfo}; zp-auth=${zpAuth}; `;
        let resumeIds = await getResumeId(cookies);
        for (let i in resumeIds) {
            await refresh_resume(resumeIds[i], cookies);
        }
        process.exit(0);
    }
}
