/*jshint mocha:true*/
var chai = require('chai'),
    polyn = require('../index.js'),
    is = polyn.is,
    id = polyn.id,
    async = polyn.async,
    Exception = polyn.Exception,
    Blueprint = polyn.Blueprint,
    Immutable = polyn.Immutable,
    objectHelper = polyn.objectHelper,
    ObjectID = require('bson').ObjectID,
    // is = require('../src/is.js'),
    // id = require('../src/id.js'),
    // async = require('../src/async.js'),
    // Exception = require('../src/Exception.js'),
    // Blueprint = require('../src/Blueprint.js'),
    // Immutable = require('../src/Immutable.js'),
    isFixture = require('./specs/is.fixture.js'),
    idFixture = require('./specs/id.fixture.js'),
    asyncFixture = require('./specs/async.fixture.js'),
    ExceptionFixture = require('./specs/Exception.fixture.js'),
    BlueprintFixture = require('./specs/Blueprint.fixture.js'),
    ImmutableFixture = require('./specs/Immutable.fixture.js'),
    objectHelperFixture = require('./specs/objectHelper.fixture.js');

// globals: describe, it, xit, before, after

isFixture.run(is, describe, it, chai.expect);
idFixture.run(id, describe, it, chai.expect);
asyncFixture.run(async, describe, it, xit, chai.expect);
ExceptionFixture.run(Exception, describe, it, chai.expect);
BlueprintFixture.run(Blueprint, ObjectID, id, is, describe, it, chai.expect, beforeEach, afterEach);
ImmutableFixture.run(Immutable, describe, it, chai.expect, beforeEach, afterEach);
objectHelperFixture.run(objectHelper, describe, it, chai.expect);
