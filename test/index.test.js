/* eslint arrow-body-style: ["off"] */

'use strict';

const { assert } = require('chai');
const mockServer = require('mockttp').getLocal({ debug: false });
const { crest, crestUtils } = require('../src');


describe('Testing crest structure detection', () => {
  it('should detect numbers', () => {
    assert.equal(crestUtils.isNotStructure(12), true);
    assert.equal(crestUtils.isNotStructure(12.0), true);
  });

  it('should detect booleans', () => {
    assert.equal(crestUtils.isNotStructure(true), true);
    assert.equal(crestUtils.isNotStructure(false), true);
  });

  it('should detect strings', () => {
    assert.equal(crestUtils.isNotStructure('abc'), true);
    assert.equal(crestUtils.isNotStructure(''), true);

    const value = 'World';
    assert.equal(crestUtils.isNotStructure(`Hello ${value}`), true);
  });

  it('should detect regex', () => {
    assert.equal(crestUtils.isNotStructure(/abc/g), true);
    assert.equal(crestUtils.isNotStructure(/([a-z])/g), true);
  });

  it('should detect null and undefined', () => {
    assert.equal(crestUtils.isNotStructure(null), true);
    assert.equal(crestUtils.isNotStructure(undefined), true);
  });

  it('should detect structures', () => {
    assert.equal(crestUtils.isNotStructure({}), false);
    assert.equal(crestUtils.isNotStructure({ hello: 'world' }), false);
    assert.equal(crestUtils.isNotStructure({ 111: 'world' }), false);

    const value = 'World';
    assert.equal(crestUtils.isNotStructure({ [value]: 'hello' }), false);
  });

  it('should detect arrays', () => {
    assert.equal(crestUtils.isNotStructure([]), false);
    assert.equal(crestUtils.isNotStructure(['abc', 'def']), false);
    assert.equal(crestUtils.isNotStructure([1, 2, 3]), false);

    const value = 'World';
    assert.equal(crestUtils.isNotStructure([value]), false);
  });
});

describe('Testing crest url path', () => {
  it('should split http methods', function () {
    let [method, url] = crestUtils.splitMethod('getCompanies');
    assert.equal(method, 'get');
    assert.equal(url, 'Companies');

    [method, url] = crestUtils.splitMethod('deleteAccounts');
    assert.equal(method, 'delete');
    assert.equal(url, 'Accounts');
  });

  it('should split http methods, edge case', function () {
    let [method, url] = crestUtils.splitMethod('get');
    assert.equal(method, 'get');
    assert.equal(url, '');

    [method, url] = crestUtils.splitMethod('post');
    assert.equal(method, 'post');
    assert.equal(url, '');
  });

  it('should convert camel case', function () {
    assert.equal(crestUtils.makeUrlPath(''), '');
    assert.equal(crestUtils.makeUrlPath('Accounts'), 'accounts');
    assert.equal(crestUtils.makeUrlPath('UsersDetails'), 'users/${}/details');
    assert.equal(crestUtils.makeUrlPath('CompaniesCustomersLikes'), 'companies/${}/customers/${}/likes');
  });

  it('should accept keywords', function () {
    assert.equal(
      crestUtils.makeUrlPath('Accounts', { Accounts: 'users' }),
      'users'
    );
    assert.equal(
      crestUtils.makeUrlPath('UsersDetails', { UsersDetails: 'users-details' }),
      'users-details'
    );
    assert.equal(
      crestUtils.makeUrlPath('CompaniesCustomersStats', { CustomersStats: 'customers-stats' }),
      'companies/${}/customers-stats'
    );
  });

  it('should interpolate arguments', function () {
    const makeUrl = (urlKey, args, pathKeywords) => {
      return crestUtils.makeUrlBodyAndHeaders(urlKey, args, pathKeywords)[0];
    };
    assert.equal(makeUrl('users', []), 'users');
    assert.equal(makeUrl('users'), 'users');
    assert.equal(makeUrl(''), '');
    assert.equal(
      makeUrl('Accounts', [133], { Accounts: 'users' }),
      'users/133'
    );
    assert.equal(
      makeUrl('UsersDetails', [12, 13], { UsersDetails: 'users-details' }),
      'users-details/12/13'
    );
    assert.equal(
      makeUrl('CompaniesCustomersStats', [134, 15], { CustomersStats: 'customers-stats' }),
      'companies/134/customers-stats/15'
    );
    assert.equal(
      makeUrl('Accounts', [133, { name: 'Jack' }], { Accounts: 'users' }),
      'users/133?name=Jack'
    );
    assert.equal(
      makeUrl('Accounts', [133, { 'name[$ne]': 'Jack' }], { Accounts: 'users' }),
      'users/133?name%5B%24ne%5D=Jack'
    );
    assert.equal(
      makeUrl('Accounts', [133, { name: ['Jack', 'Daniels'] }], { Accounts: 'users' }),
      'users/133?name=Jack&name=Daniels'
    );
  });

  it('should interpolate consecutive arguments #1', () => {
    assert.equal(
      crestUtils.makeUrlBodyAndHeaders(
        'reposStatsCommitActivity', [':owner', ':repo'],
        { repos: 'repos/${}/${}', CommitActivity: 'commit_activity' }
      )[0],
      'repos/:owner/:repo/stats/commit_activity'
    );
  });

  it('should interpolate consecutive arguments #2', () => {
    assert.equal(
      crestUtils.makeUrlBodyAndHeaders(
        'userStarred', [':owner', ':repo'],
        { userStarred: 'user/starred/${}/${}' }
      )[0],
      'user/starred/:owner/:repo'
    );
  });
});

describe('Testing crest proxy', () => {
  const u1 = { id: 101, name: 'Jane' };
  const u2 = { id: 102, name: 'Jack' };
  const u3 = { id: 103, name: 'Jenny' };
  const u4 = { id: 104, name: 'Jim' };
  const users = [u1, u2, u3, u4];

  beforeEach(() => {
    return mockServer
      .start(5005)
      .then(() => {
        return Promise.all([
          mockServer.get('/').thenJSON(200, { message: 'Hello there' }),
          mockServer.get('/users').thenJSON(200, { data: users }),
          ...(users.map(u => mockServer.get(`/users/${u.id}`).thenJSON(200, u))),
          mockServer.get('/users/MihaiBalint/orgs').thenJSON(200, { data: { name: 'github' } }),
          mockServer.get('/users/MihaiBalint/repos').thenJSON(200, { data: { name: 'crest-js' } }),
          mockServer.put('/user/starred/MihaiBalint/crest-js').thenJSON(200, { }),
          mockServer.delete('/user/starred/MihaiBalint/crest-js').thenJSON(200, { }),
          mockServer.get('/repos/MihaiBalint/crest-js/stats/commit_activity').thenJSON(200, { }),
          mockServer.post('/authorizations').thenJSON(200, { }),
          mockServer
            .get('/whoami')
            .withHeaders({ 'X-Custom-Header': '123' })
            .thenJSON(200, { data: { status: 'ok' } }),
          mockServer
            .get('/whoami')
            .thenJSON(200, { data: { status: 'error' } }),
        ]);
      });
  });

  afterEach(() => mockServer.stop());

  it('should request correctly with no trailing backslashes', function () {
    return crest({ baseUrl: 'http://localhost:5005' })
      .get()
      .then((response) => {
        assert.equal(response.data.message, 'Hello there');
      });
  });

  it('should request correctly with trailing backslash', function () {
    return crest({ baseUrl: 'http://localhost:5005/' })
      .get()
      .then((response) => {
        assert.equal(response.data.message, 'Hello there');
      });
  });

  it('should work with github', async () => {
    const hash = 'your-secret-here';
    const github = crest({
      baseUrl: 'http://localhost:5005/',
      specialFragments: {
        UserStarred: 'user/starred',
        CommitActivity: 'commit_activity',
        Repos: 'repos/${}/${}'
      }
    });
    github.authorizationBasic(hash);

    // GET /users/MihaiBalint/orgs
    assert.exists(await github.getUsersOrgs('MihaiBalint'));

    // GET /users/MihaiBalint/repos
    assert.exists(await github.getUsersRepos('MihaiBalint'));

    // PUT /user/starred/:owner/:repo - Star a repository
    await github.putUserStarred('MihaiBalint', 'crest-js');

    // DELETE /user/starred/:owner/:repo - Unstar a repository
    await github.deleteUserStarred('MihaiBalint', 'crest-js');

    // GET /repos/:owner/:repo/stats/commit_activity - Get the last year of commit activity data
    assert.exists(await github.getReposStatsCommitActivity('MihaiBalint', 'crest-js'));

    // POST /authorizations
    assert.exists(await github.postAuthorizations({ json: { scopes: ['public_repo'] } }));
  }).timeout(50000);

  it('should do basic axios requests', function () {
    const api = crest({ baseUrl: 'http://localhost:5005' })
      .authorizationBearer('123')
      .useAxios()
      .addResponseInterceptor((response, method) => {
        const data = response.data;
        return (method === 'get' && data.data) ? data.data : data;
      });
    assert.exists(api);

    return api
      .getUsers()
      .then((usersResponse) => {
        assert.equal(usersResponse.length, users.length);
        assert.equal(usersResponse[0].id, users[0].id);

        return api.getUsers(103);
      })
      .then((user) => {
        assert.equal(user.id, 103);
        assert.equal(user.name, users[2].name);
      });
  });

  it('should be able to use custom headers', function () {
    const api = crest({ baseUrl: 'http://localhost:5005' })
      .useAxios()
      .addResponseInterceptor((response, method) => {
        const data = response.data;
        return (method === 'get' && data.data) ? data.data : data;
      });
    assert.exists(api);

    return api
      .getWhoami()
      .then((whoamiResponse) => {
        assert.isOk(whoamiResponse);
        assert.equal(whoamiResponse.status, 'error');

        api.setCustomHeaders({ 'X-Custom-Header': '123' });
        return api.getWhoami();
      })
      .then((whoamiResponse) => {
        assert.isOk(whoamiResponse);
        assert.equal(whoamiResponse.status, 'ok');
      });
  });

  it('should be able to use custom per-request headers', function () {
    const api = crest({ baseUrl: 'http://localhost:5005' })
      .useAxios()
      .addResponseInterceptor((response, method) => {
        const data = response.data;
        return (method === 'get' && data.data) ? data.data : data;
      });
    assert.exists(api);

    return api
      .getWhoami({ headers: { 'X-Custom-Header': '123' } })
      .then((whoamiResponse) => {
        assert.isOk(whoamiResponse);
        assert.equal(whoamiResponse.status, 'ok');
      });
  });
});
