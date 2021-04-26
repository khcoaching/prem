const fs = require('fs');
const co = require('co');
const generate = require('node-chartist');
const fetch = require('node-fetch');

const exRates = require('./exchange-rates.json');

const filenames = {
  './premium.json': 'Kimchi Premium %',
  './coinbase.json': 'Coinbase USD',
  './coinone.json': 'Coinone KRW Million',
}

const titleRex = /\.\/([^\.]+)\.json/
const coinbaseUrl = 'https://api.pro.coinbase.com/products/btc-usd/trades';
const coinoneUrl = 'https://api.coinone.co.kr/trades';

// (async function () {
  // fetch data
  // const coinbasePrice = await getCoinbase();
  // const coinonePrice = await getCoinone();
  const krwUsd = exRates.krw;

  // generate graph html
  co(function * () {
    // link chartist css
    const css = '<head><link rel="stylesheet" href="main.css"></head>';
    const graphHtml = [css];

    for (const filename of Object.keys(filenames)) {
      const title = filenames[filename];
      const convert = converter(filename);

      const series = require(filename);
      const options = getOptions(filename);
      const data = {
        labels: ['time'],
        series: [series.map(convert)],
      };

      const graph = yield generate('line', options, data); //=> chart HTML
      graphHtml.push(`<div><h1>${title}</h1>${graph}</div>`);
    }

    const html = graphHtml.join('\n');
    fs.writeFileSync('./index.html', html, 'utf-8');
  });

  // process.exit();
// })();

async function getCoinbase() {
  const res = await fetch(coinbaseUrl);
  const data = await res.json();
  const latestTradeUSD = data[0].price;

  return parseFloat(latestTradeUSD);
}

async function getCoinone() {
  const res = await fetch(coinoneUrl);
  const data = await res.json();
  const latestTradeKRW = data.completeOrders[0].price;

  return parseFloat(latestTradeKRW);
}

function converter(filename) {
  switch(filename) {
    case './coinbase.json':
      return (price) => Math.floor(price);
    case './coinone.json':
      return (price) => (price / 1000000).toFixed(3);
    default:
      return (price) => price;
  }
}

function getOptions(filename) {
  const base = {width: 800, height: 400};
  switch(filename) {
    case './premium.json':
      return { ...base, low: 0 }
    default:
      return base;
  }
}
