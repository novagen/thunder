# Thunder

A client for the [SMHI Open Data API](https://opendata.smhi.se/apidocs/pls/index.html) for lightning strikes

## Installation

```bash
npm install @novagen/thunder
```

## Usage

```js
import * as Thunder from '@novagen/thunder';

const client = new Thunder.Client('my-username', 'my-password');
client.on(Thunder.Events.STRIKE, (s) => { console.log(s); });

client.start();
```
