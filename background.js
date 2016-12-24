function getQueryParams(encoded) {
    var params = {};
    var vars = encoded.split('&');
    vars.forEach(variable => {
      var pair = variable.split('=');
      params[pair[0]] = pair[1];
    });
    return params;
}

chrome.permissions.getAll(function(all) {console.log(all)})
chrome.webRequest.onCompleted.addListener(function(details) {
  console.log(details);
  // $('.collectionSection').prepend('<h1>ASDFSDF</h1>');
  let urlParams = details.url.split('?')[1];
  console.log('params', urlParams);
  let decodedParams = getQueryParams(urlParams);
  console.log('decoded', decodedParams);
  chrome.storage.sync.set({client_id: decodedParams.client_id, app_version: decodedParams.app_version})

// }, urls: ['https://soundcloud.com/you/following']})
}, {urls: ["https://api-v2.soundcloud.com/users/*"]})
