import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';

import App from './App';

const drivers = {
  DOM: makeDOMDriver('body'),
  HTTP: makeHTTPDriver()
};

run(App as any, drivers);
