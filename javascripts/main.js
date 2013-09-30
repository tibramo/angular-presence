angular.module('presence-example-one', ['presence'])
.factory('states', function($presence) {
  return $presence.init({
    ACTIVE : { enter: 0, text: "I know you're there!" },
    INACTIVE : {enter: 1000, text: "Are you there?" }
  });
})
.controller('ctrl', function($scope, states) {
  $scope.states = states;
});

angular.module('presence-example-two', ['presence'])
.factory('states', function($presence) {
  return $presence.init({
    TYPING : {
      accept: "kEYBOARD", text: "Hey, you are typing!"
    },
    IDLE : {
      enter: 2000, initial: true, text: "I know you're there, why dont you type something?",
    },
    SHORTAWAY : {
	  enter: 5000, text: "Ok, i think you're gone."
	},
	LONGAWAY : {
	  enter: 10000, text: "You're definetly gone... but you should type something."
	}
  });
})
.controller('ctrl', function($scope, states) {
  $scope.states = states;

  states.onChange(function(state) {
    $scope.text = state.text;
  });
  
  states.LONGAWAY.onLeave(function() {
    alert("Hey, you are back!");
  });
});