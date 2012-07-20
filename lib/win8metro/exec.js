var cordova = require('cordova');


 /* definition of named properties expected by the native side,
    all arrays are stored in order of how they are received from common js code.
    When other platforms evolve to using named args this will be removed.
 */


/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchrounous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method

 */



var NativeProxy = {
    "Accelerometer": { 
        onDataChanged:null,       
        start:function(win,lose){

            var accel = Windows.Devices.Sensors.Accelerometer.getDefault();
            if(!accel) {
                lose("No accelerometer found");
            }
            else {
                var self = this;
                accel.reportInterval = Math.max(16,accel.minimumReportInterval);

                // store our bound function
                this.onDataChanged = function(e) {
                    var a = e.reading;
                    win(new Acceleration(a.accelerationX,a.accelerationY,a.accelerationZ));
                }
                accel.addEventListener("readingchanged",this.onDataChanged);
            }
        },
        stop:function(win,lose){
            console.log("Accelerometer.stop");
            var accel = Windows.Devices.Sensors.Accelerometer.getDefault();
            if(!accel) {
                lose("No accelerometer found");
            }
            else {
                accel.removeEventListener("readingchanged",this.onDataChanged);
                this.onDataChanged = null;
                accel.reportInterval = 0; // back to the default
                win();
            }
        }
    },
    "Camera":{
        // args will contain ...  it is an array, so be careful
        // 0 quality:50, 
        // 1 destinationType:Camera.DestinationType.FILE_URI, 
        // 2 sourceType:Camera.PictureSourceType.CAMERA, 
        // 3 targetWidth:-1, 
        // 4 targetHeight:-1, 
        // 5 encodingType:Camera.EncodingType.JPEG,
        // 6 mediaType:Camera.MediaType.PICTURE, 
        // 7 allowEdit:false, 
        // 8 correctOrientation:false, 
        // 9 saveToPhotoAlbum:false, 
        // 10 popoverOptions:null        
        "takePicture":function(win,lose,args) {
            if(args[2] == Camera.PictureSourceType.CAMERA) {
                // display the camera, and capture an image
                var dialog = new Windows.Media.Capture.CameraCaptureUI();
                var allowCrop = !!args[7];
                if(!allowCrop) {
                    dialog.photoSettings.allowCrop = false;
                }
                else {
                    var aspectRatio = { width:args[3] > 0 ? args[3] : 1, height: args[4] > 0 ? args[4] : 1};
                    dialog.photoSettings.croppedAspectRatio = aspectRatio;
                }
                if(args[5] == Camera.EncodingType.JPEG) {
                    dialog.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;
                }
                else if (args[5] == Camera.EncodingType.PNG) {
                    dialog.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.png;
                }

                dialog.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo).done(
                    function(file){
                        if(file) {
                            console.log("got a file in success handler");
                            if(args[1] == Camera.DestinationType.FILE_URI)
                            {
                                var imageBlobUrl = URL.createObjectURL(file);
                                win(imageBlobUrl);
                            }
                        }
                        else {
                            console.log("success handler without file ...");
                        }
                    },
                    function(err) {
                        console.log("err in camerq");
                    });
            }
            else {
                // grab from the photo library
                var picker = new Windows.Storage.Pickers.FileOpenPicker();
                picker.viewMode = Windows.Storage.Pickers.PickerViewMode.thumbnail;
                picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.picturesLibrary;

                picker.fileTypeFilter.replaceAll([".png", ".jpg", ".jpeg"]);

                picker.pickSingleFileAsync().then(function (file) {
                    if (file) {
                        console.log("got a file in success handler");
                        if(args[1] == Camera.DestinationType.FILE_URI)
                        {
                            var imageBlobUrl = URL.createObjectURL(file);
                            win(imageBlobUrl);
                        }
                    } else {
                        // cancelled ??
                        console.log("success handler without file ...");
                    }
                });
            }

        }

    },
    "Compass":{
        onReadingChanged:null,
        getHeading:function(win,lose) {
            var deviceCompass = Windows.Devices.Sensors.Compass.getDefault();
            if(!deviceCompass) {
                setTimeout(function(){lose("Compass not available");},0);
            }
            else {

                deviceCompass.reportInterval = Math.max(16,deviceCompass.minimumReportInterval);

                this.onReadingChanged = function(e) {
                    var reading = e.reading;
                    var heading = new CompassHeading(reading.headingMagneticNorth, reading.headingTrueNorth);
                    win(heading);
                };
                deviceCompass.addEventListener("readingchanged",this.onReadingChanged);
            }

        },
        stopHeading:function(win,lose) {
            var deviceCompass = Windows.Devices.Sensors.Compass.getDefault();
            if(!deviceCompass) {
                setTimeout(function(){lose("Compass not available");},0);
            }
            else {

                deviceCompass.removeEventListener("readingchanged",this.onReadingChanged);
                this.onReadingChanged = null;
                deviceCompass.reportInterval = 0;
                win();
            }

        }
    },
    "Device": {
        getDeviceInfo:function(win,fail,args){
            console.log("NativeProxy::getDeviceInfo");
            setTimeout(function(){
                win({platform:"win8metro", version:"8", name:"metrova", uuid:"42", cordova:"2.0.1"});
            },0);
        }
    },
    "File": {

        getFileMetaData:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        getMetadata:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        getParent:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        readAsText:function(win,fail,args) { // ["fileName","encoding"]
            var fileName = args[0];
            var encoding = args[1];
        },
        readAsDataURL:function(win,fail,args) { // ["fileName"]
            var fileName = args[0];
        },
        getDirectory:function(win,fail,args) { // ["fullPath","path","options"]
            var fullPath = args[0];
            var path = args[1];
            var options = args[2];
        },
        remove:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        removeRecursively:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        getFile:function(win,fail,args) { // ["fullPath","path","options"]
            var fullPath = args[0];
            var path = args[1];
            var options = args[2];
        },      
        readEntries:function(win,fail,args) { // ["fullPath"]
            var fullPath = args[0];
        },
        write:function(win,fail,args) { // ["fileName","data","position"]
            var fileName = args[0];
            var data = args[1];
            var position = args[2];
        },
        truncate:function(win,fail,args) { // ["fileName","size"]
            var fileName = args[0];
            var size = args[1];
        },
        copyTo:function(win,fail,args) { // ["fullPath","parent", "newName"]
            var fullPath = args[0];
            var parent = args[1];
            var newName = args[2];
        },
        moveTo:function(win,fail,args) { // ["fullPath","parent", "newName"]
            var fullPath = args[0];
            var parent = args[1];
            var newName = args[2];
        },
        tempFileSystem:null,
        persistentFileSystem:null,
        requestFileSystem:function(win,fail,args) { // ["type","size"]

            var type = args[0];
            var size = args[1];


        },         
        resolveLocalFileSystemURI:function(win,fail,args) { // ["uri"]
            var uri = args[0];
        }           

    },
    "NetworkStatus": { 
        getConnectionInfo:function(win,fail,args)
        {
            var winNetConn = Windows.Networking.Connectivity;
            var networkInfo = winNetConn.NetworkInformation;
            var networkCostInfo = winNetConn.NetworkCostType;
            var networkConnectivityInfo = winNetConn.NetworkConnectivityLevel;
            var networkAuthenticationInfo = winNetConn.NetworkAuthenticationType;
            var networkEncryptionInfo = winNetConn.NetworkEncryptionType;

            var profile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
            if(profile) {
            var conLevel = profile.getNetworkConnectivityLevel();

            switch (conLevel) {
                case Windows.Networking.Connectivity.NetworkConnectivityLevel.none:
                    break;
                case Windows.Networking.Connectivity.NetworkConnectivityLevel.localAccess:
                    break;
                case Windows.Networking.Connectivity.NetworkConnectivityLevel.internetAccess:
                    break;
                case Windows.Networking.Connectivity.NetworkConnectivityLevel.constrainedInternetAccess:
                    break;
            }
        }


            // FYI
            //Connection.UNKNOWN  'Unknown connection';
            //Connection.ETHERNET 'Ethernet connection';
            //Connection.WIFI     'WiFi connection';
            //Connection.CELL_2G  'Cell 2G connection';
            //Connection.CELL_3G  'Cell 3G connection';
            //Connection.CELL_4G  'Cell 4G connection';
            //Connection.NONE     'No network connection';

            setTimeout(function(){
                win("wifi");
            },0);
        }

    } 
};
    // ,
    // "Accelerometer": require('cordova/plugin/bada/Accelerometer'),
    // "Notification": require('cordova/plugin/bada/Notification'),
    // "Compass": require('cordova/plugin/bada/Compass'),
    // "Capture": require('cordova/plugin/bada/Capture'),
    // "Camera": require('cordova/plugin/bada/Camera'),
    // "Contacts": require('cordova/plugin/bada/Contacts')


module.exports = function(success, fail, service, action, args) {

    if(NativeProxy[service] && NativeProxy[service][action]) {

        var callbackId = service + cordova.callbackId++;
        console.log("EXEC:" + service + " : " + action);

        if (typeof success == "function" || typeof fail == "function") {
            cordova.callbacks[callbackId] = {success:success, fail:fail};
        }
        // pass it on to Notify
        try {
            NativeProxy[service][action](success, fail, args);
        }
        catch(e) {
            console.log("Exception calling native with command :: " + service + " :: " + action  + " ::exception=" + e);
        }
    }
    else
    {
        if(fail) { fail("Missing Command Error"); };
    }

};
