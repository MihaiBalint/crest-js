'use strict';

const querystring = require('querystring');

const acceptedArgTypes = ['String', 'Number', 'Date', 'RegExp', 'Boolean', 'Null', 'Undefined'];
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

const isNotStructure = (arg) => {
  const argToString = Object.prototype.toString.call(arg);
  return acceptedArgTypes.reduce((found, type) => found + (argToString === `[object ${type}]`), 0) > 0;
};

const capitalize = str => str.replace(/^\w/, c => c.toUpperCase());


const splitMethod = (urlKey) => {
  const method = httpMethods.find(
    method => urlKey.startsWith(method)
  );
  return [method, method && urlKey.substring(method.length)];
};


const makeUrlPath = (urlKey, pathKeywords) => {
  let url = urlKey;

  Object.keys(pathKeywords || {}).forEach((fragment) => {
    url = url.replace(fragment, capitalize(pathKeywords[fragment]));
  });

  url = url
    .replace(/([a-z])([A-Z])/g, '$1/$2')
    .toLowerCase();
  return url;
};


const interpolateArgs = (url, args) => {
  // Stage 1: path arguments
  const [pathArgs, nonPathArgs] = args.reduce(([path, nonPath], arg) => {
    if (isNotStructure(arg)) {
      return [[...path, arg], nonPath];
    }
    return [path, [...nonPath, arg]];
  }, [[], []]);

  url = url.replace(/\//g, () => {
    const a = pathArgs.shift();
    return a ? `/${a}/` : '/';
  });
  if (pathArgs) {
    // Append final path arguments
    url = `${url}/${pathArgs.shift()}`;
  }

  // Stage 2: extract query arguments and request body
  let body = {};
  let queryArgs = {};
  if (nonPathArgs && nonPathArgs.length > 0) {
    queryArgs = nonPathArgs[0];
    if (queryArgs.json) {
      // TODO: assert nonPathArgs.length === 1
      // TODO: set content type header to application/json
      body = queryArgs.json;
      delete queryArgs.json;
    } else if (queryArgs.data) {
      // TODO: assert nonPathArgs.length === 1
      // TODO: set correct content type header
      body = queryArgs.data;
      delete queryArgs.data;
    } else if (nonPathArgs.length > 1) {
      // TODO: assert nonPathArgs.length === 2
      // TODO: set correct content type header
      body = nonPathArgs[1];
    }
  }

  // Stage 3: interpolate query arguments
  const query = querystring.stringify(queryArgs || {});
  return [!query ? url : `${url}?${query}`, body];
};


const makeUrl = (urlKey, args, pathKeywords) => {
  const path = makeUrlPath(urlKey, pathKeywords);
  const urlAndBody = interpolateArgs(path, args);
  return urlAndBody[0];
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
  makeUrlPath,
  interpolateArgs,
  splitMethod,
};
