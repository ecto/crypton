/*
 * TODO LICENSE
 */

var app = {
  // Application Constructor
  initialize: function() {
    app.enableLoginButtons();
    $('#account-login').show();
    $('#username-login').focus();
    crypton.host = 'nulltxt.se';
    this.card =  new crypton.Card();
    this.bindEvents();
  },

  MESSAGE_TYPE: 'messengerMessage',

  APPNAME: 'CryptonMessenger',

  URL: 'https://crypton.io',

  VERSION: "0.1",

  get username() { return app.session.account.username },

  get fingerprint() { return app.session.account.fingerprint },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    var mainBtnIds = ['my-messages', 'my-fingerprint',
                      'verify-id-card', 'my-contacts',
                      'find-users', 'logout'];

    var hideMainButtons = app.hideMainButtons = function hideMainButtons(exceptBtn) {
      if (!exceptBtn) {
        console.error('exceptBtn is required');
        return;
      }
      for (var i = 0; i < mainBtnIds.length; i++) {
        if (mainBtnIds[i] != exceptBtn) {
          var node = $('#' + mainBtnIds[i])[0];
          console.log(node);
          if (node) {
            $(node).hide();
          }
        }
      }
    };

    $('#scan').click(function () {
      app.scanQRCode();
    });

    $('#get-image').click(function () {
      app.getImage();
    });

    $('#logout').click(function () {
      app.logout();
    });

    $("#register-btn").click(function () {
      app.createAccount();
    });

    $("#login-btn").click(function () {
      app.login();
    });

    $('#my-contacts').click(function () {
      hideMainButtons('my-contacts');
      $('.view').hide();
      app.displayContacts();
    });

    $('#verify-id-card').click(function () {
      hideMainButtons('verify-id-card');
      $('.view').hide();
      $('#scan-select').show();
    });

    $('#my-fingerprint').click(function () {
      hideMainButtons('my-fingerprint');
      $('.view').hide();
      $('#my-fingerprint-id').show();
      app.displayMyFingerprint(true);
    });

    $('#find-users').click(function () {
      hideMainButtons('find-users');
      $('.view').hide();
      $('#find-users-view').show();
    });

    $('#find-someone-btn').click(function () {
      app.findSomeone();
      $('#find-someone').focus();
    });

    $('#tasks-btn').click(function (){
      $('.main-btn').show();
      $('.view').hide();
    });

    $('#contacts-detail-dismiss-btn').click(function () {
      $('.contact-id').remove();
      $('#contact-details').hide();
      $('#contacts').show();
    });

    $('#compose-send-btn').click(function () {
      console.log('send!!');
    });

    $('#my-messages').click(function () {
      hideMainButtons('my-messages');
      $('.view').hide();
      $('#messages').show();
    });

    $('#create-id-card').click(function () {
      app.firstRunCreateIdCard( function () {
        $('.view').hide();
        app.revealMenu();
        hideMainButtons('my-fingerprint');
        $('#my-fingerprint-id').show();
        app.firstRunComplete();
      });
    });;

    $('#find-someone').keyup(
      function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (event.target == $('#find-someone')[0]) {
          if(keycode == '13'){
            $('#find-someone-btn').focus();
            app.findSomeone();
          }
        }
    });
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.enableLoginButtons();
    app.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    if (!id) {
      console.error("No id provided to receivedEvent");
      return;
    }
    var parentElement = document.getElementById(id);
    if (!parentElement) {
      console.error('Element with id: ' + id + ' does not exist.');
      return;
    }
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  },

  alert: function (message, level) {
    // success, info, warning, danger
    if (!level) {
      level = 'warning';
    }
    var html = '<div class="alert alert-' + level + '" role="alert">'
                                                  + message
                                                  + '</div>';
    var node = $(html);
    $('#app').append(node);
    window.setTimeout(function () {
      node.fadeOut('slow');
      node.remove();
    }, 3000);
  },

  logout: function () {
    app.session = null;
    $('.view').hide();
    $('.main-btn').hide();
    $('#tasks-btn').hide();
    $('#account-login').show();
    $('#login-buttons').show();
    $('#password-login').val("");
    $('#app-name').css({'padding-left': '1em'});
    app.alert("You are logged out", 'info');
  },

  scanQRCode: function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        var userObj = JSON.parse(result.text);
        app.verifyUser(userObj.username, userObj.fingerprint);
      },
      function (error) {
        app.alert("Scanning failed: " + error, 'danger');
      }
    );
  },

  getPhoto: function (callback) {
    // via the CAMERA
    function onSuccess (imageURI) {
      console.log(imageURI);
      // XXXddahl: should not have to add to the DOM here!
      // We should just return an image object
      var img = $('#picture')[0];
      img.src = "data:image/jpeg;base64," + imageURI;
      callback(null, img);
    }

    function onFail (message) {
      callback(message);
      app.alert('An error occured: ' + message, 'danger');
    }

    // Specify the source to get the photos.
    navigator.camera.getPicture(onSuccess, onFail,
                                { quality: 50,
                                  destinationType:
                                  Camera.DestinationType.DATA_URL,
                                  sourceType:
                                  navigator.camera.PictureSourceType.CAMERA,
                                  targetheight: 200,
                                  targetHeight: 200
                                });

  },

  getImage: function () {
    function onSuccess (imageURI) {
      console.log(imageURI);
      var largeImage = document.getElementById('picture');
      largeImage.style.display = 'block';
      largeImage.src = imageURI;

      qrcode.callback = function (data) {
        // alert(data);
        var userObj = JSON.parse(data);
        app.verifyUser(userObj.username, userObj.fingerprint);
      };
      try {
        qrcode.decode(imageURI);
      } catch (e) {
        app.alert('Cannot decode QR code', 'danger');
        console.error(e);
      }
    }

    function onFail (message) {
      app.alert('An error occured: ' + message, 'danger');
    }

    //Specify the source to get the photos.
    navigator.camera.getPicture(onSuccess, onFail,
                                { quality: 100,
                                  destinationType:
                                  Camera.DestinationType.FILE_URI,
                                  sourceType:
                                  navigator.camera.PictureSourceType.SAVEDPHOTOALBUM
                                });
  },

  createAccount: function () {
    $('#login-progress').show();
    var user = $('#username-login').val();
    var pass = $('#password-login').val();
    function callback (err) {
      if (err) {
        $('#login-progress').hide();
        app.setLoginStatus(err);
        return;
      }
      $('.view').hide();
      $('#scan-select').show();
      // $('#account-name-label').show();
      // $('#account-name').text(user);
      $('#login-progress').hide();
    }

    app.register(user, pass, callback);
  },

  register: function (user, pass, callback) {
    app.setLoginStatus('Generating account...');

    $('#login-progress').show();
    $('#login-buttons').hide();
    crypton.generateAccount(user, pass, function (err) {
      if (err) {
        $('#login-progress').hide();
        $('#login-buttons').show();
        callback(err);
      }
      app.setLoginStatus('Logging in...');
      app.login();
    });
  },

  login: function () {
    $('#login-progress').show();
    $('#login-buttons').hide();
    var user = $('#username-login').val();
    var pass = $('#password-login').val();

    function callback (err, session) {
      if (err) {
        app.alert(err, 'danger');
        $('#login-progress').hide();
        $('#login-buttons').show();
        app.clearLoginStatus();
        return;
      }
      $('.view').hide();
      // $('#account-name').text(user);
      app.username = user;
      app.session = session;
      $('#login-progress').hide();
      $('#login-buttons').show();
      // Check for first run
      app.loadOrCreateContainer('_prefs_', function(err, rawContainer) {
        if (err) {
          console.error(err);
          return;
        }
        var prefs = rawContainer.keys;
        if (!prefs['first-run']) {
          app.firstRun();
          return;
        }
        app.revealMenu();
      });
    }

    crypton.authorize(user, pass, function (err, session) {
      if (err) {
        return callback(err);
      }
      return callback(null, session);
    });
  },

  firstRun: function () {
    // prompt to create Id card & why
    $('.view').hide();
    $('#first-run').show();
  },

  firstRunComplete: function () {
    app.loadOrCreateContainer('_prefs_',
    function (err, rawContainer) {
      if (err) {
        console.error('Cannot load prefs conatiner, firstRunComplete failed');
        return;
      }
      var prefs = rawContainer;
      prefs.keys['first-run'] = Date.now();
      prefs.save();
    });
  },

  revealMenu: function () {
    $('#app-name').css({'padding-left': 0, 'margin-right': 0 });

    $('#tasks-btn').show();
    // $('#account-name-label').show();
    $("#top-menu").show();
    $(".main-btn").show();
  },

  hideMenu: function () {
    $('#tasks-btn').hide();
    // $('#account-name-label').hide();
    $("#top-menu").hide();
    $(".main-btn").hide();
  },

  disableLoginButtons: function () {
    $('#login-buttons').hide();
  },

  enableLoginButtons: function () {
    $('#login-buttons').show();
  },

  setLoginStatus: function (m) {
    $('#login-status .status').text(m);
  },

  clearLoginStatus: function (m) {
    $('#login-status .status').text('');
  },

  formatFingerprint: function (fingerprint) {
    return this.card.createFingerprintArr(fingerprint).join(" ");
  },

  verifyUser: function (username, fingerprint) {
    var rawFingerprintArr = fingerprint.split(' ');
    var rawFingerprint = rawFingerprintArr.join('').toLowerCase();
    // XXXddahl: the above ^^ is a hack to make this work for now
    $('#verify-user-success-msg').children().remove();
    $('#verify-user-failure-msg').children().remove();
    $('#verify-trust-failure-ok').hide();
    app.hideMainButtons('verify-user');
    $('#verify-user').show();

    app.session.getPeer(username, function(err, peer) {
      if (err) {
        app.alert(err, 'danger');
        return;
      }

      function success () {
        peer.trust(function (err) {
          if (err) {
            console.log('peer trust failed: ' + err);
            app.alert(err, 'warning');
          } else {
            app.alert('Peer ' + username + ' is now a trusted contact!',
                      'success');
            $('#verify-user-success-msg').children().remove();
            // TODO: remove click events from buttons
            app.hideMainButtons('verify-id-card');
            $('.view').hide();
            $('#scan-select').show();
          }
        });
      }

      function cancelTrust () {
        $('#verify-user-success-msg').children().remove();
        $('#verify-user-failure-msg').children().remove();
        // TODO: remove click events from buttons
        app.hideMainButtons('verify-id-card');
        $('.view').hide();
        $('#scan-select').show();
      }

      var outOfBandFingerprint = rawFingerprint;
      var outOfBandFingerprintArr =
        app.card.createFingerprintArr(outOfBandFingerprint);
      var colorArr = app.card.createColorArr(outOfBandFingerprintArr);
      var outOfBandIdGrid = app.card.createIdentigrid(colorArr, 120, 120);

      var peerFingerprintArr = app.card.createFingerprintArr(peer.fingerprint);
      var peerColorArr = app.card.createColorArr(peerFingerprintArr);
      var peerIdGrid = app.card.createIdentigrid(peerColorArr, 120, 120);

      if (peer.fingerprint == outOfBandFingerprint) {
        $('#verify-user-success').show();
        $('#verify-user-failure').hide();
        var conf = '<p>The <strong>server supplied</strong> '
                 + 'ID color grid for <strong>'
                 + username
                 + '</strong> is: </p>'
                 + '<p id="server-idgrid-canvas"></p>'
                 + '<p><strong>'
                 + username
                 + '\'s scanned/selected</strong> ID color grid '
                 + 'is :</p>'
                 + '<p id="outofband-idgrid-canvas"></p>'
                 + '<p>It is a MATCH, click \'Trust and Save\' to add <strong>'
                 + username
                 + ' </strong> to your trusted contacts.</p>'
        var msg = $(conf);
        $('#verify-user-success-msg').append(msg);
        // add canvases to DOM
        $('#server-idgrid-canvas').append(peerIdGrid);

        $('#outofband-idgrid-canvas').append(outOfBandIdGrid);

        $('#verify-trust-save').click(function () {
          success();
        });

        $('#verify-trust-cancel').click(function () {
          cancelTrust();
        });
        $('#verify-trust-save').show();
        $('#verify-trust-cancel').show();
      } else {
        // Failure to match fingerprints
        $('#verify-user-success').hide();
        $('#verify-user-failure').show();
        $('#verify-trust-failure-ok').show();
        $('#verify-trust-save').hide();
        $('#verify-trust-cancel').hide();

        var conf = '<p>The server supplied</strong> '
                 + 'ID color grid for <strong>'
             + username
             + '</strong> is: <p/>'
             + '<p id="server-idgrid-canvas"></p>'
             + '<p>The <strong>scanned</strong> ID card is :</p>'
             + '<p id="outofband-idgrid-canvas"></p>'
             + '<p>It is NOT A MATCH</p> <strong>'
             + username
             + ' </strong>*Cannot* be a trusted contact.';

        var msg = $(conf);
        $('#verify-user-failure-msg').append(msg);
        // add canvases to DOM
        $('#server-idgrid-canvas').append(peerIdGrid);
        $('#outofband-idgrid-canvas').append(outOfBandIdGrid);

        $('#verify-trust-failure-ok').click(function () {
          cancelTrust();
        });
      }
    });
  },

  findSomeone: function () {
    var username = $('#find-someone').val();
    if (!username) {
      var errtxt = "Please enter a username";
      console.error(errtxt);
      app.alert(errtxt, 'danger');
      $('#find-someone-btn').focus();
      return;
    }

    app.getPeer(username, function (err, peer) {
      if (err) {
        return app.alert(err, 'danger');
      }
      var fingerprint = peer.fingerprint;
      app.displayPeerFingerprint(peer.username, fingerprint);
    });
  },

  peers: {},

  getPeer: function (username, callback) {
    if (app.peers[username]) {
      return callback(null, app.peers[username]);
    }

    app.session.getPeer(username, function (err, peer) {
      if (err) {
        return callback(err);
      }

      app.peers[username] = peer;
      callback(null, peer);
    });
  },

  displayPeerFingerprint: function (username, fingerprint) {
    $('#peer-fingerprint-id').children().remove();
    $('.view').hide();
    $('#peer-fingerprint-id').show();

    var canvas =
      app.card.createIdCard(fingerprint, username,
                             app.APPNAME, app.URL);
    $(canvas).css({ width: '300px'});
    $('#peer-fingerprint-id').append(canvas);
  },

  // XXXddahl: We need to cache the user's ID Card with photo for the session

  firstRunCreateIdCard: function (callback) {
    // XXXddahl: this is a hack for now
    app.retakeIdPicture(true, callback);
  },

  retakeIdPicture: function (firstRun, callback) {
    // remove ID card
    $('#my-fingerprint-id').children().remove();
    // delete existing image
    app.deleteIdPhoto(function (err) {
      if (err) {
        if (!firstRun) {
          return app.alert('Cannot delete existing ID photo', 'danger');
        }
      }
      // Re-create the ID card
      var canvas =
        app.card.createIdCard(app.fingerprint, app.username,
                              app.APPNAME, app.URL);
      app.addPhotoToIdCard(canvas , function (err, idCard) {
        if (err) {
          return app.alert(err, 'danger');
        }
        app.displayIdCard(idCard, callback);
      });
    }, true);
  },

  displayIdCard: function (idCard, callback) {
    $(idCard).css({ width: '300px', 'margin-top': '1em'});
    $('#my-fingerprint-id').append(idCard);
    var idCardTitle = app.username + ' ' + app.APPNAME + ' ID Card';
    var base64Img = idCard.toDataURL("image/png");
    var html = '<button id="share-my-id-card" '
             + 'class="btn btn-default">Share My ID Card</button>'
             + '<button id="retake-id-picture" '
             + 'class="btn btn-default">Retake ID Picture</button>';
    // XXXddahl: add a 'remove ID picture' button

    $('#my-fingerprint-id').append(html);

    $('#share-my-id-card').click(function () {
      window.plugins.socialsharing.share(null, idCardTitle, base64Img, null);
    });

    $('#retake-id-picture').click(function () {
      app.retakeIdPicture();
    });
    if (callback) {
      callback();
    }
  },

  displayMyFingerprint: function (withPhoto) {

    $('#my-fingerprint-id').children().remove();
    var canvas =
      app.card.createIdCard(app.fingerprint, app.username,
                             app.APPNAME, app.URL);
    if (withPhoto) {
      app.addPhotoToIdCard(canvas , function (err, idCard) {
        console.log('addPhotoToIdCard callback');
        console.log(idCard);
        if (err) {
          return app.alert(err, 'danger');
        }
        app.displayIdCard(idCard);
      });
    }
  },

  PHOTO_CONTAINER: '_id_photo',

  addPhotoToIdCard: function (idCard, callback) {
    // check for existing photo:
    app.loadOrCreateContainer(app.PHOTO_CONTAINER,
      function (err, rawContainer) {
        if (err) {
          return callback(err);
        }
        // paste photo into ID:
        function pastePhoto(imageData, idCard) {
          var thumb = app.thumbnail(imageData, 100, 100);
          var ctx = idCard.getContext('2d');
          ctx.drawImage(thumb, 280, 10);
          return idCard;
        }
        var photo = rawContainer;
        if (photo.keys['imgData']) {
          // XXXddahl: try ??
          var photoIdCard = pastePhoto(photo.keys['imgData'], idCard);
          return callback(null, idCard);
        } else {
          app.getPhoto(function (err, image) {
            console.log('getPhoto Callback');
            console.log(image);
            photo.keys['imgData'] = image.src;
            photo.save(function (err){
              if (err) {
                var _err = 'Cannot save photo data to server';
                console.error(_err + ' ' + err);
                return app.alert(_err);
              }
              // photo is saved to the server
              var photoIdCard =
                pastePhoto(photo.keys['imgData'], idCard);
              // console.log(photoIdCard);
              return callback(null, photoIdCard);
            });
          });
        }
    });
  },

  thumbnail: function thumbnail(base64, maxWidth, maxHeight) {

    // Max size for thumbnail
    if(typeof(maxWidth) === 'undefined') var maxWidth = 120;
    if(typeof(maxHeight) === 'undefined') var maxHeight = 120;

    // Create and initialize two canvas
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var canvasCopy = document.createElement("canvas");
    var copyContext = canvasCopy.getContext("2d");

    // Create original image
    var img = new Image();
    img.src = base64;

    // Determine new ratio based on max size
    var ratio = 1;
    if(img.width > maxWidth)
      ratio = maxWidth / img.width;
    else if(img.height > maxHeight)
      ratio = maxHeight / img.height;

    // Draw original image in second canvas
    canvasCopy.width = img.width;
    canvasCopy.height = img.height;
    copyContext.drawImage(img, 0, 0);

    // Copy and resize second canvas to first canvas
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(canvasCopy, 0, 0,
                  canvasCopy.width, canvasCopy.height,
                  0, 0, canvas.width, canvas.height);

    return canvas;
  },


  deleteIdPhoto: function (callback, quietly) {
    app.session.deleteContainer(app.PHOTO_CONTAINER,
      function (err) {
        if (err){
          return app.alert(err, 'danger');
        }
        for (var i = 0; i < app.session.containers.length; i++) {
          if (app.session.containers[i].name == app.PHOTO_CONTAINER) {
            app.session.containers.splice(i, 1);
          }
        }
        if (!quietly) {
          app.alert('deleted', 'info');
        }
        if (callback) {
          callback();
        }
      });
  },

  loadOrCreateContainer: function (containerName, callback) {
    app.session.load(containerName, function (err, container) {
      if (err) {
        return app.session.create(containerName, function (err) {
          if (err) {
            return callback(err);
          }
          app.loadOrCreateContainer(containerName, callback);
        });
      }
      callback(err, container);
    });
  },

  displayContacts: function () {
    console.log("displayContacts()");
    app.getContactsFromServer(function (err, contacts) {
      if (err) {
        app.alert(err, 'danger');
        return;
      }
      $('#contacts').show();
      app._contacts = contacts;
      $('#contacts-list').children().remove();
      for (var name in contacts) {
        var html = '<li class="contact-record" id="contact-'
                   + name
                   + '">'
                   + name
                   + '</li>';
        $('#contacts-list').append($(html));
      }

      $('.contact-record').click(function () {
        var contact = $(this).text();
        console.log(contact);
        app.contactDetails(contact);
        // set the message button event handler inside this one...
        $('#contacts-detail-message-btn').click(function () {
          app.showComposeUI(contact);
        });
      });

    });
  },

  contactDetails: function (name) {
    var contact = app._contacts[name];
    // display the contact's fingerprint ID card:
    var canvas = app.card.createIdCard(contact.fingerprint,
                                        name,
                                        app.APPNAME, app.URL);
    $(canvas).css({ width: '300px', 'margin-top': '1em'});
    $(canvas).attr({'class': 'contact-id'});
    $('#contact-details').prepend(canvas);
    $('#contacts').hide();
    $('#contact-details').show();
  },

  getContactsFromServer: function (callback) {
    app.session.load(crypton.trustStateContainer,
    function (err, rawContainer) {
      if (err) {
        console.error(err);
        return callback(err);
      }
      app.contactsContainer = rawContainer;
      return callback(null, app.contactsContainer.keys);
    });
  },

  messageIdQueue: [],

  messages: {},

  fillMessageQueue: function (callback) {
    console.log('checkMessages');
    app.session.inbox.poll(function (err, messages) {
      if (err) {
        console.error(err);
        return callback(err);
      }
      console.log(messages);
      return callback(null, messages);
    });
  },

  getMessages: function (qty) {
    if (!qty) {
      qty = 5;
    }
    app.fillMessageQueue(function (err, messageIds) {
      if (err) {
        return app.alert(err, 'danger');
      }

      console.log('numberOfMessages: ', messageIds.length);
      if (messageIds.length < 1) {
        return app.alert('No new messages', 'info');
      }
      var numMessagesToGet;
      if (messageIds.length <= qty) {
        numMessagesToGet = messageIds.length;
      } else {
        numMessagesToGet = qty;
      }
      var newMessageIds = messageIds;
      var j = 0;
      app.session.inbox.messages = {}; // kill the cache!
      for (var i = 0; i < messageIds.length; i++) {
        // get the message, save in messages, remove from msg_id array
        var msgId = messageIds[i].messageId;
        // console.log(Object.keys(messageIds));
        console.log(msgId);
        if (!msgId) {
          console.log('Skipping');
          continue; // XXXddahl: fix this in server code!!!
        }
        console.log('inbox.get()', msgId);
        app.session.inbox.get(msgId, function (err, message) {

          console.log('message.........');
          console.log(message);
          if (err) {
            // app.messageIdQueue.splice(j, 1);
            j++;
            return console.error(err);
          }
          if (!app.messages[msgId]) {
            app.messages[msgId] = message;
            newMessageIds.push(msgId);
            // app.messageIds.splice(j, 1);
            j++;
            return; // console.log(message);
          }
          j++;
          console.log('j', j);
          if (j == numMessagesToGet) {
            // decrypt and display messages
            for (var i = 0; i < numMessagesToGet; i++) {
              var idx = newMessageIds[i];
              app.session.getPeer(message.fromUsername, function (err, peer) {
                if (err) {
                  return console.error(err);
                }
                console.log('decrypt.........');
                message.decrypt(function (err, decryptedMsg) {
                  if (err) {
                    return console.error(err);
                  }
                  var plaintextMessage = {
                    from: message.   fromUsername,
                    to: decryptedMsg.headers.toUsername,
                    subject: decryptedMsg.payload.subject,
                    content: decryptedMsg.payload.content,
                    sent: decryptedMsg.payload.sent
                  };
                  console.log(plaintextMessage);
                  app.listMessage(plaintextMessage);
                  // delete app.messages[idx];
                });
              });
            }
          }
        });
      }
    });
  },

  handleMessage: function (message) {
    console.log('handleMessage()');
    console.log(message);
    if (!message) {
      console.warn('message is undefined');
      return;
    }
    if (message.headers.type != app.MESSAGE_TYPE) {
      return;
    }
    // msg = {from, to, subject, content}
    var plaintextMessage = {
      from: message.headers.fromUsername,
      to: message.headers.toUsername,
      subject: message.payload.subject,
      content: message.payload.content,
      sent: message.payload.sent
    };

    app.listMessage(plaintextMessage);
  },

  sendProgress: function(isFinished) {
    // TODO
  },

  listMessage: function (message) {
    // Add this message to the message list
    console.log('listMessage...');
    console.log(message);
    var html = '<li><span class="msg-from">'
               + message.from
               + '</span>'
               + '<div class="msg-subject">'
               + message.subject
             + '</div>'
             + '<div class="full-message">'
             + JSON.stringify(message)
             + '</div>'
             + '</li>';
    var msg = $(html);
    $('#message-list').prepend(msg);
    msg.click(function () {
      // XXXddahl halfbaked!
      var fullMsg = JSON.parse($(this).text());
      alert(fullMsg.content);
    });
    app.notifyMessageArrival(message);
  },

  notifyMessageArrival: function (message) {
    var dismiss = function () {
      // open the message
      console.log('display message');
      console.log(window);
    }
    // Use notification API to buzz + notify mobile user
    navigator.notification.alert(
      'A message arrived from ' + message.from,
      dismiss,
      'New Message',
      'Read'
    );
  },

  archived_messages: null,

  message_index: null,

  send: function () {
    console.log('send()');
    // assemble the message object
    var recipient = $('#compose-recipient').val();
    var subject = $('#compose-subject').val();
    var content = $('#compose-content').val();
    if (!recipient || !subject || !content) {
      return app.alert('Cannot send a message without subject or message', 'danger');
    }
    var message = {
      recipient: recipient,
      subject: subject,
      content: content,
      sent: Date.now()
    };

    app.sendMessage(message, function (err) {
      console.log('sendMessage callback...')
      if (err) {
        console.error(err);
        return app.alert(err, 'danger');
      }
      app.cleanupNewMessage();
      app.alert('Message Sent!');
    });
  },

  sendMessage: function (message, callback) {
    console.log('sendMessage()');
    console.log(message);
    app.session.getPeer(message.recipient, function(err, peer) {
      console.log('getting peer callback');
      if (err) {
        console.error(err);
        return app.alert(err, 'danger');
      }
      // We have a peer
      if (!peer.trusted) {
        console.error('peer is not trusted');
        return app.alert('Cannot send a message to untrusted peer', 'danger');
      }
      // Send it
      var payload = {
        subject: message.subject,
        content: message.content,
        sent: message.sent
      };

      var headers = {
        type: app.MESSAGE_TYPE
      };

      app.sendProgress();
      peer.sendMessage(headers, payload, function (err, messageId) {
        if (err) {
          app.alert('Message send failed', 'danger');
          return callback(err);
        }
        app.sendProgress(true);
        callback(null, messageId);
      });
    });
  },

  showComposeUI: function (recipient) {
    $('.view').hide();
    $('#compose-recipient').val(recipient);
    $('#compose-message').show();
    $('#compose-subject').focus();
    $('#compose-send-btn').click(function () {
      app.send();
    });
  },

  cleanupNewMessage: function (wasSent) {
    // clean up, reset and hide message UI
    $('.view').hide();
    $('#compose-message').hide();
    $('.main-btn').show();
  }
};
