// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

var app = angular.module('starter', ['ionic']);

app.factory('geoService', function ($rootScope, $document, $timeout, $ionicPlatform) {
         var regions={"current":{}};
         return {
            initialize : function() {
                 $ionicPlatform.ready(function () {
                     if(  !!window.cordova ) {
                      //initialize geofencing
                       window.geofence.initialize().then(function () {
                       var p1 = new Promise(function(resolve, reject) {
                           window.geofence.addOrUpdate({
                               id:             'kju', //A unique identifier of geofence
                               latitude:       48.200623, //Geo latitude of geofence
                               longitude:      16.360931, //Geo longitude of geofence
                               radius:         70, //Radius of geofence in meters
                               transitionType: 1, //Type of transition 1 - Enter, 2 - Exit, 3 - Both
                           }).then(resolve, reject);
                         });
                       var p2 = new Promise(function(resolve, reject) {
                           window.geofence.addOrUpdate({
                               id:             'leo', //A unique identifier of geofence
                               latitude:       48.217928, //Geo latitude of geofence
                               longitude:      16.474847, //Geo longitude of geofence
                               radius:         50, //Radius of geofence in meters
                               transitionType: 1, //Type of transition 1 - Enter, 2 - Exit, 3 - Both
                           }).then(resolve, reject);
                         });
                         Promise.all([p1, p2])
                           .then(function () {
                               console.log('Geofence successfully added');
                               //window.geofence.onNotificationClicked = function (notificationData) {
                               //    console.log('App opened from Geo Notification!', notificationData);
                               //    $rootScope.$broadcast('region_notification',  notificationData);
                               //};
                                window.geofence.onTransitionReceived = function (geofences) {
                                    geofences.forEach(function (geo) {
                                        console.log('Geofence transition detected' + JSON.stringify(geo));
                                        $rootScope.$broadcast('region_entered',  geo);
                                          cordova.plugins.notification.local.schedule({
                                                              id: 0815,
                                                              title: 'SalonCarCollector: You are here!',
                                                              sound: 'file://img/ping.mp3',
                                                              text: 'You have entered the base',
                                                              data: geo
                                                            });
                                    });
                                };
                           }, function (reason) {
                               console.log('Adding geofence failed', reason);
                           });
                         });
                       }
                    });
                },
            getRegion: function() {
              return regions.current;
            }
         };
});


app.factory('beaconService', function ($rootScope, $document, $timeout, $ionicPlatform) {
            var beaconRegion = {};
            var beacons={"current":{}};
            beacons.paused=false;

            var locationManager = null;

            $ionicPlatform.ready(function () {
                 if(  !!window.cordova ) {
                   locationManager = cordova.plugins.locationManager;
                }

            });

            document.addEventListener("pause", function() {
              beacons.paused = true;
            }, false);

            document.addEventListener("resume", function() {
              beacons.paused = false;
            }, false);



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
                      sound: 'file://img/ping.mp3',
                      text: 'You have collected car ' + beacon.minor + ' / ' +beacon.proximity,
                      data: {beacon:beacons.current}
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
               },
               disableBluetooth: function() {
                  $ionicPlatform.ready(function () {
                        if(  !!window.cordova ) {
                          locationManager.disableBluetooth();
                        }
                  });
               },
               enableBluetooth: function() {
                   $ionicPlatform.ready(function () {
                         if(  !!window.cordova ) {
                               locationManager.enableBluetooth();
                         }
                   });
                },
               isBluetoothEnabled : function( callbackFunction ) {  //callback is: function(isEnabled) {}
                  $ionicPlatform.ready(function () {
                      if(  !!window.cordova ) {
                          locationManager.isBluetoothEnabled()
                           .then(callbackFunction)
                           .fail(console.error)
                           .done();
                       }
                       else callbackFunction(false);
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

app.controller('SplashCtrl',  function($q, $ionicPlatform, $scope, $state, $timeout, beaconService, geoService) {

  //alert('nint');

      $ionicPlatform.ready(function () {
         geoService.initialize();

        if( !!window.cordova ) {
           //check local notification permission
           cordova.plugins.notification.local.hasPermission(function (granted) {
             if( !granted ) {
                 cordova.plugins.notification.local.registerPermission(function (granted) {
                    //todo: remember setting
                 });
             }
           });
           //check bluetooth authorization
           cordova.plugins.locationManager.requestAlwaysAuthorization();
           //cordova.plugins.locationManager.requestWhenInUseAuthorization();
         }
         beaconService.isBluetoothEnabled( function(isEnabled) {
            if( !isEnabled) {
              $state.transitionTo('nobluetooth');
            }
            else {
              $timeout(function() {$state.transitionTo("app.search");}, 1000);
          }
      });
      });

});

app.controller('NoBlCtrl',  function($q, $ionicPlatform, $scope, $state, $timeout, beaconService) {
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

app.controller('AppCtrl',  ["$scope","$rootScope","$document","$state","beaconService", "geoService",function($scope, $rootScope, $document, $state, beaconService,geoService) {

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
