# crest-js

Crest JS is a small and friendly Client for REST APIs. Unlike most HTTP clients out there, Crest does not accept URLs as strings. URLs are instead constructed with Javascript Proxies and an opinionated convention for method names. This makes your code more readable as you no longer have to understand the complex string shuffling commonly associated with building URLs.

Inspired by [this medium article](https://medium.com/dailyjs/how-to-use-javascript-proxies-for-fun-and-profit-365579d4a9f8)

Check out the awesome examples below:

```js
const crest = require('crest-js');

// Let's play with a contrived API for a database of companies and their staff
const api = crest({ baseUrl: 'https://api.example.com' })
  .authorizationBasic('your-secret-here');

// GET /companies/11335577/branches
api
  .getCompaniesBranches('11335577')
  .then((branches) => {
    console.log(', '.join(branches.map((branch) => branch.location)));
  });

// PUT /companies/11335577/branches/2468
api
  .putCompaniesBranches('11335577', '2468', {json: {location: '186 1st Avenue, NY'} })

// GET /companies/11335577/staff?branch_id=2468
api
  .getCompaniesStaff('11335577', {branch_id: '2468'})
  .then((staff) => {
    const the_message = 'Remember to announce your time off before EOB today.';
    return Promise.all(staff.map((member) => {
      // POST /companies/11335577/staff/{id}/messages
      // json payload: {"message": "Remember to announce..."}
      return api.postCompaniesStaffMessages('11335577', member.id, {json: {message: the_message}})
    }));
  });

// Or let's do some github using async/await
const github = crest({ baseUrl: 'https://api.github.com' })
  .authorizationBasic('your-secret-here');

// GET /users/MihaiBalint/orgs
const orgs = await github.getUsersOrgs('MihaiBalint');
// GET /users/MihaiBalint/repos
const repos = await github.getUsersRepos('MihaiBalint');
// POST /authorizations
const auth = await github.postAuthorizations({ json: { 'scopes': ['public_repo'] } });
```

So what actually happened there and how does it work with any API?
```js


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
$ npm test
```

## License

MIT
