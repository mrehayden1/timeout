import { VNode } from '@cycle/dom';
import { Stream } from 'xstream';
import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';

import * as interfaces from 'interfaces';
import { User } from 'interfaces';

interface Sources extends interfaces.Sources {
  users$: Stream<User[]>
}

interface Sinks extends interfaces.Sinks {
  selectedUsers$: Stream<User[]>
}

export default function(sources: Sources): Sinks {
  const {
    DOM,
    users$
  } = sources;

  // Events of checkbox check state changes.
  const checkboxChange$ = DOM
    .select('.user-select')
    .events('change');

  // Fold all the checkbox change events into a stream of currently selected
  // users.
  const selectedUsers$: Stream<User[]> = checkboxChange$
    .map((e: Event) => {
      const elem = e.target as HTMLInputElement;
      const i = parseInt(elem.value, 10);
      return [i, elem.checked] as [number, boolean];
    })
    .fold((acc: number[], [i, checked]: [number, boolean]) => {
      if (checked) {
        return acc.concat([i]).sort();
      }
      else {
        return acc.filter(x => x !== i);
      }
    }, [] as number[])
    .compose(sampleCombine(users$))
    .map(([is, users]: [number[], User[]]) => (
      is.map(i => users[i])
    ));

  const vnode$: Stream<VNode> = users$.map(users => (
      <div>
        {users.map((user, i) => (
          <label>
            <input
              className="user-select"
              type="checkbox"
              value={i}
            />
            {user.name}
          </label>
        ))}
      </div>
    ));

  return {
    DOM: vnode$,
    HTTP: xs.of(),
    selectedUsers$
  };
}
