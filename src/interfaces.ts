import { DOMSource, VNode } from '@cycle/dom';
import { HTTPSource, RequestOptions } from '@cycle/http';
import { Stream } from 'xstream';

export interface Sources {
  DOM: DOMSource,
  HTTP: HTTPSource
};

export interface Sinks {
  DOM: Stream<VNode>,
  HTTP: Stream<RequestOptions>
};

export type Maybe<T> = T | null;

export type User = {
  name: string,
  wont_eat: string[],
  drinks: string[]
};

export type Venue = {
  name: string,
  food: string[],
  drinks: string[]
};
