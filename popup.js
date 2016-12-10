console.log('popup.js loaded');

// initialize state by pulling from memory
var valuesArray = ['repostRemover', 'likesMin', 'likesMax', 'playsMin', 'playsMax', 'playlistRemover', 'keywordsActive', 'keywordsArray'];

$(document).ready(function() {
  function camelCaseToDash( myStr ) {
    return myStr.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
  }

  var initializeParameter = function(key, value) {
    console.log('key', key);
    console.log('value', value);
    var inputSelector = "#sc-filter-" + camelCaseToDash(key);

    // toggles
    if(key.indexOf('Remover') > -1 || key.indexOf('Active') > -1) {
      // initialize click selectors for buttons
      $(inputSelector).click(function() {
        $(this).toggleClass('active');
        console.log($(this));
      });
      if(value) {$(inputSelector).addClass('active');}
    }

    // inputs
    if( (key.indexOf('Max') > -1 || key.indexOf('Min') > -1) && value) {
      var inputSelector = "#sc-filter-" + camelCaseToDash(key);
      $(inputSelector).val(value);
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
      } else if(key.indexOf('Max') > -1 || key.indexOf('Min') > -1){
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
  })
});
