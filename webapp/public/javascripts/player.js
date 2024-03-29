﻿var SOCIALSOUNDSCLIENT = SOCIALSOUNDSCLIENT || {};
var contentProviderList = ['soundcloud', 'vimeo', 'youtube']; // This needs to go server side when we have time. - GG

var btnOpenInBrowser = document.getElementById('btnOpenInBrowser');
var btnMuteContent = document.getElementById('btnMuteContent');
var fbShareButton = document.getElementById('fbShareButton');
var gpShareButton = document.getElementById('gpShareButton');
var twitterShareButton = document.getElementById('twitterShareButton');
var btnSkip = document.getElementById('btnSkip');
var searchButton = document.getElementById('searchButton');
var searchResultsDropdown = document.getElementById('searchResultsDropdown');
var smallDisplayChatButton = document.getElementById('smallDisplayChatBtn');
var smallDisplayPlaylistButton = document.getElementById('smallDisplayPlaylistBtn');
var currentContent = null;
var searchResultsDropdownSelectedItem;
var usernameChat = userCookie.general.username;

document.getElementById('searchResultsDropdown').style.width = document.getElementById('searchBar').clientWidth + 'px';
document.getElementById('goToRemoteBtn').setAttribute('href', document.location.pathname.replace('player', 'remote'));

function setRightAndLeftDivTop(isOwner) {
    if (document.documentElement.clientWidth < 992) {
        var bottom = document.getElementById('channelTitle').offsetHeight 
                + document.getElementById('searchBar').offsetHeight 
                + document.getElementById('contentPlayer').offsetHeight 
                + document.getElementById('btnOpenInBrowser').offsetHeight 
                + 55;
        if (isOwner) {
            bottom += document.getElementById('ownerDashboard').offsetHeight + 3;
        }
        document.getElementById('playlistSection').style.top = bottom + 'px';
        document.getElementById('chatSection').style.top = bottom + 'px';
    }
}

createChannelNameField.addEventListener('keyup', function (e) {
    if (e.keyCode == 13) {
        btnCreateChannel.click();
    }
});

btnImportContent.addEventListener('click', function () {
    var playlist = document.getElementById('importContentData').value;
    var index = playlist.indexOf('https');
    while (index > -1) {
        SOCIALSOUNDSCLIENT.BASEPLAYER.addContentFromSearch(playlist.substring(index, playlist.indexOf(' ', index)));
        index = playlist.indexOf('https', index + 1); // next link
    }

    //Clear text box
    document.getElementById('importContentData').value = '';
    $('#importContentModal').modal('hide');
    
});

searchResultsDropdownBtn.addEventListener('click', function () {
    $('#contentReadyToBeAddedMessage').hide();
    $('#contentReadyToBeAddedMessage').html("");
});

btnDashSkip.addEventListener('click', function () {
    SOCIALSOUNDSCLIENT.SOCKETIO.controlPlayer('skip');
});
btnDashMute.addEventListener('click', function () {
    SOCIALSOUNDSCLIENT.SOCKETIO.controlPlayer('mute');
    setTimeout(function () {
        if (SOCIALSOUNDSCLIENT.BASEPLAYER.getPlayerMuteState()) {
            document.getElementById('btnDashMuteVolumeOn').style.display = 'none';
            document.getElementById('btnDashMuteVolumeOff').style.display = 'inline-block';
        }
        else {
            document.getElementById('btnDashMuteVolumeOn').style.display = 'inline-block';
            document.getElementById('btnDashMuteVolumeOff').style.display = 'none';
        }
    }, 10);
});
btnDashPause.addEventListener('click', function () {
    if (currentContent === null) {
        SOCIALSOUNDSCLIENT.BASEPLAYER.getNextContent();

        setTimeout(function () {
            if (SOCIALSOUNDSCLIENT.BASEPLAYER.isPaused === false) {
                document.getElementById('btnDashPausePlay').style.display = 'none';
                document.getElementById('btnDashPausePause').style.display = 'inline-block';
            }
        }, 10);
    }
    else {
        SOCIALSOUNDSCLIENT.SOCKETIO.controlPlayer('pause');
        setTimeout(function () {
            if (SOCIALSOUNDSCLIENT.BASEPLAYER.isPaused) {
                document.getElementById('btnDashPausePlay').style.display = 'inline-block';
                document.getElementById('btnDashPausePause').style.display = 'none';
            }
            else {
                document.getElementById('btnDashPausePlay').style.display = 'none';
                document.getElementById('btnDashPausePause').style.display = 'inline-block';
            }
        }, 10);
    }
});

btnSkip.addEventListener('click', function () {
    SOCIALSOUNDSCLIENT.SOCKETIO.voteSkip();
    document.getElementById('btnSkip').disabled = true;
});

btnCancelSwitchChannel.addEventListener('click', function () {
    document.location = document.location.protocol + '/player/channels/Home-channel';
});

btnCancelCreateChannel.addEventListener('click', function () {
    document.location = document.location.protocol + '/player/channels/Home-channel';
});

btnCreateChannel.addEventListener('click', function () {
    var channelName = document.getElementById('createChannelNameField').value;
    var channelPassword = document.getElementById('createChannelPasswordField').value;
    var channelPasswordConfirm = document.getElementById('createChannelPasswordConfirmField').value;
    var privateChannel = document.getElementById('cboxPrivate').checked;
    if (channelPassword == channelPasswordConfirm) {
        if (privateChannel) {
            channelName = Math.random().toString(36).substring(7);
            SOCIALSOUNDSCLIENT.SOCKETIO.createRoom(channelName, channelPassword, privateChannel);
        }
        else {
            if (channelName.length < 1)
                $('#createChannelNameErrorMessage').show();
            else
                SOCIALSOUNDSCLIENT.SOCKETIO.createRoom(channelName.replace(/ /g, ''), channelPassword, privateChannel);  //Removing the spaces because it breaks the swtich channel event.
        }
    } else {
        $('#createChannelPasswordErrorMessage').show();
    }
    var title = 'ssPlayer - ' + channelName;
    var url = '/player/channels/' + channelName;
    if (typeof (history.pushState) != "undefined") {
        var obj = { Title: title, Url: url };
        history.pushState(obj, obj.Title, obj.Url);
    }
    document.getElementById('channelTitle').textContent = channelName;
    document.getElementById('goToRemoteBtn').setAttribute('href', document.location.pathname.replace('player', 'remote'));
    document.getElementById('ownerDashboard').style.display = 'block';
});

cboxPrivate.addEventListener('click', function () {
    var privateChannel = document.getElementById('cboxPrivate').checked;
    var channelName = document.getElementById('createChannelNameField');
    if (privateChannel) {
        channelName.disabled = true;
    }
    else {
        channelName.disabled = false;
    }
});

btnSwitchChannel.addEventListener('click', function () {
    var channelName = document.getElementById('switchChannelNameField').value;
    var channelPassword = document.getElementById('switchChannelPasswordField').value;
    SOCIALSOUNDSCLIENT.SOCKETIO.switchRoom(channelName, channelPassword);  //Removing the spaces because it breaks the swtich channel event.
});

searchButton.addEventListener('click', function () {
    var queryString = document.getElementById('searchBarInput').value;
    searchResultsDropdown.innerHTML = '';
    
    if (queryString) {
        SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.searchSoundCloud(queryString);
        SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.searchYoutube(queryString);
    }
});

searchBarInput.addEventListener('keyup', function (e) {
    if (e.keyCode == 13) {
        searchButton.click();
    }
});

exportBtn.addEventListener('click', function (e) {
    SOCIALSOUNDSCLIENT.SOCKETIO.exportContent();
});

createChannelPasswordConfirmField.addEventListener('keyup', function (e) {
    if (e.keyCode == 13) {
        btnCreateChannel.click();
    }
});

switchChannelPasswordField.addEventListener('keyup', function (e) {
    if (e.keyCode == 13) {
        btnSwitchChannel.click();
    }
});

inputChat.addEventListener('keyup', function (e) {
    var mess = document.getElementById('inputChat').value;
    if (e.keyCode == 13 && mess) {
        SOCIALSOUNDSCLIENT.BASEPLAYER.sendChat('<span><b>' + usernameChat + '</b>: ' + mess + '</span>');
        document.getElementById('inputChat').value = '';
    }
});

smallDisplayChatButton.addEventListener('click', function () {
    document.getElementById('playlistSection').style.display = "none";
    
    document.getElementById('chatSection').style.display = "block";
});

smallDisplayPlaylistButton.addEventListener('click', function () {
    document.getElementById('chatSection').style.display = "none";
    
    document.getElementById('playlistSection').style.display = "block";
});

btnOpenInBrowser.addEventListener('click', function () {
    var win = window.open(currentContent.url, '_blank');
    win.focus();
});

btnMuteContent.addEventListener('click', function () {
    var currentMuteState = SOCIALSOUNDSCLIENT.BASEPLAYER.getPlayerMuteState();
    currentMuteState = !currentMuteState;
    SOCIALSOUNDSCLIENT.BASEPLAYER.setPlayerMuteState(currentMuteState);
    SOCIALSOUNDSCLIENT.BASEPLAYER.applyPlayerMuteState();
});

function googleApiClientReady() {
    gapi.client.setApiKey('AIzaSyCg16FmXMtMPUm86w6FT5prAJEqd8obOgU');
    gapi.client.load('youtube', 'v3', function () {
        SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.handleAPILoaded();
    });
};

function scrollPlaylistToCurrentContent() {
    var contentQueueListGroup = document.getElementById("contentQueueListGroup");
    var activeElement = contentQueueListGroup.getElementsByClassName('active');
    if (activeElement.length != 0) {
        contentQueueListGroup.scrollTop = activeElement[0].offsetTop;
    }
};

function writeChannelUrlRequest(channelName) {
    document.location = document.location.protocol + '/player/channels/' + channelName;
};

// IE does not know about the target attribute. It looks for srcElement
// This function will get the event target in a browser-compatible way
function getEventTarget(e) {
    e = e || window.event;
    return e.target || e.srcElement;
};

searchResultsDropdown.addEventListener('click', function (event) {
    var target = getEventTarget(event);
    var selectedContentUrl = target.getAttribute('data-link');
    var selectedContentTitle = target.innerHTML;

    searchResultsDropdownSelectedItem = selectedContentUrl;
    if (searchResultsDropdownSelectedItem) {
        SOCIALSOUNDSCLIENT.BASEPLAYER.addContentFromSearch(searchResultsDropdownSelectedItem);
        searchResultsDropdownSelectedItem = "";

        $('#contentReadyToBeAddedMessage').html('<p>Added : ' + selectedContentTitle + ' to playlist.</p> <a id="undoLink"> Undo </a>');
        $('#contentReadyToBeAddedMessage').show();
        $('#contentReadyToBeAddedMessage').delay(4000).fadeOut(500);
    }

});

SOCIALSOUNDSCLIENT.BASEPLAYER = {
    
    isMuted: Boolean(false),
    isPaused: Boolean(false),
    
    
    playContent: function (content, timestamp) {
        console.log("Now Playing: " + content.title);
        var self = this;
        // The player stopping code below should be removed eventually. The playContent function should only be called to play content, 
        // we should not verify if contentis already playing. The logic should be moved to the future "skipSong" function,
        // which should take care of stopping the currently playing media before calling the playContent function. - GG
        console.log('Function playContent is requesting to stop content');
        this.stopContent();
        currentContent = content;
        self.toggleHighlightContentInList(currentContent);
        
        if (SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.youtubePlayer === null) {
            // nothing to do
        } 
        else if (SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.youtubePlayer.getPlayerState() == 1) {
            SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.pauseYoutubeContent();
        }
        // until here
        
        if (contentProviderList.indexOf(content.provider) > -1) {
            
            self.showPlayer(content.provider);
            switch (content.provider) {
                case 'soundcloud':
                    SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.playSoundCloudContent(content, timestamp);
                    break;
                case 'vimeo':
                    playVimeoContent(content);
                    break;
                case 'youtube':
                    SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.playYoutubeContent(content, timestamp);
                    break;
                default :
                    console.log("Oops, something went wrong while trying to launch: " + content.provider);
                    break;
            };
        } 
        else {
            console.log("Invalid content provider passed to player: " + content.provider);
        };
    },
    
    getNextContent: function () {
        var nextContentUrl = SOCIALSOUNDSCLIENT.SOCKETIO.getNextContentFromServer();
    },
    
    //Will eventually be removed when we will be able to join in a song at any moment.
    pauseContent: function (elapsedTime) {
        if (currentContent) {
            console.log('requesting congtent pause');
            if (contentProviderList.indexOf(currentContent.provider) > -1) {
                switch (currentContent.provider) {
                    case 'soundcloud':
                        console.log('requesting sc pause');
                        SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.pauseSoundCloudPlayer(this.isPaused, currentContent, elapsedTime);
                        break;
                    case 'vimeo':
                        playVimeoContent(content);
                        break;
                    case 'youtube':
                        console.log('requesting youtube pause');
                        SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.pauseYoutubeContent(this.isPaused);
                        break;
                }
                this.isPaused = !this.isPaused;
            }
        }
    },
    
    stopContent: function () {
        if (currentContent) {
            console.log('requesting congtent stop');
            if (contentProviderList.indexOf(currentContent.provider) > -1) {
                switch (currentContent.provider) {
                    case 'soundcloud':
                        console.log('requesting sc stop');
                        SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.stopSoundCloudPlayer();
                        break;
                    case 'vimeo':
                        playVimeoContent(content);
                        break;
                    case 'youtube':
                        console.log('requesting youtube stop');
                        SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.pauseYoutubeContent();
                        break;
                }
                this.isPaused = !this.isPaused;
            }
        }
    },
    
    muteContent: function () {
        var self = this;
        self.setPlayerMuteState(!self.isMuted);
        self.applyPlayerMuteState();
    },
    
    showPlayer: function (content) {
        if (contentProviderList.indexOf(content) > -1) {
            for (var index = 0; index < contentProviderList.length; index++) {
                if (contentProviderList[index] == content) {
                    $(document.getElementById(contentProviderList[index] + 'Player')).show();
                } 
                else {
                    $(document.getElementById(contentProviderList[index] + 'Player')).hide();
                };
            };
        }
        else {
            console.log("Invalid content provider passed to showPlayer: " + content);
        }
    },
    
    
    hidePlayer: function () {
        for (var index = 0; index < contentProviderList.length; index++) {
            $(document.getElementById(contentProviderList[index] + 'Player')).hide();
        };
    },
    
    // It extracts the host name from the url, trust me it works, as long as it IS a valid url. - GG
    getHostName: function (url) {
        return url.split('//')[1].split('.')[0] != 'www' ?  url.split('//')[1].split('.')[0] : url.split('//')[1].split('.')[1];
    },
    
    
    requestContentInformation: function (contentUrl) {
        var contentProvider = this.getHostName(contentUrl);
        switch (contentProvider) {
            case 'soundcloud':
                SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.getSoundCloudInfo(contentUrl);
                break;
            case 'vimeo':
                break;
            case 'youtube':
                SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.getVideoInfo(contentUrl);
                break;
            default :
                console.log('Oops, something went wrong while trying to retrieve information for : ' + contentUrl);
                break;
        };
    },
    
    receiveContentInformation: function (content) {
        if (content === null) {
            console.log('Oops, request to content provider failed. Either the url is invalid or the content provider is unavailable.');
        }
        else if (content.title === null && content.uploader === null && content.apiId === null) {
            console.log('Oops, ' + content.provider + ' does not have any information for the requested content. Are you sure ' + content.url + ' is valid?');
        }
        else {
            //this.displayContentInformation(content);
            SOCIALSOUNDSCLIENT.SOCKETIO.addContentToServer(content, usernameChat);
        }
    },
    
    displayContentInformation: function (content) {
        console.log('\nContent information successfully retrieved. ' +
                    '\nTitle:' + content.title + 
                    '\nUploader : ' + content.uploader +
                    '\nContent provider: ' + content.provider +
                    '\nUrl : ' + content.url +
                    '\napiId : ' + content.apiId + 
                    '\n'
        );
    },
    
    sendChat: function (msg) {
        SOCIALSOUNDSCLIENT.SOCKETIO.sendMessage(msg);
    },
    
    /* Not sure whether we need to keep this function. We might want to do some stuff before 
 * passing the contentUrl to the next function... just not sure what. - GG
 */
    addContentFromSearch: function (contentUrl) {
        this.requestContentInformation(contentUrl);
    },
    
    updateSocialMediaShareButtonsUrl: function () {
        this.updateFacebookShareButtonUrl();
        this.updateGoogleShareButtonUrl();
        this.updateTwitterShareButtonUrl();
    },
    
    updateFacebookShareButtonUrl: function () {
        fbShareButton.innerHTML = '<fb:share-button href="' + window.location.href + '" type="button"> </fb:share-button>';
        if (typeof (FB) !== 'undefined')
            FB.XFBML.parse(document.getElementById('fbShareButton'));
    },
    
    updateGoogleShareButtonUrl: function () {
        gpShareButton.setAttribute('data-href', window.location.href);
        gpShareButton.innerHTML = '<a class="g-plus" data-prefilltext="" data-action="share" data-annotation="none" data-height="24" data-href="' + window.location.href + '"</a>';
        gapi.plus.go();
    },
    
    updateTwitterShareButtonUrl: function () {
        twitterShareButton.innerHTML = '<a class="twitter-share-button" href="https://twitter.com/intent/tweet" data-text=" " data-url="' + window.location.href + '" data-hashtags="socialsounds">Tweet</a>';
        twttr.widgets.load();
    },
    
    getPlayerMuteState: function () {
        return this.isMuted;
    },
    
    setPlayerMuteState: function (muteState) {
        if (muteState != null) {
            this.isMuted = muteState;
        }
    },
    
    applyPlayerMuteState: function () {
        var self = this;
        if (self.getPlayerMuteState()) {
            $('#volumeOff').show();
            $('#volumeOn').hide();
        } else {
            $('#volumeOff').hide();
            $('#volumeOn').show();
        }
        if (currentContent) {
            switch (currentContent.provider) {
                case 'soundcloud':
                    SOCIALSOUNDSCLIENT.SOUNDCLOUDPLAYER.muteSoundCloudPlayer(self.getPlayerMuteState());
                    break;
                case 'vimeo':
                    break;
                case 'youtube':
                    SOCIALSOUNDSCLIENT.YOUTUBEPLAYER.muteYoutubePlayer(self.getPlayerMuteState());
                    break;
                default :
                    console.log('Oops, something went wrong while trying to mute : ' + currentContent.provider);
                    break;
            };
        }
    },
    
    renderSearchResults: function (results, provider) {
        searchResultsDropdown = document.getElementById('searchResultsDropdown');
        
        if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var li = document.createElement("LI");
                var a = document.createElement("A");
                var img = document.createElement("IMG");

                img.src = "/images/" + this.getHostName(results[i].url) + "-playlist.png";

                var textnode = document.createTextNode(" " + results[i].title);
                a.setAttribute('data-link', results[i].url);

                a.appendChild(img);
                a.appendChild(textnode);
                li.appendChild(a);
                searchResultsDropdown.appendChild(li);
            }
        }
        else {
            var li = document.createElement("LI");
            var a = document.createElement("A");
            a.text = "No Result";
            a.setAttribute('data-link', "");
            
            li.appendChild(a);
            searchResultsDropdown.appendChild(li);
        }
        document.getElementById('searchResultGroup').className += " open";
    },
    
    appendToContentList: function (content) {
        
        var id;
        if (content.provider == 'youtube') {
            id = content.apiId
        }
        else if (content.provider == 'soundcloud') {
            var arrayOfStrings = content.apiId.split('/');
            if (arrayOfStrings.length > 0) id = arrayOfStrings[arrayOfStrings.length - 1];
        }

        var htmlContent = '';
        htmlContent += '<li class="' + id + '-' + content.index + ' list-group-item"><a href="' + content.url + '" target="_blank"> <img src="/images/' + content.provider + '-playlist.png"/> ' + content.title + '</a><span class="badge" id="delBtn' + content.index + '">X</span></li>';
        $('#contentQueueListGroup').append(htmlContent);
        $('#delBtn' + content.index).hide();
    },
    
    displayContentList: function (contentList) {
        var self = this;
        $('#contentQueueListGroup').html('');
        console.log('Trying to display a content list with content list length: ' + contentList.length);
        if (contentList.length > 0) {
            for (var i = 0; i < contentList.length; i++) {
                if (contentList[i] !== null) {
                    self.appendToContentList(contentList[i]);
                }
                else {
                    console.log("content was null, not printing");
                }
            }
        }
        else {
            console.log('No content to display');
        }
        
        if (currentContent !== null) {
            this.toggleHighlightContentInList(currentContent);
        }
    },
    
    switchChannel: function (channel, password) {
        password = (password == null ? "" : password);
        SOCIALSOUNDSCLIENT.SOCKETIO.switchRoom(channel, password);
    },
    
    toggleHighlightContentInList: function (content) {
        var id;
        if (content.provider == 'youtube') {
            id = content.apiId
        }
        else if (content.provider == 'soundcloud') {
            var arrayOfStrings = content.apiId.split('/');
            if (arrayOfStrings.length > 0) {
                id = arrayOfStrings[arrayOfStrings.length - 1];
            }
        }
        var contentQueueListGroup = document.getElementById("contentQueueListGroup");
        var activeElement = contentQueueListGroup.getElementsByClassName('active');

        if (activeElement.length != 0) {
            activeElement[0].className = activeElement[0].className.replace(' active', '');
        }

        activeElement = contentQueueListGroup.getElementsByClassName(id + '-' + content.index);
        if (activeElement.length != 0) {
            activeElement[0].className = id + '-' + content.index + " list-group-item active"
        }
            
        scrollPlaylistToCurrentContent();
    },

    
};
