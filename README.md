angular-presence
================
```javascript
angular.module('presence-example-one', ['presence'])
.factory('states', function($presence) {
  return $presence.init({
    ACTIVE : 0,
    INACTIVE : 1000
  });
})
.controller('ctrl', function($scope, states) {
  $scope.states = states;
});
```
