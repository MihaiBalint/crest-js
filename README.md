# crest-js

Crest JS is a small and friendly Client for REST APIs. Unlike most HTTP clients out there, Crest does not accept URLs as strings. URLs are instead constructed with Javascript Proxies and an opinionated convention for method names. This makes your code more readable as you no longer have to understand the complex string shuffling commonly associated with building URLs.

Inspired by [this medium article](https://medium.com/dailyjs/how-to-use-javascript-proxies-for-fun-and-profit-365579d4a9f8)

Check out the awesome examples below:

```js
const crest = require('crest-js');

const github = crest({ baseUrl: 'https://api.github.com' });

const orgs = await github.getUsersOrgs('MihaiBalint');

const auth = await github.postAuthorizations({ json: { 'scopes': ['public_repo'] } });
```

## Installation

node:

```
$ npm install crest-js
```

## Running node tests

Install dependencies:

```shell
$ npm install
$ make test
```

## License

MIT
