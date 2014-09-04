#Meb Wachine
A [web machine](https://github.com/basho/webmachine/wiki) implementation
for node.js <3


##Installation
`npm install this-isnt-on-npm-yet`


##Usage

```javascript
var Meb = require('meb-wachine');

var app = new Meb();

// Hello resource!
app.resource({
  path: '/hello',
  handleOk: function(req, ctx) {
    return {hello: 'world!'};
  }
});

app.getServer().listen('3800');
```

