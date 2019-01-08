# crest-js

Crest JS is a small and friendly Client for REST APIs. Unlike most HTTP clients out there, Crest does not accept URLs as strings. URLs are instead constructed with Javascript Proxies and an opinionated convention for method names. This makes your code more readable as you no longer have to understand the complex string shuffling commonly associated with building URLs.

Inspired by [this medium article](https://medium.com/dailyjs/how-to-use-javascript-proxies-for-fun-and-profit-365579d4a9f8)

## Check out the awesome examples below

```js
const crest = require('crest-js');

// Let's play with a contrived API for a database of companies and their staff
const api = crest({ baseUrl: 'https://api.example.com' })
  .authorizationBasic('your-secret-here');
```

Let's try a simple HTTP request
```js
api
  .getCompaniesBranches('11335577')
  // translates to: GET /companies/11335577/branches

  .then((branches) => {
    console.log(', '.join(branches.map((branch) => branch.location)));
  });
```

Now let's update the location for a company branch
```js
api
  .putCompaniesBranches('11335577', '2468', {json: {location: '186 1st Avenue, NY'} })
  // translates to: PUT /companies/11335577/branches/2468
  // payload:       { "location": "186 1st Avenue, NY" }
```

And finally let's send a reminder to all staff accounts from a company branch. 
```js
const the_message = 'Remember to announce your time off before EOB today.';
api
  .getCompaniesStaff('11335577', {branch_id: '2468'})
  // translates to: GET /companies/11335577/staff?branch_id=2468
  
  .then((staff) => {
    return Promise.all(staff.map((member) => {

      return api.postCompaniesStaffMessages('11335577', member.id, {json: {message: the_message}});
      // translates to: POST /companies/11335577/staff/{id}/messages
      // payload:       { "message": "Remember to announce..." }

    }))
    .then(() => {
      console.log('Message sent.');
    });
  });
```

Alternatively we could do something with the github API using async/await
```js
const github = crest({ baseUrl: 'https://api.github.com' })
  .authorizationBasic('your-secret-here');

const orgs = await github.getUsersOrgs('MihaiBalint');
// translates to: GET /users/MihaiBalint/orgs

const repos = await github.getUsersRepos('MihaiBalint');
// translates to: GET /users/MihaiBalint/repos

// POST /authorizations
const auth = await github.postAuthorizations({ json: { 'scopes': ['public_repo'] } });
// translates to: POST /authorizations
// payload:       { "scopes": ["public_repo"] }

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
