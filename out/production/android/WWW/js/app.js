// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

var app = angular.module('starter', ['ionic']);

app.factory('beaconService', function ($rootScope, $document, $timeout, $ionicPlatform) {
            var beaconRegion = {};
            var beacons={"current":{}};
            beacons.paused=false;

            document.addEventListener("pause", function() {
              beacons.paused = true;
            }, false);

            document.addEventListener("resume", function() {
              beacons.paused = false;
            }, false);

            var locationManager = null;

            startScanForBeacons = function()
            {
              //console.log('startScanForBeacons')
              var delegate = new locationManager.Delegate()

              delegate.didDetermineStateForRegion = function(pluginResult)
              {
                //console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
              }

              delegate.didStartMonitoringForRegion = function(pluginResult)
              {
                //console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
              }

              delegate.didRangeBeaconsInRegion = function(pluginResult)
              {
                console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))
                  var beacon = null;
                  for( var i = 0; i < pluginResult.beacons.length; i++) {
                    if( pluginResult.beacons[i].rssi > -60 && ( beacon == null || pluginResult.beacons[i].rssi > beacon.rssi  ))
                      beacon = pluginResult.beacons[i];
                  }
                  if( beacon == null)
                    return;

                  var prevBeaconMinor = beacons.current.minor;
                  beacons.current = {minor:beacon.minor};
                  $rootScope.$apply(function(){
                                          $rootScope.$broadcast('beacon_change',  beacons.current);
                                      });
                  console.log('found nearest beacon: ' + beacon.minor + "/" + beacon.rssi + "/" + beacon.proximity + " old was: " +  prevBeaconMinor );
                  if( beacons.paused && (prevBeaconMinor != beacon.minor )) {
                    cordova.plugins.notification.local.schedule({
                      id: 1,
                      title: 'SalonCarCollector: New car',
                      text: 'You have collected car ' + beacon.minor + ' / ' +beacon.proximity
                    });
                  }
                  //$rootScope.$broadcast("beacon_change");
              }

              delegate.didEnterRegion = function(pluginResult)
              {
                console.log('didEnterRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))

                if( beacons.rangingStarted)
                    return;

                locationManager.startRangingBeaconsInRegion(bR)
                        .fail(console.error)
                        .done( function() {
                              beacons.rangingStarted= true;
                              console.log('rangingStarted' + (beacons.paused ? " (paused)" : ""))
                         });
              }

               delegate.didExitRegion = function(pluginResult)
                {
                  console.log('didExitRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))
                   if( !beacons.rangingStarted)
                                      return;
                  locationManager.stopRangingBeaconsInRegion(bR)
                                        .fail(console.error)
                                          .done( function() { beacons.rangingStarted = false;
                                            console.log('rangingStopped' + (beacons.paused ? " (paused)" : ""))
                                          });
                }


              // Set the delegate object to use.
              locationManager.setDelegate(delegate)

              var bR = new locationManager.BeaconRegion(
                  'I', beaconRegion.uuid, beaconRegion.major, undefined, true);
              bR.notifyEntryStateOnDisplay = true;
                // Start monitoring.
                locationManager.startMonitoringForRegion(bR)
                  .fail(console.error)
                  .done();

            }

            return {
               getBeacons : function() { return beacons; },
               start : function(uuid, major, minor) {
                 $ionicPlatform.ready(function () {
                   if(  !!window.cordova ) {
                     locationManager = cordova.plugins.locationManager;
                     beaconRegion.uuid = uuid;
                     beaconRegion.major = major;
                     beaconRegion.minor = minor;
                     startScanForBeacons();
                   }
                   else {
                    $timeout(function() {
                                    beacons.current = {minor:2}; //close the popup after 3 seconds for some reason
                                    $rootScope.$broadcast("beacon_change", beacons.current);
                                 }, 5000);
                    $timeout(function() {
                                    beacons.current = {minor:1}; //close the popup after 3 seconds for some reason
                                    $rootScope.$broadcast("beacon_change",  beacons.current);
                                 }, 8000);
                   }
                 });
               }
            };
});


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

    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/splash');
});

app.controller('SplashCtrl',  function($q, $ionicPlatform, $scope, $state, $timeout) {

  //alert('nint');

      $ionicPlatform.ready(function () {
         $timeout(function() {$state.transitionTo("app.search");}, 3000);
      });

});

app.controller('CollectorCtrl',  function($stateParams, $state, $scope) {
    $scope.beacon = $stateParams.beacon ? $stateParams.beacon : null;
});

app.controller('AppCtrl',  ["$scope","$rootScope","$document","$state","beaconService",function($scope, $rootScope, $document, $state, beaconService) {

  //alert('nint');

    $scope.beacons = beaconService.getBeacons();
    beaconService.start( 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 815);

    $rootScope.$on("beacon_change", function(event, args) {
        var bc = args;
        console.log('controller-beaconwatch:' + bc.minor );
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
