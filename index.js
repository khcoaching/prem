const fs = require('fs');
const co = require('co');
const generate = require('node-chartist');
const fetch = require('node-fetch');

const basePath = process.env.BASE_PATH || './';
function getPath(filename) {
  const lastChar = basePath.charAt(basePath.length - 1);
  const path = lastChar === '/' ? basePath : `${basePath}/`;

  return `${path}${filename}`;
}

const exRates = require(getPath('exchange-rates.json'));

const graphs = {
  premium: {
    path: getPath('premium.json');,
    title: 'Kimchi Premium %',
  },
  coinbase: {
    path: getPath('coinbase.json'),
    title: 'Coinbase USD',
    tradeUrl: 'https://api.pro.coinbase.com/products/btc-usd/trades',
  },
  coinone: {
    path: getPath('coinone.json'),
    title: 'Coinone KRW Million',
    tradeUrl: 'https://api.coinone.co.kr/trades',
  },
};

const notifyPath = getPath('notify.json');
const notifyLow= parseFloat(process.env.NOTIFY_LOW) || 2;
const notifyHigh = parseFloat(process.env.NOTIFY_HIGH) || 10;
const lastNotification = new Date(require(notifyPath));

const fetches = [getCoinbase(), getCoinone()];
Promise.all(fetches).then(([coinbasePrice, coinonePrice]) => {
  const krwUsd = parseFloat(exRates.krw);
  const current = {
    coinbase: coinbasePrice,
    coinone: coinonePrice * krwUsd,
    premium: ((coinonePrice * krwUsd) - coinbasePrice) / coinbasePrice * 100,
  };

  // notify if premium falls within range, but only once an hour
  const notifyDelta = Date.now() - lastNotification.getTime();
  const oneHourMs = 60 * 60 * 1000;
  if ((current.premium < notifyLow || current.premium > notifyHigh) && notifyDelta > oneHourMs) {
    // discord notify
    notify(current.premium).then((res) => {
      if (res.status < 400) {
        console.log('Sent notification to Discord');
        fs.writeFileSync(notifyPath, JSON.stringify(new Date()), 'utf-8');
      } else {
        console.error('Could not send notification to Discord');
      }
    });
  }

  // generate graph html
  co(function * () {
    // link chartist css
    const css = '<head><link rel="stylesheet" href="main.css"></head>';
    const graphHtml = [css];

    // iterate over configured graphs
    for (const [name, config] of Object.entries(graphs)) {
      const { path, title } = config;
      console.log(`Generating graph: ${title} - ${path}`);

      // get data from disk
      const savedData = require(path);
      console.log(`Loaded data for ${name}: ${savedData.length}`);

      // savedData + new data, trim number for graph legend
      const trim = trimFn(name);
      const series = savedData.concat([current[name]]).map(trim);

      // get 1 day of data
      let daySeries = [...series];
      if (daySeries.length > 288) {
        const index = daySeries.length - 288;
        daySeries = daySeries.slice(index);
      }

      // configure graph
      const options = getOptions(name);
      const data = {
        labels: ['time'],
        series: [daySeries],
      };

      // generate graph
      const graph = yield generate('line', options, data);
      graphHtml.push(`<div><h1>${title}</h1>${graph}</div>`);
      console.log(`Generated graph: ${title}`);


      // persist data to disk
      const out = JSON.stringify(series);
      fs.writeFileSync(path, out, 'utf-8');
      console.log(`updated ${path}`);
    }

    // generate index.html and write to disk
    const html = graphHtml.join('\n');
    fs.writeFileSync('./index.html', html, 'utf-8');
    console.log('wrote index.html');
  });
});

async function getCoinbase() {
  const res = await fetch(graphs.coinbase.tradeUrl);
  const data = await res.json();
  const latestTradeUSD = data[0].price;

  return parseFloat(latestTradeUSD);
}

async function getCoinone() {
  const res = await fetch(graphs.coinone.tradeUrl);
  const data = await res.json();
  const latestTradeKRW = data.completeOrders[0].price;

  return parseFloat(latestTradeKRW);
}

function trimFn(filename) {
  switch(filename) {
    case 'coinbase':
      return (price) => Math.floor(price);
    case 'coinone':
      return (price) => Math.floor(price);
    default:
      return (price) => parseFloat(price).toFixed(2);
  }
}

function getOptions(filename) {
  const base = {width: 800, height: 400};
  switch(filename) {
    case 'premium':
      return { ...base, low: 0 }
    default:
      return base;
  }
}

async function notify(premium) {
  const url = 'https://discord.com/api/webhooks';
  const server =process.env.DISCORD_SERVER;
  const hook = process.env.DISCORD_HOOK;

  const content = `Kimchi Premium @ ${premium.toFixed(2)} % - https://khcoaching.github.io/prem/`;

  const options = {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: {
      'Content-Type': 'application/json',
    }
  }

  const webhook = `${url}/${server}/${hook}`;
  console.log(webhook);
  return fetch(webhook, options);
}
