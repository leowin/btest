app.factory('beaconService', function ($rootScope, $document, $timeout, $ionicPlatform, logService) {
    var beaconRegion = {};
    var beacons = { "current": {} };
    beacons.paused = false;
    logService.log("beaconService init");

    var locationManager = null;
    var bgPlugin = new Promise(function(resolve, reject) {
        $ionicPlatform.ready(function () {
            if (!!window.cordova) {
                resolve(cordova.plugins.backgroundMode)
            }
            else {
                resolve({ enable: function () { this.onactivate();}, disable: function() {this.ondeactivate();}, isEnabled: function () { return true; }, isActive: function () { return false; }, onactivate: function () { }, ondeactivate: function () { }, onfailure: function (errorcode) { logService.log('bgPlugin-onfailure: ' + errorcode); } });
            }
        });
    });

    $ionicPlatform.ready(function () {
        if (!!window.cordova) {
            locationManager = cordova.plugins.locationManager;
        }

    });

    document.addEventListener("pause", function () {
        beacons.paused = true;
    }, false);

    document.addEventListener("resume", function () {
        beacons.paused = false;
    }, false);



    startScanForBeacons = function () {
        //logService.log('startScanForBeacons')
        var delegate = new locationManager.Delegate()

        delegate.didDetermineStateForRegion = function (pluginResult) {
            //logService.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
        }

        delegate.didStartMonitoringForRegion = function (pluginResult) {
            //logService.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
        }

        delegate.didRangeBeaconsInRegion = function (pluginResult) {
            logService.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))
            var beacon = null;
            for (var i = 0; i < pluginResult.beacons.length; i++) {
                if (pluginResult.beacons[i].rssi > -60 && (beacon == null || pluginResult.beacons[i].rssi > beacon.rssi))
                    beacon = pluginResult.beacons[i];
            }
            if (beacon == null)
                return;

            var prevBeaconMinor = beacons.current.minor;
            beacons.current = { minor: beacon.minor };
            $rootScope.$apply(function () {
                $rootScope.$broadcast('beacon_change', beacons.current);
            });
            logService.log('found nearest beacon: ' + beacon.minor + "/" + beacon.rssi + "/" + beacon.proximity + " old was: " + prevBeaconMinor);
            if (beacons.paused && (prevBeaconMinor != beacon.minor)) {
                cordova.plugins.notification.local.schedule({
                    id: 1,
                    title: 'SalonCarCollector: New car',
                    sound: 'file://img/ping.mp3',
                    text: 'You have collected car ' + beacon.minor + ' / ' + beacon.proximity,
                    data: { beacon: beacons.current }
                });
            }
            //$rootScope.$broadcast("beacon_change");
        }

        delegate.didEnterRegion = function (pluginResult) {
            bgPlugin.then(function (pl) {
                pl.enable();
            });
            logService.log('didEnterRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))

            if (beacons.rangingStarted)
                return;

            locationManager.startRangingBeaconsInRegion(bR)
                    .fail(logService.error)
                    .done(function () {
                        beacons.rangingStarted = true;
                        logService.log('rangingStarted' + (beacons.paused ? " (paused)" : ""))
                    });
        }

        delegate.didExitRegion = function (pluginResult) {
            logService.log('didExitRegion: ' + JSON.stringify(pluginResult) + (beacons.paused ? " (paused)" : ""))
            bgPlugin.then(function (pl) {
                pl.disable();
            });

            if (!beacons.rangingStarted)
                return;
            locationManager.stopRangingBeaconsInRegion(bR)
                                  .fail(logService.error)
                                    .done(function () {
                                        beacons.rangingStarted = false;
                                        logService.log('rangingStopped' + (beacons.paused ? " (paused)" : ""))
                                    });
        }


        // Set the delegate object to use.
        locationManager.setDelegate(delegate)

        var bR = new locationManager.BeaconRegion(
            'I', beaconRegion.uuid, beaconRegion.major, undefined, true);
        bR.notifyEntryStateOnDisplay = true;
        // Start monitoring.
        locationManager.startMonitoringForRegion(bR)
          .fail(logService.error)
          .done();

    }

    return {
        getBeacons: function () { return beacons; },
        start: function (uuid, major, minor) {
            $ionicPlatform.ready(function () {
                if (!!window.cordova) {
                    beaconRegion.uuid = uuid;
                    beaconRegion.major = major;
                    beaconRegion.minor = minor;
                    startScanForBeacons();
                }
                else {
                    $timeout(function () {
                        beacons.current = { minor: 2 }; //close the popup after 3 seconds for some reason
                        $rootScope.$broadcast("beacon_change", beacons.current);
                    }, 5000);
                    $timeout(function () {
                        beacons.current = { minor: 1 }; //close the popup after 3 seconds for some reason
                        $rootScope.$broadcast("beacon_change", beacons.current);
                    }, 8000);
                }
            });
        },
        disableBluetooth: function () {
            $ionicPlatform.ready(function () {
                if (!!window.cordova) {
                    locationManager.disableBluetooth();
                }
            });
        },
        enableBluetooth: function () {
            $ionicPlatform.ready(function () {
                if (!!window.cordova) {
                    locationManager.enableBluetooth();
                }
            });
        },
        isBluetoothEnabled: function (callbackFunction, callbackFailed) {  //callback is: function(isEnabled) {}
            $ionicPlatform.ready(function () {
                if (!!window.cordova) {
                    locationManager.isBluetoothEnabled()
                     .then(callbackFunction)
                     .fail(callbackFailed)
                     .done();
                }
                else callbackFunction(false);
            });
        }
    };
});

/*app.factory('geoService', function ($rootScope, $document, $timeout, $ionicPlatform) {
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
                               logService.log('Geofence successfully added');
                               //window.geofence.onNotificationClicked = function (notificationData) {
                               //    logService.log('App opened from Geo Notification!', notificationData);
                               //    $rootScope.$broadcast('region_notification',  notificationData);
                               //};
                                window.geofence.onTransitionReceived = function (geofences) {
                                    geofences.forEach(function (geo) {
                                        logService.log('Geofence transition detected' + JSON.stringify(geo));
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
                               logService.log('Adding geofence failed', reason);
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
*/
