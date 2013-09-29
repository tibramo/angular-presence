#angular-presence
An AngularJS directive & service to detect user interactions and set them in relation to user-defined states like *active*, *away* etc.

A usecase could be a chat system where you want to know if the user typing, idling or away.

##Examples

See [this page](http://katebe.github.io/angular-presence/) for live exmaples.

##Usage
1. `bower install --save angular-presence` or download the script directly.
2. Include the dependency in your HTML.
3. Add the `presence` module to your module dependencies.
4. Add a factory that defines the states and initializes the service with it:

  ```javascript
  angular.module('your-module').factory('states', function($presence) {
    var states = {
      ACTIVE : 0, // enter this state immediately after user-action
      INACTIVE : 1000 // enter this state after 1 second of non-registered user-action
    }
    return $presence.init(states);
  });
  ```

5. Add the `presence` directive as an attribute to the component(s) you would like to monitor.
6. Use your defined states in other services or controllers.

##Defining your states
The example above shows the minimal object definition you have to pass to `$presence.init()`. It is equivalent to the following:
```javascript
{
  ACTIVE : { enter: 0 }, // *enter* is optinal here, 0 is the default value if not set
  INACTIVE : { enter: 1000}
}
```

Other attributes you can set are
* `initial: true` on the state that should be active at the start of your application
* `accept` which takes a string containing one or more keywords from `'MOUSE KEYBOARD TOUCH'`. If, for example, `MOUSE` is not accepted on state `X` then a mouse-event can only activate the state that comes after `X`
* any other that you like, but watch out for the ones added automatically.


A more complex example for a chat system could look like this:
```javascript
{
  TYPING : {
    accept: "KEYBOARD"
  },
  IDLE : { // initially and two seconds after the last keypress this state will be active
    enter: 2000,
    initial: true
  },
  AWAY : 2000 // twenty seconds after the last keypress this state will be active
}
```

##Adding the directive

You can add the `presence` directive as an attribute on any component that you like. If you dont want to detect all events, you can pass it a string with one or more keywords from `'MOUSE KEYBOARD TOUCH'`.

##Using the defined states

The presence service enhances each state-object with some attributes:
* `name` [string] is the name of the state
* `id` [number] is the id of the state which relates to the order of the states, beginning with 0
* `active` [boolean] shows whether this state is currently active or not
* `enteredOn`/`leftOn` [date] shows the date when the state was entered/left at last
* `enteredFrom` [string] shows the name of the state that was active before this state

Additionaly, every state-object has two functions, `onEnter` and `onLeave`, which take a function as the only parameter that will be called when the state will be entered or left.

The user-defined service itself is extended with two functions:
* `onChange` which takes, just like `onEnter` and `onLeave`, a function that will be called with newly active state object whenever this changes.
* `getCurrent` which returns the currently active state.

## Contributing

Pull requests welcome. Only change files in `src` and don't bump any versions.
Please respect the code style in place.

## License

MIT
