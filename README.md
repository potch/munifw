# munifw

A signal-driven framework for small applications.

[current file sizes](./sizes.md)

# API

## `event(watchers?) => [emitEvent, onEvent]`

Create an event bus. The bus consists of two methods, an `emit` and an `on` method that notify and register a set of `watchers`. Calls to `on` return a `teardown` function used to remove the listener.

### Arguments

- `watchers` - optional `Set` containing `callback` functions that will be called by `emitEvent`

### Returns

`Array` containing two methods:

- `emitEvent(data?)` - calls all `callback` functions with the provided optional `data`.
- `onEvent(callback) => teardown` - adds `callback` to the `watchers` set. Returns a `teardown` function to remove `callback` from `watchers` set

### Example

```js
function clock() {
  const start = Date.now();
  const [onUpdate, emitUpdate] = event();
  setInterval(() => {
    emitUpdate(start - Date.now());
  }, 1000);
  return emitUpdate;
}

const onClock = clock();
const stopClockLogs = onClock((time) => {
  console.log(`time elapsed: ${time}ms`);
  if (time > 30 * 1000) {
    stopClockLogs();
  }
});
```

## `signal(initialValue, equality?) => <signal>`

Reactive state primitive built on top of `event`. Setting `.value` updates all `computed` values and runs any `effects` that depend on `<signal>.value`

### Arguments

- `initialValue` - initial value of the signal's `value` property.
- `equality: (a, b) => boolean` - optional function used to compare subsequent values of `<signal>`.value. Signals only update if `equality` returns false (indicating a change). Default equality check is `===`.

### Returns

A `<signal>` interface with the following properties:

- `.watch(fn) => teardown` - add `fn` as a watcher to be notified when the state of the signal changes. Returns a `teardown` function that removes the watcher when called.
- `.value`- state of the signal. backed by a pair of getters and setters such that setting `.value` triggers an update and accessing `.value` inside an `effect` automatically registers a watcher.
- `.touch()` manually trigger all watchers
- `.peek()` returns current `.value` without registering a watcher within `computed` or `effect`

### Example

```js
const s = signal(1);

s.watch(() => console.log("value is", s.value));

s.value = 1; // watcher will not run, value is the same
s.value = 2; // watcher function will log

const person = signal({ name: "bob", age: 29 }, (a, b) => a.name === b.name);

person.watch(() => console.log("new person!", person.value.name));

person.value = { name: "bob", age: 30 }; // no log
person.value = { name: "alice", age: 30 }; // log new person!

person.value.name = "pat"; // no log bc value wasn't changed
person.touch(); // triggers log
```

## `effect(fn, ...explicitDependencies) => teardown`

A reactive effect that runs whenever any of its dependencies change.

### Arguments

- `fn` - the body of the effect, using any number of `signal` or `computed` values to perform other work. The callback is called once immediately on the creation of the effect and any time any depnendencies (signal or computed) are changed. References to `<signal>.value` or `<computed>.value` encountered during this initial run of the callback will automatically be detected as dependencies of the effect and will re-run the effect whenever they change. `fn` is called with a special `innerEffect` argument that, if used instead of global `effect`, will ensure that effects created inside of `fn` will be destroyed when the outer effect `teardown` is called.
- `explicitDependencies` - Dependencies that are not encountered on the initial callback run can be passed positionally as `explicitDependencies` to ensure they are registered.

### Returns

A `teardown` function that can be called to "destroy" the effect and stop watching all its dependencies.

## `computed(fn, ...explicitDependencies) => <computed>`

A derived reactive value, internally the composition of a `signal` and an `effect`. `.value` updates when any signal/computed referenced in `fn` by `.value` changes. Takes the same arguments as `effect`.

### Returns

A `<computed>` interface, which is the same as `<signal>` but with an additional `.teardown()` method which is a reference to the teardown provided by the internal `effect`.

### Example

```js
const a = signal(1);
const b = signal(2);

const c = computed(() => a.value + b.value);

console.log(c.value); // 3

a.value = 3;

console.log(c.value); // 5
```

## `dom(tag, props?, ...children) => HTMLElement`

Create HTML elements, hyperscript compatible. Effects created during prop setting are captured and reported to `onEvent`.

### Arguments

- `tag` - can be a string tag name or a function that returns an HTMLElement
- `props` - optional object of properties/attributes. Attached to the element using `assign` and `setProp`. If `props` is not an object it's treated as the first chid.
- `children` - positional arguments, appended to created element.

### Returns

Created `HTMLElement`.

## `on(el, type, handler) => teardown`

Create DOM event listeners using `addEventListener`, returns a teardown that calls `removeEventListener`

## `mount(fn, ...explicitDependencies) => HTMLElement?`

## `assign(a, b) => a`

Deep-recursing version of `Object.assign`. If `a` is an `HTMLElement`, uses `setProp`.

## `setProp(el, key, value) => void`

Set a single prop on an element. Props values can be signals/computeds, which will be bound to the element and automatically updated. If the special prop `ref` is a signal, that signal's value will be set to the element. Functions, objects, and existing props of the element are set directly on the element. Other values are treated as attributes and set using `setAttribute` or `removeAttribute`

## `onEffect(fn) => teardown`

A global event bus that is called whenever any framework method creates an effect. Listeners are called with the teardown associated with that effect. Used for ensuring internal effects can be tracked and cleaned up.

## `using(cb, fn)`

Runs `fn` and automatically calls `cb` after `fn` returns.

## `collect(onEvent, fn, collection?)`

Uses the provided event bus and `using` to "collect" any arguments passed to events emitted when `fn` is run.

### Example

```js
const [emit, on] = event();
const teardowns = collect(on, () => {
  for (let i = 1; i <= 4; i++) {
    emit(i);
  }
});
console.log(teardowns); // [1, 2, 3, 4]
```
