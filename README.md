#Meb Wachine
A [web machine](https://github.com/basho/webmachine/wiki) implementation
for node.js <3


##Installation
`npm install this-isnt-on-npm-yet`


##Usage

```javascript
var meb = require('package-name');

// Hello resource!
meb.resource({
  path: '/hello',
  handleOk: function(req, ctx) {
    return {hello: 'world!'};
  }
});

meb.createServer().listen('3800');
```

