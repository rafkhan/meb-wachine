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
  allowedMethods: [Meb.methods.GET],
  handleOk: function(req, res) { //this API WILL change
    res.write('pong');
    res.end();
  }
});

app.getServer().listen('3800');
```


##Testing it
`mocha` ayy

![ayy](https://raw.githubusercontent.com/rafkhan/meb-wachine/master/boom.gif)


