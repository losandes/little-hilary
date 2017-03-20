/*jshint mocha:true*/
var chai = require('chai'),
    hilary = require('../index.js'),
    fail = function () { 'use strict'; chai.expect(true).to.equal(false); };

// globals: describe, it, xit, before, after

require('./specs/hilary-specs.js')(hilary, describe, describe, it, xit, chai.expect, fail);
require('./specs/register-resolve-specs.js')(hilary, describe, describe, it, xit, chai.expect, fail);
