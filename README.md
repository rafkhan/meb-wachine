#Meb Wachine
A [web machine](https://github.com/basho/webmachine/wiki) implementation
for node.js <3


##Installation
`npm install this-isnt-on-npm-yet`


##Usage

```javascript
var Meb = require('meb-wachine');

var app = new Meb.App();

// Hello resource!
app.resource({
  path: '/ping',
  allowedMethods: [Meb.methods.GET],
  handleOk: function(req, res) { //this API WILL change
    res.write('pong');
    res.end();
  }
});

app.getServer().listen('3800');
```


##What is this Fancy *Web Machine*?
Well, I'm really not the best person to explain this. Check
[this out](https://github.com/basho/webmachine/wiki) for more
information on how Basho's webmachine implementation works.
This library is also very similar to
[liberator](http://clojure-liberator.github.io/liberator/),
a webmachine implementation in clojure.


The goal of these projects is to help expose your data in a
declaritive way as HTTP spec compliant resources.
These toolkits essentially allow you to override decisions
in a graph to create HTTP responses. Sane defaults should be
provided at each necessary step. The diagram below will help
explain how a webmachine works.

![flo chart](https://raw.githubusercontent.com/rafkhan/meb-wachine/master/diagram.png)


##Documentation
docs/


###The Default WebMachine
Check the docs :3


##Todo
- Implement all defaults
- Support for handlers other than GET (similar to liberator's `:post!`)
- Actually write a test suite!
- Investigate koa (or any connect) middleware integration
- Encoding
- Decoding
- ETAGS AND CACHING

##Testing it
`mocha`

![ayy](https://raw.githubusercontent.com/rafkhan/meb-wachine/master/boom.gif)


