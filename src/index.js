'use strict';

const acceptedArgTypes = ['String', 'Number', 'Date', 'RegExp', 'Boolean'];

const isNotStructure = (arg) => {
  const argToString = Object.prototype.toString.call(arg);
  return acceptedArgTypes.reduce((found, type) => found + (argToString === `[object ${type}]`), 0) > 0;
};

const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

const capitalize = str => str.replace(/^\w/, c => c.toUpperCase());

const splitMethod = (urlKey) => {
  const method = httpMethods.find(
    method => urlKey.startsWith(method)
  );
  return [method, method && urlKey.substring(method.length)];
};

const makeUrl = (urlKey, args, specialFragments) => {
  let url = urlKey;

  Object.keys(specialFragments || {}).forEach((fragment) => {
    url = url.replace(fragment, capitalize(specialFragments[fragment]));
  });

  url = url
    .replace(/([a-z])([A-Z])/g, '$1/$2')
    .toLowerCase();

  return url;
};

exports.crest = ({ baseUrl, specialFragments }) => {
  console.log('Shut up eslint');

  return new Proxy(
    {}, {
      get(target, propKey) {
        const [method, strippedKey] = splitMethod(propKey);
        if (!method) return;

        return (...args) => {
          const url = makeUrl(strippedKey, args, specialFragments);
          return `${baseUrl}/${url}`;
        };
      }
    }
  );
};

exports.crestUtils = {
  isNotStructure,
  makeUrl,
  splitMethod,
};
