/* eslint arrow-body-style: ["off"] */
/* eslint global-require: ["off"] */

'use strict';

const querystring = require('querystring');

const acceptedArgTypes = ['String', 'Number', 'Date', 'RegExp', 'Boolean', 'Null', 'Undefined'];
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

const isNotStructure = (arg) => {
  const argToString = Object.prototype.toString.call(arg);
  return acceptedArgTypes.reduce((found, type) => found + (argToString === `[object ${type}]`), 0) > 0;
};


const splitMethod = (urlKey) => {
  const method = httpMethods.find(
    method => urlKey.startsWith(method)
  );
  return [method, method && urlKey.substring(method.length)];
};


const makeUrlPath = (urlKey, pathKeywords) => {
  const sep = '/${}/';
  const pathKeys = Object
    .keys(pathKeywords || {}).sort().reverse();

  return pathKeys.reduce((url, fragment) => {
    return url
      .replace(fragment, `${sep}${pathKeywords[fragment]}`.toLowerCase())
      .substring(url.indexOf(fragment) === 0 ? sep.length : 0);
  }, urlKey)
    .replace(/([a-z0-9])([A-Z])/g, `$1${sep}$2`)
    .replace(/([}])([A-Z])/g, '$1/$2')
    .toLowerCase();
};


const interpolateArgs = (url, args) => {
  args = args || [];

  // Stage 1: path arguments
  const [pathArgs, nonPathArgs] = args.reduce(([path, nonPath], arg) => {
    if (isNotStructure(arg)) {
      return [[...path, arg], nonPath];
    }
    return [path, [...nonPath, arg]];
  }, [[], []]);

  url = url.replace(/\/\$\{\}/g, () => {
    const a = pathArgs.shift();
    return a ? `/${encodeURIComponent(a)}` : '';
  });
  while (pathArgs.length > 0) {
    // Append final path arguments
    const a = pathArgs.shift();
    url = `${url}/${encodeURIComponent(a)}`;
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


const makeUrlAndBody = (urlKey, args, pathKeywords) => {
  const path = makeUrlPath(urlKey, pathKeywords);
  return interpolateArgs(path, args);
};


const axiosRequest = (method, url, headers, body) => {
  /* eslint import/no-unresolved: ["off"] */
  /* eslint import/no-extraneous-dependencies: ["off"] */
  const axios = require('axios');

  return axios
    .request(Object.assign(
      { method, url },
      headers && { headers },
      body && { data: body }
    ));
};


class Client {
  constructor() {
    this.requestLib = axiosRequest;
    this.interceptResponse = null;
    this.authHeader = null;
    this._customHeaders = null;
    this.responseInterceptors = [];
  }

  request(method, url, body) {
    return this
      .requestLib(
        method, url,
        Object.assign({}, this._customHeaders, this.authHeader),
        body
      )
      .then((response) => {
        return this.responseInterceptors.reduce(
          (processedResponse, interceptor) => interceptor(processedResponse, method, url, body),
          response
        );
      });
  }

  authorizationBearer(token) {
    this.authHeader = { Authorization: `Bearer ${token}` };
  }

  authorizationBasic(hash) {
    this.authHeader = { Authorization: `Basic ${hash}` };
  }

  setCustomHeaders(headerDict) {
    this._customHeaders = headerDict;
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  useAxios() {
    this.requestLib = axiosRequest;
  }
}


exports.crest = ({ baseUrl, specialFragments }) => {
  const client = new Client();
  const separator = baseUrl.endsWith('/') ? '' : '/';
  const proxy = new Proxy(
    {}, {
      get(target, propKey) {
        const [method, strippedKey] = splitMethod(propKey);
        if (method) {
          return (...args) => {
            const [url, body] = makeUrlAndBody(strippedKey, args, specialFragments);
            return client.request(method, `${baseUrl}${separator}${url}`, body);
          };
        }
        return (...args) => {
          client[propKey](...args);
          return proxy;
        };
      }
    }
  );
  return proxy;
};


exports.crestUtils = {
  isNotStructure,
  makeUrlAndBody,
  makeUrlPath,
  interpolateArgs,
  splitMethod,
};
