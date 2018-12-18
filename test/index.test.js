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
    assert.equal(crestUtils.makeUrl(''), '');
    assert.equal(crestUtils.makeUrl('Accounts'), 'accounts');
    assert.equal(crestUtils.makeUrl('UsersDetails'), 'users/details');
    assert.equal(crestUtils.makeUrl('CompaniesCustomersLikes'), 'companies/customers/likes');
  });

  it('should accept keywords', function () {
    assert.equal(
      crestUtils.makeUrl('Accounts', [], { Accounts: 'users' }),
      'users'
    );
    assert.equal(
      crestUtils.makeUrl('UsersDetails', [], { UsersDetails: 'users-details' }),
      'users-details'
    );
    assert.equal(
      crestUtils.makeUrl('CompaniesCustomersStats', [], { CustomersStats: 'customers-stats' }),
      'companies/customers-stats'
    );
  });
});

describe('Testing crest proxy', () => {
  it('should instantiate crest', function () {
    const api = crest({ baseUrl: 'http://localhost:5000' });
    assert.exists(api);
  });
});
