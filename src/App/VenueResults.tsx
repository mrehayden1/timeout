import { VNode } from '@cycle/dom';
import { Stream } from 'xstream';
import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';

import * as interfaces from 'interfaces';
import { Maybe, User, Venue } from 'interfaces';

interface Sources extends interfaces.Sources {
  selectedUsers$: Stream<User[]>,
  venues$: Stream<Venue[]>
}

interface Sinks extends interfaces.Sinks {}

type UserVenueFit = {
  canDrink: boolean,
  canEat: boolean,
  user: User
};

type VenueFitness = {
  venue: Venue,
  userFits: Array<UserVenueFit>
};

type VenuesPartition = {
  valid: VenueFitness[],
  invalid: VenueFitness[]
};

function partitionVenues (
  users: User[],
  venues: Venue[]
): Maybe<VenuesPartition> {
  if (users.length > 0) {
    // For each venue find if each user can eat and drink.
    const venueFitnesses: VenueFitness[] = venues.map(venue => {
      const userFits: Array<UserVenueFit> = users.map(user => {
        const canDrink = venue.drinks
          .filter(drink => user.drinks.indexOf(drink) > -1)
          .length > 0;
        const canEat = venue.food
          .filter(food => user.wont_eat.indexOf(food) < 0)
          .length > 0;

        return {
          canDrink,
          canEat,
          user
        } as UserVenueFit;
      });

      return {
        venue,
        userFits
      };
    });

    return {
      valid: venueFitnesses.filter(venueFitness => (
        venueFitness.userFits.every(userFit => userFit.canDrink && userFit.canEat)
      )),
      invalid: venueFitnesses.filter(venueFitness => (
        venueFitness.userFits.some(userFit => !userFit.canDrink || !userFit.canEat)
      ))
    } as Maybe<VenuesPartition>;
  }
  else {
    return null;
  }
}

export default function VenueResults(sources: Sources): Sinks {
  const {
    selectedUsers$,
    venues$
  } = sources;

  // Partition in the venues into a list of valid venues and a list of invalid
  // venues with the fitness of the venue for each user. If there are no
  // selected users return null since we can't give a valid result.
  const venuesPartition$: Stream<Maybe<VenuesPartition>> = selectedUsers$
    .compose(sampleCombine(venues$))
    .map(([users, venues]) => partitionVenues(users, venues))
    .startWith(null);

  function venueResultsView(venuesPartition: Maybe<VenuesPartition>): VNode {
    if (venuesPartition !== null) {
      return (
        <div>
          <p>
            <strong style={{ display: 'block' }}>Places to go:</strong>
            <ul>
              {venuesPartition.valid.length ? (
                venuesPartition.valid.map((venueFitness, i) => (
                  <li key={i}>{venueFitness.venue.name}</li>
                ))
              ) : (
                <strong>None</strong>
              )}
            </ul>
          </p>
          <p>
            <strong style={{ display: 'block' }}>Places to avoid:</strong>
            <ul>
              {venuesPartition.invalid.length ? (
                venuesPartition.invalid.map((venueFitness, i) => (
                  <div>
                    <li key={i}>{venueFitness.venue.name}</li>
                    <ul>
                      {(venueFitness.userFits
                          .filter(userFit => (
                            !userFit.canDrink || !userFit.canEat
                          ))
                          .map((userFit, i) => (
                            <li key={i}>{userVenueFitnessView(userFit)}</li>
                          ))
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <strong>None</strong>
              )}
            </ul>
          </p>
        </div>
      );
    } else {
      return (
        <strong>Select at least one user to see suitable venues.</strong>
      );
    }
  }

  function userVenueFitnessView(userVenueFitness: UserVenueFit): VNode {
    const {
      canDrink,
      canEat,
      user
    } = userVenueFitness;

    if (!canDrink && !canEat) {
      return <span>{user.name + ' cannot eat or drink.'}</span>;
    }
    else if (!canDrink) {
      return <span>{user.name + ' cannot drink.'}</span>;
    }
    else if (!canEat) {
      return <span>{user.name + ' cannot eat.'}</span>;
    }
    else {
      // Technically not reachable in this exercise.
      return <span>{user.name + ' can eat and drink here.'}</span>;
    }
  }

  return {
    DOM: venuesPartition$.map(venueResultsView),
    HTTP: xs.never()
  }
}
