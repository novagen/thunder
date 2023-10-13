# Thunder

[![codecov](https://codecov.io/gh/novagen/smhi-thunder/branch/main/graph/badge.svg?token=R3O89HGZ9A)](https://codecov.io/gh/novagen/smhi-thunder)
[![DeepSource](https://app.deepsource.com/gh/novagen/smhi-thunder.svg/?label=active+issues&show_trend=false&token=YBKIW0IJEWcZRWmIKoAqrR4d)](https://app.deepsource.com/gh/novagen/smhi-thunder/)

A client for the [SMHI Open Data API](https://opendata.smhi.se/apidocs/pls/index.html) for lightning strikes

## Installation

```bash
npm install @novagen/smhi-thunder
```

## Usage

```js
import { Client, Events } from '@novagen/smhi-thunder';

const client = new Client('my-username', 'my-password');
client.on(Events.STRIKE, (s) => { console.log(s); });

client.start();
```
