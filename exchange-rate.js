const fs = require('fs');
const fetch = require('node-fetch');

const path = process.env.EXCHANGE_RATES_PATH || './exchange-rates.json';
let keys = process.env.FIXER_API_KEYS;

if (keys == null || keys.length === 0) {
  process.exit();
}

keys = keys.split(',');
const key = keys[random(0, keys.length - 1)];

(async function () {
  const url = 'http://data.fixer.io/api/latest';
  const query = `?symbols=USD,KRW&access_key=${key}`;

  console.log('Fetching exchange rate data');
  const data = await fetch(`${url}${query}`);
  const { rates } = await data.json();

  const krwUsd = rates.USD / rates.KRW;
  const usdKrw = rates.KRW / rates.USD;

  const out = {
    krw: krwUsd,
    KRW: krwUsd,
    usd: usdKrw,
    USD: usdKrw,
  };
  console.log(out);

  fs.writeFileSync(path, JSON.stringify(out), 'utf-8');
  console.log(`Wrote exchange rates to file ${path}`);
})();

function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
