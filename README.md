# Thunder

A client for the [SMHI Open Data API](https://opendata.smhi.se/apidocs/pls/index.html) for lightning strikes


## Installation

```bash
npm install @novagen/thunder
```


## Usage

```js
import { ThunderClient } from '@novagen/thunder';

const thunder = new ThunderClient('my-username', 'my-password');
thunder.on(ThunderClient.STRIKE, (s) => { console.log(s); });

thunder.start();
```