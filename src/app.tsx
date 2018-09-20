import { DOMSource, VNode } from '@cycle/dom';
import { HTTPSource, RequestOptions } from '@cycle/http';
import xs from 'xstream';
import { Stream } from 'xstream';
import delay from 'xstream/extra/delay';

type Maybe<T> = T | null;

type Sources = {
  DOM: DOMSource,
  HTTP: HTTPSource
};

type Sinks = {
  DOM: Stream<VNode>,
  HTTP: Stream<RequestOptions>
};

type User = {
  name: string,
  wont_eat: string[],
  drinks: string[]
};

type Venue = {
  name: string,
  food: string[],
  drinks: string[]
};

export default function(sources: Sources): Sinks {

  const {
    HTTP
  } = sources;

  // Imitate the feeds with a static file and a delay.
  const usersRequest$: Stream<RequestOptions> = xs
    .of({
      category: 'users',
      url: '/users.json'
    } as RequestOptions)
    .compose(delay(1000));

  const venuesRequest$: Stream<RequestOptions> = xs
    .of({
      category: 'venues',
      url: '/venues.json'
    } as RequestOptions)
    .compose(delay(1000));

  const request$ = xs.merge(usersRequest$, venuesRequest$);

  const usersResponse$: Stream<Response> = HTTP
    .select('users')
    .flatten();

  const venuesResponse$: Stream<Response> = HTTP
    .select('venues')
    .flatten();

  const users$: Stream<User[]> = xs.never();

  const venues$: Stream<Venue[]> = xs.never();

  const feeds$: Stream<[User[], Venue[]]> = xs
    .combine(users$, venues$);

  const vnode$ = feeds$.map(feeds => {
    if (!feeds) {
      return (<p>Loading...</p>);
    }
    else {
      return (<div>Hello World!</div>);
    }
  });

  return {
    DOM: vnode$,
    HTTP: request$
  };
}
