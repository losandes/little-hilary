/*jshint mocha:true*/
var chai = require('chai'),
    Hilary = require('../index.js');

// globals: describe, it, xit, before, after

require('./specs/hilary-spec.js')(Hilary, describe, describe, it, xit, chai.expect);
