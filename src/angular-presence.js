(function() {
  'use strict';
  angular.module('presence', [])

  .directive('presence', function($presence, types) {
    function getTypeNames(param) {
      if (!param) {
        return types.getAllTypeNames();
      } else {
        return param.split(' ');
      }
    }

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        angular.forEach(getTypeNames(attrs.presence), function(typeName) {
          var type = types.get(typeName);
          element.on(type.events, function(event) {
            event = event.originalEvent || event; // use originalEvent if available
            if (event.type === 'mousemove' && event.movementX === 0 && event.movementY === 0) {
              return; // Fix for Chrome desktop notifications, triggering mousemove event.
            }
            $presence.registerAction(type.name);
          });
        });
      }
    };
  })

  .factory('types', function() {
    return {
      MOUSE: { name: 'MOUSE', events: 'click mousedown mouseup mousemove' },
      KEYBOARD: { name: 'KEYBOARD', events: 'keypress keydown keyup' },
      TOUCH: { name: 'TOUCH', events: 'touchstart touchmove touchend touchenter touchleave touchcancel'},
      getAllTypeNames: function() {
        return ['MOUSE', 'KEYBOARD', 'TOUCH'];
      },
      get: function(type) {
        type = type.toUpperCase();
        if (this[type]) {
          return this[type];
        }
        throw new Error("Unknown type for monitoring presence: " + type);
      }
    };

  })

  .factory('$presence', function ($timeout, $log, orderByFilter, types) {
    var entryState = {},
        states,
        initialStateId = 0,
        currentStateId,
        timer,
        callbacksStateLeave = {},
        callbacksStateEnter = {},
        callbacksStateChange = [];

    function init(statesInput, startDelayed) {

      function objectify() {
        angular.forEach(statesInput, function(state, key) {
          if (!angular.isObject(state)) {
            statesInput[key] = state = { enter: state };
          }
          state.name = key;
          state.enter = state.enter || 0;
        });
        return statesInput;
      }

      function sortStates() {
        var statesArray = [];
        angular.forEach(statesInput, function(state) {
          statesArray.push(state);
        });
        return orderByFilter(statesArray, "enter");
      }

      function extendStates() {
        angular.forEach(states, function(state, id) {
          state.id = id;
          state.onEnter = function(fn) {
            onStateEnter(id, fn);
          };
          state.onLeave = function(fn) {
            onStateLeave(id, fn);
          };
          state.activate = function() {
            changeState(id);
          };
        });
      }

      function extendStatesInput() {
        statesInput.onChange = function(fn) {
          onStateChange(fn);
        };
        statesInput.getCurrent = function() {
          return getCurrentState();
        };
      }

      function initInternalStructures() {
        angular.forEach(states, function(state, id) {
          function setEntryState(type) {
            if (state.accept.toUpperCase().indexOf(type) === -1) {
              entryState[type] = id+1;
            }
          }

          if (state.initial === true) {
            initialStateId = id;
          }
          if (state.accept) {
            angular.forEach(types.getAllTypeNames(), setEntryState);
          }
        });
      }

      statesInput = objectify();
      states = sortStates();
      extendStates();
      extendStatesInput();
      initInternalStructures();
    
      if (!startDelayed) {
        changeState(initialStateId);
      }

      return statesInput;
    }

    function changeState(newStateId) {
      var oldStateId = currentStateId;
      
      if (!states[newStateId]) {
        throw new Error("Unknown stateId: " + newStateId);
      }

      if (states[oldStateId]) {
        states[oldStateId].leftOn = new Date();
        states[oldStateId].active = false;
      }
      states[newStateId].active = true;
      states[newStateId].enteredOn = new Date();
      states[newStateId].enteredFrom = states[oldStateId] ? states[oldStateId].name : undefined;

      currentStateId = newStateId;

      $timeout(function() {
        notify(callbacksStateLeave[oldStateId]);
        notify(callbacksStateEnter[newStateId]);
        notify(callbacksStateChange);
      });

      restartTimer();
    }

    function changeStateToNext() {
      changeState(currentStateId + 1);
    }

    function notify(callbacks) {
      if (callbacks) {
        for (var i = 0; i < callbacks.length; i++) {
          callbacks[i](states[currentStateId]);
        }
      }
    }
  
    function restartTimer() {
      $timeout.cancel(timer);
      if (states[currentStateId+1]) {
        timer = $timeout(changeStateToNext, states[currentStateId+1].enter - states[currentStateId].enter);
      }
    }
  
    function registerAction(type) {
      if (!states) {
        return;
      }
      var targetStateId = entryState[type] || 0;
      if (targetStateId < currentStateId) {
        changeState(targetStateId);
      } else if (targetStateId === currentStateId) {
        restartTimer();
      }
    }

    function onStateChange(fn) {
      callbacksStateChange.push(fn);
    }

    function onStateEnter(state, fn) {
      (callbacksStateEnter[state] || (callbacksStateEnter[state] = [])).push(fn);
    }

    function onStateLeave(state, fn) {
      (callbacksStateLeave[state] || (callbacksStateLeave[state] = [])).push(fn);
    }

    function getCurrentState() {
      return states[currentStateId];
    }
  
    function isActive() {
      return timer !== undefined;
    }
  
    function start(initialState) {
      if (isActive()) {
        $log.info("$presence timer already started");
        return;
      }
    
      if (initialState && initialState.id) {
        changeState(initialState.id);
      } else {
        changeState(initialStateId);
      }
    }

    return {
      init: init,
      registerAction: registerAction,
      start: start,
      isActive: isActive,
      changeState: changeState
    };
  });
}());