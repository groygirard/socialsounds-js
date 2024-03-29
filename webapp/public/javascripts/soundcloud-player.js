﻿var SOCIALSOUNDSCLIENT = SOCIALSOUNDSCLIENT || {};

SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER = {
    
    SC: SC,
    clientId: String('3d4d094dc75510a4b5ad612e2d249a41'),   //TODO: To store somewhere else later - TP
    widget: String(''),
    songMedia: { title: String(''), uploader: String(''), url: String(''), apiId: String(''), provider: String('') },
    songList: [],
    timeStamp: 0,
    
    
    //TODO: Add a button Open in soundcloud
    playSoundCloudContent: function (content, timestamp) {
        var self = this;
        var iFrame = document.getElementById('soundcloudPlayer');
        var startTimeModifier = timestamp > 0 ? timestamp*1000 : 1;
        //This is for debugging, should never be used in final product
        if (!content) {
            SOCIALSOUNDSCLIENT.BASEPLAYER.getNextContent();
        }
        else {
            //First time using the widget
            if (!self.widget) {
                iFrame.src = 'https://w.soundcloud.com/player/?url=' + content.apiId + '&visual=true';
                self.widget = SC.Widget(iFrame);
                self.widget.bind(SC.Widget.Events.READY, function () {
                    SOCIALSOUNDSCLIENT.BASEPLAYER.applyPlayerMuteState();
                    //When the widget is ready:
                    self.widget.play();
                });
                self.widget.bind(SC.Widget.Events.PLAY, function () {
                    self.widget.seekTo(startTimeModifier);
                });
                self.widget.bind(SC.Widget.Events.FINISH, function () {
                    SOCIALSOUNDSCLIENT.BASEPLAYER.getNextContent();
                });
            }
            else {
                self.widget.load(content.apiId + '&visual=true');
                self.widget.bind(SC.Widget.Events.READY, function () {
                    //When the widget is ready:
                    SOCIALSOUNDSCLIENT.BASEPLAYER.applyPlayerMuteState();
                    self.widget.play();
                });
                self.widget.bind(SC.Widget.Events.PLAY, function () {
                    self.widget.seekTo(startTimeModifier);
                });
            }
        }
    },
    
    pauseSoundCloudPlayer: function (isPaused, content, elapsedTime) {
        if (this.widget) {
            if (isPaused) {
                this.playSoundCloudContent(content, this.timeStamp);
            }
            else {
                this.widget.pause();
                this.timeStamp = elapsedTime;
            }
        }   
    },
    
    stopSoundCloudPlayer: function () {
        if (this.widget) {
            this.widget.pause();
        }
    },
    
    muteSoundCloudPlayer: function (isMuted) {
        if (this.widget) {
            isMuted === true ? this.widget.setVolume(0) : this.widget.setVolume(75);
        }
    },
    
    getSoundCloudInfo: function (songUrl) {
        var self = SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER;
        $.getJSON('http://api.soundcloud.com/resolve.json?url=' + songUrl + '&client_id=' + this.clientId)
        .done(function (data) {
            if (data) {
                self.songMedia = { title: data.title, uploader: data.user.username, url: songUrl, apiId: data.uri, provider: 'soundcloud' };
            }
        })
         .fail(function () {
            self.songMedia = null;
        })
        .always(function () {
            SOCIALSOUNDSCLIENT.BASEPLAYER.receiveContentInformation(self.songMedia);
        });
    },
    
    searchSoundCloud: function (query) {
        var self = SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER;
        var results = [];
        
        SC.initialize({
            client_id: this.clientId
        });
        SC.get('/tracks', {
            q: query
        }).then(function (tracks) {
            var responseLength = tracks.length < 5 ? tracks.length : 5;
            
            if (responseLength > 0) {
                for (var i = 0; i < responseLength; i++) {
                    var res = { title: null, url: null };
                    res.title = tracks[i].title;
                    res.url = tracks[i].permalink_url;
                    results[i] = res;
                }
                SOCIALSOUNDSCLIENT.BASEPLAYER.renderSearchResults(results, "SoundCloud");
            }
            else if (tracks.length == 0) {
                0
                console.log("No SoundCloud results for current search.");
            }
        });
    },        
};

