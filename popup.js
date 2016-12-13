// initialize state by pulling from memory
var valuesArray = ['enabled', 'repostRemover', 'likesMin', 'likesMax', 'playsMin', 'playsMax', 'repostsMin', 'repostsMax', 'playlistRemover', 'keywordsActive', 'keywordsArray', 'likesToPlays'];
var _enabled;

console.log(chrome.permissions);
chrome.permissions.request({
  permissions: ['webRequest']
}, function(granted) {
  // The callback argument will be true if the user granted the permissions.
  if (granted) {
    chrome.webRequest.onCompleted.addListener(function(details) {
      debugger;
    }, {urls: ["*.com/stream*"]})

  } else {
    // doSomethingElse();
    console.log('not granted');
  }
});

$(document).ready(function() {
  function camelCaseToDash( myStr ) {
    return myStr.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
  }

  var initializeParameter = function(key, value) {
    if(key === 'enabled') {
      if(value) {
        _enabled = value;
        $('#enabled-state, #logo').toggleClass('active');
        $('#enabled-state, #logo').toggleClass('inactive');
      }
    } else {
      var inputSelector = "#sc-filter-" + camelCaseToDash(key);

      // toggles
      if(key.indexOf('Remover') > -1 || key.indexOf('Active') > -1) {
        // initialize click selectors for buttons
        $(inputSelector).click(function() {
          $(this).toggleClass('active');
        });
        if(value) {$(inputSelector).addClass('active');}
      }

      // inputs
      if( (key.indexOf('Max') > -1 || key.indexOf('Min') > -1 || key.indexOf('likes') > -1) && value) {
        var inputSelector = "#sc-filter-" + camelCaseToDash(key);
        $(inputSelector).val(value);
      }
    }
  }

  // initialize ux pulling data from storage
  chrome.storage.sync.get(valuesArray, function(storage) {
    console.log('storage', storage);
    for (key in storage) {
      var value = storage[key];
      initializeParameter(key, value);
    }
  });

  // click handler for sc-filter-save-settings
  $('#sc-filter-save-settings').click(function() {
    var newValues = {};
    for(var i=0; i < valuesArray.length; i++) {
      var key = valuesArray[i];
      var inputSelector = "#sc-filter-" + camelCaseToDash(key);
      if(key.indexOf('Remover') > -1 || key.indexOf('Active') > -1) {
        var value = $(inputSelector).hasClass('active');
        newValues[key] = value;
      } else if(key.indexOf('Max') > -1 || key.indexOf('Min') > -1 || key.indexOf('likes') > -1){
        var value = $(inputSelector).val();
        newValues[key] = value;
      }
      if(i === valuesArray.length - 1) {
        console.log('newValues', newValues);
        chrome.storage.sync.set(newValues, function() {
          console.log('saved!');
        });
      }
    }

  });

  $('#sc-filter-clear-settings').click(function() {
    for(var i=0; i < valuesArray.length; i++) {
      var key = valuesArray[i];
      var inputSelector = "#sc-filter-" + camelCaseToDash(key);
      $(inputSelector).removeClass('active');
      $(inputSelector).val('');
    }
  });

  $('#enabled-state').click(function() {
    chrome.storage.sync.set({enabled: !_enabled}, function(storage) {
      _enabled = !_enabled;
      $('#enabled-state, #logo').toggleClass('active');
      $('#enabled-state, #logo').toggleClass('inactive');
    });
  })

  $('#more-info-header').click(function() {
    $('#more-info').toggleClass('open');
    $(this).find('i').toggleClass('fa-chevron-down');
    $(this).find('i').toggleClass('fa-chevron-up');
  })

  var timeDiffInDays = function(time1, time2) {
    if(time1 && time2) {
      return (new Date(time1) - new Date(time2) ) / 1000 / 60 / 60 / 24;
    } else {return false;}
  }
});
