(function () {
  String.prototype.contains = function contains(text) {
    return this.indexOf(text) > -1;
  }

  Array.prototype.contains = function contains(item) {
    return this.indexOf(item) > -1;
  }

  function URLRef(source, depth) {
    this.source = source;
    this.URL = null;
    this.queryItems = [];
    this.depth = depth || 0;
    this.errors = [];
    this.isURL = true;
    this.isSafeURL = true;
    this.isStrictSafeURL = true; // RFC1808、RFC1738、RFC2732
  }
  
  URLRef.prototype = {
    parseSource: function parseSource() {
      try {
        this.URL = new URL(this.source);
      } catch (error) {
        this.URL = null;
        this.isURL = false;
        this.isSafeURL = false;
        this.isStrictSafeURL = false;
      }
      if (this.URL) {
        var fixedURLString = this.URL.toString();
        if (fixedURLString === this.source) {
          this.isSafeURL = true;
        }
        if (fixedURLString === this.source + '/') {
          this.isSafeURL = true;
        }
        var queryItems = [];
        var searchStart = this.source.indexOf('?');
        if (searchStart < 0) return;
        var search = this.source.slice(searchStart);
        if (search) {
          var queries = search.slice(1).split('&').map(function (e) {
            if (!e) {
              // todo - throw error
              this.isStrictSafeURL = false;
              return;
            }
            var i = e.indexOf('=');
            if (i < 0) {
              this.isStrictSafeURL = false;
              return [e]; // only key
            }
            return [e.slice(0, i), e.slice(i + 1)];
          }).filter(Boolean);
          for (var pair of queries) {
            var queryItem = new QueryRef(pair[0], pair[1]);
            console.log(pair[0], '=', pair[1])
            queryItem.parseSource();
            queryItems.push(queryItem);
          }
        }
        this.queryItems = queryItems;
      }
    },
  };
  
  
  
  function QueryRef(key, value) {
    this.key = key;
    this.value = value;
    this.isSafeQuery = false;
    this.errors = [];
  }
  
  function isLessEncoded(text) {
    var expect = text.replace(/%/g, '%25');
    return encodeURIComponent(text) !== expect;
  }
  
  function isOverEncoded(text) {
    try {
      var decode = decodeURIComponent(text);
      if (decode === text) return false;
      var encode = encodeURIComponent(decode);
      return encode !== text;
    } catch (error) {
      console.error(error);
      // todo - maybe edge case
      return false;
    }
  }
  
  QueryRef.prototype = {
    parseSource: function () {
      this.errors = [];
      if (isLessEncoded(this.key)) {
        this.errors.push('less-encoded-key');
      }
      if (isOverEncoded(this.key)) {
        this.errors.push('over-encoded-key');
      }
      if (isLessEncoded(this.value)) {
        this.errors.push('less-encoded-value');
      }
      if (isOverEncoded(this.value)) {
        this.errors.push('over-encoded-value');
      }
      this.isSafeQuery = this.errors.length === 0;
    }
  };


  function decodeToURL(text) {
    var decode = text;
    while (true) {
      try {
        new URL(decode);
        break;
      } catch (error) {
        var oldDecode = decode;
        decode = decodeURIComponent(decode);
        if (oldDecode === decode) {
          return null;
        }
      }
    }
    return decode;
  }

  function tryParseURL(text, depth) {
    var model = [];
    if (!text) return [];
    var ref = new URLRef(text, depth);
    ref.parseSource();
    ref.queryItems.forEach(function (queryItem) {
      var decodedValueToURL = decodeToURL(queryItem.value);
      if (decodedValueToURL) {
        if (!queryItem.isSafeQuery) {
          ref.isStrictSafeURL = false;
          // URL NEVER over-encoded
          var i = queryItem.errors.indexOf('over-encoded-value');
          if (i > -1) {
            queryItem.errors.splice(i, 1);
          }
        }
        var subModel = tryParseURL(decodedValueToURL, depth + 1);
        subModel.forEach(e => model.push(e));
      }
    });
    model.unshift(ref);
    return model;
  }



  var state = {
    input: '',
    model: []
  };

  function changeInput(e) {
    var value = e.target.value;
    console.log(value);
    state.model = tryParseURL(value, 0);
    performRender();
  }

  function renderBadge(state, content) {
    return '<span class="' + (state ? 'success' : 'failure') + '">' + content + '</span>';
  }

  function renderURLRef(model) {
    var output = '<div class="card">'
      + '<div class="head">' + model.source + '</div>'
      + '<div class="test">'
      + '<span class="primary">Depth ' + (model.depth + 1) + '</span>'
      + renderBadge(model.isURL, 'URL')
      + renderBadge(model.isSafeURL, 'Safe')
      + renderBadge(model.isStrictSafeURL, 'Strict-Safe')
      + '</div>'
      + '<table><thead><th>key</th><th>value</th></thead><tbody>';
    model.queryItems.forEach(function (queryItem) {
      output += ('<tr><td>'
        + '<span>' + queryItem.key + '</span>'
        + (queryItem.errors.contains('less-encoded-key') ? renderBadge(false, 'Less-Encoded') : '')
        + (queryItem.errors.contains('over-encoded-key') ? renderBadge(false, 'Over-Encoded') : '')
        + '</td><td>'
        + '<span>' + queryItem.value + '</span>'
        + (queryItem.errors.contains('less-encoded-value') ? renderBadge(false, 'Less-Encoded') : '')
        + (queryItem.errors.contains('over-encoded-value') ? renderBadge(false, 'Over-Encoded') : '')
        + '</td></tr>');
    });
    if (model.queryItems.length === 0) {
      output += ('<tr><td> - </td><td> - </td></tr>');
    }
    output += '</tbody></table>';
    output += '</div>';
    return output;
  }

  function performRender() {
    var model = state.model;
    console.log(model);
    var element = document.getElementById('result');
    var innerHTML = '';
    model.forEach(function (item) {
      innerHTML += renderURLRef(item);
    });
    element.innerHTML = innerHTML;
  }

  // main
  document.getElementById('input').addEventListener('input', changeInput);
}());
