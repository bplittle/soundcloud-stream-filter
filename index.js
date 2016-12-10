(function () {
    'use strict';

    // var valuesArray = ['repostRemover', 'likesMin', 'likesMax', 'playsMin', 'playsMax', 'playlistRemover', 'keywordsActive', 'keywordsArray'];
    var valuesArray = ['repostRemover', 'playlistRemover'];


    var _trackList, _player;
    var _toggleRepostsButton = $('<button class="sc-button-repost sc-button sc-button-large sc-button-responsive"></button>');
    // var _toggleRepostsExceptions = $('<div id="toggle-reposts-exceptions">')

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      var keys = Object.keys(changes);
      for(var i=0;i<keys.length;i++) {
        var key = keys[i];
        var newValue = changes[key].newValue;
        if(key === 'repostRemover' || key === 'playlistRemover') {
          if(!newValue) {
            refreshIfStream();
          } else {
            _trackList["_" + key] = newValue;
            _trackList.internalRemoveFilteredOut();
          }
        }
      }
    });

    var refreshIfStream = function() {
      if(window.location.href.indexOf('soundcloud.com/stream') > -1) {window.location.reload();}
    };

    var TrackList = function (element) {

        var _element = element;
        var _tracks = [];
        var _that = this;
        var _trackPagingListener, that = this;
        this._repostRemover = false;
        this._playlistRemover = false;


        // var repostRemover = function () {
        //     // _toggleRepostsButton.addClass('sc-button-selected');
        //     this.internalRemoveFilteredOut();
        //     _trackPagingListener.startListening();
        //     // chrome.storage.sync.set({'repostRemover': true});
        //     _player.onTrackChanged(function (tracklink) {
        //         if(!canPlay(tracklink)) {
        //             _player.next();
        //         }
        //     });
        // };

        this.startDynamicFilteringIfNeeded = function() {
          if(requiresFiltering() ) {
            that.internalRemoveFilteredOut();

            _trackPagingListener.startListening();

            _player.onTrackChanged(function (tracklink) {
                if(!canPlay(tracklink)) {
                    _player.next();
                }
            });
          }
        };

        var requiresFiltering = function() {
          return that._repostRemover || that._playlistRemover;
        };

        var endsWith = function (str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };

        var canPlay = function (tracklink) {
          var track = _tracks.find(function (track) {
              // return post.getLink() === tracklink || endsWith(tracklink, 'in=' + post.getLink().substring(1));
              return track.getLink() === trackLink;
          });
          return track && !track.isRemoved();
        };

        this.internalRemoveFilteredOut = function () {
            _tracks.forEach(function(track) {
              if(track.shouldFilter(that._repostRemover, that._playlistRemover)) {
                track.remove();
              }
            });
        };

        var getNotFiltered = function () {
            return _tracks.filter(function (track) {
                return !track.isRemoved();
            });
        };

        var getFilteredOut = function() {
          return _tracks.filter(function(track) {
            return track.isRemoved();
          });
        };

        this.init = function() {
            $('li.soundList__item', _element).each( function() {
                _tracks.push( new TrackItem( $(this) ) );
            });
            _trackPagingListener = new TrackPagingListener(_element);
            that.startDynamicFilteringIfNeeded();

            _trackPagingListener.onNextTracksLoaded(function () {
                var nextTracks = $('li.soundList__item', _element).slice(_tracks.length - getFilteredOut().length);
                nextTracks.each(function (index) {
                    _tracks.push(new TrackItem( $(this) ) );
                });
                that.internalRemoveFilteredOut();
            });
        };
        chrome.storage.sync.get(valuesArray, function(storage) {
          var keys = Object.keys(storage);
          console.log(storage);
          for(var i=0;i<keys.length;i++) {
            var key = keys[i];
            var value = storage[key];
            if(value) {that["_" + key] = value; }
            if(i === keys.length - 1) {that.init();}
          }
        });

    };

    var TrackPagingListener = function (tracklist) {

        var _trackList = tracklist;
        var _onNextTracksLoadedCallback, _running, _interval;

        this.startListening = function () {
            if (!_running) {
                var currentTracklistSize = _trackList.height();
                _interval = setInterval(function () {
                    var actualTracklistSize = _trackList.height();
                    if (actualTracklistSize > currentTracklistSize) {
                        if (_onNextTracksLoadedCallback) {
                            _onNextTracksLoadedCallback();
                        }
                        currentTracklistSize = _trackList.height();
                    }
                }, 500);
                _running = true;
            }
        };

        this.onNextTracksLoaded = function(callback) {
            _onNextTracksLoadedCallback = callback;
        };

        this.stopListening = function () {
            if (_running) {
                clearInterval(_interval);
                _running = false;
            }
        };

    };

    var Player = function (element) {

        var _element = element;
        var _lastTrack, _currentTrack, _onTrackChangedCallback, _nextControl, _prevControl, _prevDirection, _onTrackChangingInterval;

        this.onTrackChanged = function (callback) {
            _onTrackChangedCallback = callback;
        };

        this.next = function () {
            if(_prevDirection) {
                _prevControl.get(0).dispatchEvent(new Event('click'));
            } else {
                _nextControl.get(0).dispatchEvent(new Event('click'));
            }
        };

        this.stopListening = function(){
            clearInterval(_onTrackChangingInterval);
        };

        (function init() {
            _nextControl = $('button.skipControl__next', _element);
            _prevControl = $('button.skipControl__previous', _element);
            _currentTrack = $('.playControls__soundBadge a.playbackSoundBadge__title', _element).attr('href');
            _onTrackChangingInterval = setInterval(function () {
                var actualTrackLink = $('.playControls__soundBadge a.playbackSoundBadge__title', _element);
                if (actualTrackLink.length > 0) {
                    var actualTrack = actualTrackLink.attr('href');
                    if (actualTrack !== _currentTrack) {
                        if(_lastTrack === actualTrack) {
                            _prevDirection = !_prevDirection;
                        }
                        _lastTrack = _currentTrack;
                        _currentTrack = actualTrack;
                        if (_onTrackChangedCallback) {
                            _onTrackChangedCallback(_currentTrack);
                        }
                    }
                }
            }, 300);
        })();

    };

    var TrackItem = function (element) {

        var _element = element;
        var _restoreElementCopy, _repost, _removed, _link, _playlist, _likes, _reposts;

        this.remove = function () {
            if(!_removed) {
                _element.remove();
                _removed = true;
            }
        };

        this.shouldFilter = function(repostRemover, playlistRemover) {
          var removeAsRepost = repostRemover && _repost;
          var removeAsPlaylist = playlistRemover && _playlist;
          return !_removed && (removeAsPlaylist || removeAsRepost);
        };

        this.isRepost = function() { return _repost; };
        this.getLink = function() { return _link; };
        this.isPlaylist = function() { return _playlist; };
        this.isRemoved = function() { return _removed; };

        (function init() {
            _repost = $('.soundContext .sc-ministats-reposts', _element).length > 0;
            _link = $('a.soundTitle__title', _element).attr('href');
            _playlist = $('div.group').hasClass('playlist');
            _likes = $('button.sc-button-like').text();
            _reposts = $('button.sc-button-respost').text();
        })();

    };

    // var appendToggleButton = function () {
    //     // $('#filter-popup-main-container').append(_toggleRepostsButton);
    //     $('.l-tabs ul.g-tabs').append(_toggleRepostsButton);
    //     _toggleRepostsButton.wrap('<li class="g-tabs-item repost-toggle-item"></li>');
    //
    //     _toggleRepostsButton.unbind();
    // };

    var initTracklist = function (callback) {
        var waitTracksLoadedInterval = setInterval(function () {
            var tracklistElement = $('.lazyLoadingList__list', '.stream__list');
            if (tracklistElement.length > 0 && $('li', tracklistElement).length > 0) {
                _trackList = new TrackList(tracklistElement);
                clearInterval(waitTracksLoadedInterval);
                if (callback) {
                    callback();
                }
            }
        }, 100);
    };

    var init = function(){
        initTracklist(function () {
            // appendToggleButton();
            _player = new Player($('.playControls'));
        });
    };


    (function initPlugin() {
        var loc = window.location.pathname;
        setInterval(function () {
            if (loc !== window.location.pathname) {
                loc = window.location.pathname;
                if (loc === '/stream') {
                    init();
                } else {
                    _player.stopListening();
                }
            }
        }, 500);
        init();
    })();

})();
