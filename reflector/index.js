(function () {
  function request(action) {
    return fetch('https://fc.sartrey.cn/' + action)
      .then(function (response) {
        return response.json();
      });
  }

  var state = {
    client: {},
    server: {}
  };
  
  function renderCard(title, content) {
    var innerHTML = '';
    innerHTML += ('<div class="card">');
    innerHTML += ('<p class="title">' + title + '</p>');
    innerHTML += ('<p class="content">' + content + '</p>');
    innerHTML += ('</div>');
    return innerHTML;
  }

  function performRender() {
    var client = state.client;
    var server = state.server;
    var element = document.getElementById('app');
    var innerHTML = '';
    innerHTML += renderCard('User Agent', client.userAgent);
    innerHTML += renderCard('Client IP', client.IPAddress);
    innerHTML += renderCard('Network Time', new Date(server.networkTime));
    element.innerHTML = innerHTML;
  }

  request('client-info').then(function (json) {
    state.client = json;
    performRender();
  });
  request('server-info').then(function (json) {
    state.server = json;
    performRender();
  });
}());
