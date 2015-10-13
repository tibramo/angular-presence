#angular-presence
An AngularJS directive & service to detect user interactions and set them in relation to user-defined states like *active*, *away* etc.

Use this in an chat or messenger application where you want to display the user states. Or you want to inform the user about updates when the user returned after being away - or show specific views depending on the input method (mouse/keyboard/touch).

**If you miss any feature, please let me know!**

##Examples

See [this page](http://katebe.github.io/angular-presence/) for live examples.

##Usage
1. `bower install --save angular-presence` or download the script directly.

2. Include the script dependency in your HTML and the module dependency for `presence` in your code.

3. Add a factory that defines the states and initializes the `$presence` service with it. This will enhance your self-defined object with attributes and functions that you can use later.

    ```javascript
    angular.module('your-module').factory('states', function($presence) {
      var states = {
        ACTIVE : 0, // enter this state immediately after user-action
        INACTIVE : 1000 // enter this state after 1 second without any registered events
      }
      return $presence.init(states);
    });
    ```
    
    If you like, you can pass `$presence.init` the boolean value `true` as a second parameter, so the internal timer for changing states will not start immediately. Later, call `$presence.start()` to start it. Additionaly, you can check with `$presence.isActive()` whether the timer is already running or not.

4. Add the `presence` directive as an attribute to the component(s) you would like to monitor.

5. Use your defined states in other services or controllers.

##Defining your states
The example above shows the minimal object definition you have to pass to `$presence.init()`. It is equivalent to the following:
```javascript
{
  ACTIVE : { enter: 0 }, // *enter* is optinal here, 0 is the default value if no value is given
  INACTIVE : { enter: 1000}
}
```

Other attributes you can set are
* `initial: true` on the state that should be active at the start of your application
* `accept` which takes a string containing one or more keywords from `'MOUSE KEYBOARD TOUCH'`. If, for example, `MOUSE` is not accepted on state `X`, then a mouse-event can only activate the state that comes after `X`
* any other that you like, but watch out for the ones added automatically.


A more complex example for a chat system could look like this:
```javascript
{
  TYPING : {
    accept: "KEYBOARD"
  },
  IDLE : { // initially, two seconds after the last keypress and when mouse- or touchevents occur this state will be active
    enter: 2000,
    initial: true
  },
  AWAY : 20000 // this state will be active 18 seconds (20s - 2s) after the last registered event in IDLE, wich is equivalent to 20 seconds atfer entering TYPING when no event occurs
}
```

##Adding the directive

You can add the `presence` directive as an attribute on any components that you like. If you dont want to detect all events, you can pass it a string with one or more keywords from `'MOUSE KEYBOARD TOUCH'`.

##Using the defined states

The presence service enhances each state-object with some attributes / functions:
* `name` [string] is the name of the state
* `id` [number] is the id of the state which relates to the order of the states, beginning with 0
* `active` [boolean] shows whether this state is currently active or not
* `enteredOn`/`leftOn` [date] shows the date when the state was entered/left at last
* `enteredFrom` [string] shows the name of the state that was active before this state
* `activate` [function] to manually activate the state

Additionaly, every state-object has two functions, `onEnter` and `onLeave`, which take a function as the only parameter that will be called when the state will be entered or left.

The user-defined service itself is extended with two functions:
* `onChange` which takes, just like `onEnter` and `onLeave`, a function that will be called with the newly active state object whenever this changes.
* `getCurrent` which returns the currently active state.

## Contributing

Pull requests welcome. Only change files in `src` and don't bump any versions.
Please respect the code style in place.

## License

MIT
