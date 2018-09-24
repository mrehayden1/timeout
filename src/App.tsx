import { DOMSource, VNode } from '@cycle/dom';
import { HTTPSource, RequestOptions, Response } from '@cycle/http';
import xs from 'xstream';
import { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import sampleCombine from 'xstream/extra/sampleCombine';

import { Maybe, Sources, Sinks, User, Venue } from 'interfaces';
import { stringToLower } from 'functions';

import UserSelect from './App/UserSelect';
import VenueResults from './App/VenueResults';

export default function(sources: Sources): Sinks {
  const {
    DOM,
    HTTP
  } = sources;

  // Imitate the feeds with a static file and a delay.
  const usersRequest$: Stream<RequestOptions> = xs
    .of({
      category: 'users',
      url: '/users.json'
    } as RequestOptions)
    .compose(delay(Math.random() * 1500));

  const venuesRequest$: Stream<RequestOptions> = xs
    .of({
      category: 'venues',
      url: '/venues.json'
    } as RequestOptions)
    .compose(delay(Math.random() * 1500));

  const request$ = xs.merge(usersRequest$, venuesRequest$);

  // Turn the responses into a stream of users and venues.
  // TODO Handling network failure and parse errors.
  const users$: Stream<User[]> = HTTP
    .select('users')
    .flatten()
    .map((response : Response) => (
      // Normalise the data.
      response.body
        .map((user: any) => ({
          drinks: user.drinks.map(stringToLower),
          name: user.name,
          wont_eat: user.wont_eat.map(stringToLower)
        }))
    ));

  const venues$: Stream<Venue[]> = HTTP
    .select('venues')
    .flatten()
    .map((response: Response) => (
      // Normalize the data.
      response.body
        .map((venue: any) => ({
          drinks: venue.drinks.map(stringToLower),
          food: venue.drinks.map(stringToLower),
          name: venue.name
        }))
    ));

  // User select component
  const userSelect = UserSelect({
    DOM,
    HTTP,
    users$
  });

  // Venue results component
  const venueResults = VenueResults({
    DOM,
    HTTP,
    selectedUsers$: userSelect.selectedUsers$,
    venues$
  });

  type State = {
    userSelectDOM: Maybe<VNode>,
    venueResultsDOM: Maybe<VNode>
  };

  function combineState([
    userSelectDOM,
    venueResultsDOM
  ] : [
    VNode,
    VNode
  ]) {
    return {
      userSelectDOM,
      venueResultsDOM
    };
  }

  // View state stream, which describes the UI.
  const viewState$: Stream<State> = xs
    .combine(
      userSelect.DOM.map(v => v as Maybe<VNode>).startWith(null),
      venueResults.DOM.map(v => v as Maybe<VNode>).startWith(null)
    )
    .map(combineState);

  // Functions for rendering the component from the view state.
  function view(state: State): VNode {
    const {
      userSelectDOM,
      venueResultsDOM
    } = state;

    // While waiting for the feeds to load display a helpful message.
    if (!userSelectDOM) {
      return (<p>Loading...</p>);
    } else {
      return (
        <div>
          <p>
            {userSelectDOM}
          </p>
          {venueResultsDOM}
        </div>
      );
    }
  }

  // Map over the view state stream to generate the DOM.
  const vnode$ = viewState$.map(view);

  return {
    DOM: vnode$,
    HTTP: request$
  };
}
