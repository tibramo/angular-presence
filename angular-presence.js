(function () {
  'use strict';
  angular.module('presence', []).directive('presence', [
    '$presence',
    'prTypes',
    function ($presence, prTypes) {
      function getTypeNames(param) {
        if (!param) {
          return prTypes.getAllTypeNames();
        } else {
          return param.split(' ');
        }
      }
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          angular.forEach(getTypeNames(attrs.presence), function (typeName) {
            var type = prTypes.get(typeName);
            element.on(type.events, function () {
              $presence.registerAction(type.name);
            });
          });
        }
      };
    }
  ]).factory('prTypes', function () {
    return {
      MOUSE: {
        name: 'MOUSE',
        events: 'click mousedown mouseup mousemove'
      },
      KEYBOARD: {
        name: 'KEYBOARD',
        events: 'keypress keydown keyup'
      },
      TOUCH: {
        name: 'TOUCH',
        events: 'touchstart touchmove touchend touchenter touchleave touchcancel'
      },
      getAllTypeNames: function () {
        return [
          'MOUSE',
          'KEYBOARD',
          'TOUCH'
        ];
      },
      get: function (type) {
        type = type.toUpperCase();
        if (this[type]) {
          return this[type];
        }
        throw new Error('Unknown type for monitoring presence: ' + type);
      }
    };
  }).factory('$presence', [
    '$timeout',
    '$q',
    'orderByFilter',
    'prTypes',
    function ($timeout, $q, orderByFilter, prTypes) {
      var entryState = {}, _states, initialState = 0, currentState, timer, timerCallback = [], deferred = [], stateChangedDeferred = $q.defer();
      function init(statesInput) {
        function objectify() {
          angular.forEach(statesInput, function (state, key) {
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
          angular.forEach(statesInput, function (state) {
            statesArray.push(state);
          });
          return orderByFilter(statesArray, 'enter');
        }
        function extendStates() {
          angular.forEach(_states, function (state, id) {
            state.id = id;
            state.onEnter = function (fn) {
              return onStateEnter(id, fn);
            };
            state.onLeave = function (fn) {
              return onStateLeave(id, fn);
            };
          });
        }
        function extendStatesInput() {
          statesInput.onChange = function (fn) {
            return onStateChange(fn);
          };
          statesInput.getCurrent = function () {
            return getCurrentState();
          };
        }
        function initInternalStructures() {
          function createTimerCallback(state) {
            return function () {
              changeState(state);
            };
          }
          function setEntryState(type) {
            if (accept.indexOf(type) === -1) {
              entryState[type] = i + 1;
            }
          }
          for (var i = 0; i < _states.length; i++) {
            var state = _states[i];
            if (state.initial === true) {
              initialState = i;
            }
            if (state.accept) {
              var accept = state.accept.toUpperCase();
              angular.forEach(prTypes.getAllTypeNames(), setEntryState);
            }
            deferred[i] = $q.defer();
            timerCallback[i] = createTimerCallback(i);
          }
        }
        statesInput = objectify();
        _states = sortStates();
        extendStates();
        extendStatesInput();
        initInternalStructures();
        changeState(initialState);
        return statesInput;
      }
      function changeState(newState) {
        var oldState = currentState;
        if (_states[oldState]) {
          _states[oldState].leftOn = new Date();
          _states[oldState].active = false;
        }
        _states[newState].active = true;
        _states[newState].enteredOn = new Date();
        _states[newState].enteredFrom = _states[oldState];
        $timeout(function () {
          deferred[newState].notify(_states[newState]);
          stateChangedDeferred.notify(_states[newState]);
        });
        restartTimer(newState);
        currentState = newState;
      }
      function restartTimer(targetState) {
        if (_states[targetState + 1]) {
          $timeout.cancel(timer);
          timer = $timeout(timerCallback[targetState + 1], _states[targetState + 1].enter - _states[targetState].enter);
        }
      }
      function registerAction(type) {
        if (!_states) {
          return;
        }
        var targetState = entryState[type] || 0;
        if (targetState < currentState) {
          changeState(targetState);
        } else if (targetState === currentState) {
          restartTimer(targetState);
        }
      }
      function onStateChange(fn) {
        return stateChangedDeferred.promise.then(null, null, fn);
      }
      function onStateEnter(state, fn) {
        return deferred[state].promise.then(null, null, fn);
      }
      function onStateLeave(state, fn) {
        if (state < _states.length) {
          return onStateEnter(state + 1, fn);
        } else {
          return onStateEnter(0, fn);
        }
      }
      function getCurrentState() {
        return _states[currentState];
      }
      return {
        init: init,
        registerAction: registerAction,
        onStateChange: onStateChange,
        getCurrentState: getCurrentState
      };
    }
  ]);
}());