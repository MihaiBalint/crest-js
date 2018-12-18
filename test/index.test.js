'use strict';

const { assert } = require('chai');
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

  it('should convert camel case', function () {
    assert.equal(crestUtils.makeUrlPath(''), '');
    assert.equal(crestUtils.makeUrlPath('Accounts'), 'accounts');
    assert.equal(crestUtils.makeUrlPath('UsersDetails'), 'users/details');
    assert.equal(crestUtils.makeUrlPath('CompaniesCustomersLikes'), 'companies/customers/likes');
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
      'companies/customers-stats'
    );
  });

  it('should interpolate arguments', function () {
    assert.equal(
      crestUtils.makeUrl('Accounts', [133], { Accounts: 'users' }),
      'users/133'
    );
    assert.equal(
      crestUtils.makeUrl('UsersDetails', [12, 13], { UsersDetails: 'users-details' }),
      'users-details/12'
    );
    assert.equal(
      crestUtils.makeUrl('CompaniesCustomersStats', [134, 15], { CustomersStats: 'customers-stats' }),
      'companies/134/customers-stats/15'
    );
    assert.equal(
      crestUtils.makeUrl('Accounts', [133, { name: 'Jack' }], { Accounts: 'users' }),
      'users/133?name=Jack'
    );
    assert.equal(
      crestUtils.makeUrl('Accounts', [133, { 'name[$ne]': 'Jack' }], { Accounts: 'users' }),
      'users/133?name%5B%24ne%5D=Jack'
    );
    assert.equal(
      crestUtils.makeUrl('Accounts', [133, { name: ['Jack', 'Daniels'] }], { Accounts: 'users' }),
      'users/133?name=Jack&name=Daniels'
    );
  });
});

describe('Testing crest proxy', () => {
  it('should instantiate crest', function () {
    const api = crest({ baseUrl: 'http://localhost:5000' });
    assert.exists(api);
  });
});
