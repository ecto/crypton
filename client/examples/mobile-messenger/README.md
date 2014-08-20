To start:

````
cordova platforms add android
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.vibration
cordova plugin add com.phonegap.plugins.barcodescanner
cordova plugin add nl.x-services.plugins.socialsharing
````

Then add the following to the first activity tag in `platforms/android/AndroidManifest.xml`:

````
android:screenOrientation="portrait"
````

To run:

````
cordova run
````
