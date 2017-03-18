/*jshint mocha:true*/
var chai = require('chai'),
    hilary = require('../index.js');

// globals: describe, it, xit, before, after

require('./specs/hilary-spec.js')(hilary, describe, describe, it, xit, chai.expect);
