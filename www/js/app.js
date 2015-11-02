// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

var app = angular.module('starter', ['ionic']);


app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
 .state('splash', {
    url: '/splash',
    templateUrl: 'templates/splash.html',
    controller: 'SplashCtrl'
  })
    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.search', {
    url: '/search',
    //templateUrl: 'templates/search.html',
    views: {
      search: {
        templateUrl: 'templates/search.html'
      },

    }
  })

  .state('app.saloncollector', {
      url: '/saloncollector',
      //templateUrl: 'templates/saloncollector.html',
      controller: 'CollectorCtrl',
      params: {beacon: null},
      views: {
        saloncollector: {
          templateUrl: 'templates/saloncollector.html'
        }
      }

    })
  .state('nobluetooth', {
    url: '/nobluetooth',
    templateUrl: 'templates/nobluetooth.html',
    controller: 'NoBlCtrl',
    })
    ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/splash');
});

app.controller('SplashCtrl', function ($q, $ionicPlatform, $scope, $state, $timeout, beaconService, logService) {

    //alert('nint');

    $ionicPlatform.ready(function () {
        //geoService.initialize();

        if (!!window.cordova) {
            //check local notification permission
            cordova.plugins.notification.local.hasPermission(function (granted) {
                if (!granted) {
                    cordova.plugins.notification.local.registerPermission(function (granted) {
                        //todo: remember setting
                    });
                }
            });
            //check bluetooth authorization
            cordova.plugins.locationManager.requestAlwaysAuthorization();
            //cordova.plugins.locationManager.requestWhenInUseAuthorization();
        }
        $timeout(function () { $state.transitionTo("app.search"); }, 1000);
        /*beaconService.isBluetoothEnabled(function (isEnabled) {
            if (!isEnabled) {
                $state.transitionTo('nobluetooth');
            }
            else {
                $timeout(function () { $state.transitionTo("app.search"); }, 1000);
            }
        }, function () {
            $state.transitionTo('app.search');
        });*/
    });
});

app.controller('NoBlCtrl', function ($q, $ionicPlatform, $scope, $state, $timeout, beaconService, logService) {
      $scope.enableBluetooth = function() {
        beaconService.enableBluetooth();
      };
     testbl = function() {
        beaconService.isBluetoothEnabled( function(isEnabled) {
            if( isEnabled) {
                   $state.transitionTo("app.search");
            }
            else $timeout(function() { testbl(); }, 2000);
         });
     };
     testbl();
});
app.controller('CollectorCtrl',  function($stateParams, $state, $scope) {
    $scope.beacon = $stateParams.beacon ? $stateParams.beacon : null;
});

app.controller('AppCtrl', ["$scope", "$rootScope", "$document", "$state", "beaconService", "logService", function ($scope, $rootScope, $document, $state, beaconService, logService) {

  //alert('nint');
    $scope.log = logService.getLog();


    $scope.beacons = beaconService.getBeacons();
    beaconService.start( 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 815);
    $rootScope.$on("beacon_change", function(event, args) {
              var bc = args;
              logService.log('controller-beaconwatch:' + bc.minor );
              var currentCollectorBeacon = ($state.current && $state.current.name == "app.saloncollector") ? $state.current.params.beacon : null;
              if( bc != null && bc.minor && ( currentCollectorBeacon == null || currentCollectorBeacon.minor != bc.minor )) {
                $state.transitionTo("app.saloncollector", {beacon:bc});
                //$scope.$apply();
              }
              else {
                $state.transitionTo("app.search");
              }
          }, true);

}]);

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
