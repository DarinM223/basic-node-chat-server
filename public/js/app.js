var chatApp = angular.module('chatApp', [
  'ngRoute',
]);

/**
 * creates a ng-enter directive that fires when the
 * enter key is pressed
 */
chatApp.directive('ngEnter', function() {
  return function (scope, element, attrs) {
    element.bind('keydown keypress', function (event) {
      if (event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
});
