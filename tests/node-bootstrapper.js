/*jshint mocha:true*/
var chai = require('chai'),
    polyn = require('polyn'),
    hilary = require('../index.js'),
    skip = function (func) {
        'use strict';
        func = func || function () {};
        func.skip = true;
        return func;
    },
    ifBrowser = skip,
    ifNode = function (func) {
        'use strict';
        return func;
    },
    fail = function () { 'use strict'; chai.expect(true).to.equal(false); };

// globals: describe, it, xit, before, after

describe('hilary,', function () {
    'use strict';

    run(require('./specs/hilary-specs.js')(hilary, chai.expect, polyn.id));
    run(require('./specs/HilaryModule-specs.js')(hilary.HilaryModule, chai.expect, polyn.id, skip));
    run(require('./specs/register-resolve-specs.js')(hilary, chai.expect, polyn.id));
    run(require('./specs/register-resolve-class-specs.js')(hilary, chai.expect, polyn.id));
    run(require('./specs/register-resolve-function-specs.js')(hilary, chai.expect, polyn.id));
    run(require('./specs/register-resolve-parent-specs.js')(hilary, chai.expect, polyn.id));
    run(require('./specs/register-resolve-degrade-specs.js')(hilary, chai.expect, polyn.id, ifBrowser, ifNode));

    function run (spec) {
        var behavior;

        for (behavior in spec) {
            if (spec.hasOwnProperty(behavior)) {
                describe(behavior, runBehavior(spec[behavior]));
            }
        }
    }

    function runBehavior (behavior) {
        return function () {
            var assertion;

            for (assertion in behavior) {
                if (behavior.hasOwnProperty(assertion)) {
                    if (typeof behavior[assertion] === 'function') {
                        if (behavior[assertion].skip) {
                            xit(assertion, function () {});
                        } else {
                            it(assertion, behavior[assertion]);
                        }
                    } else {
                        describe(assertion, runBehavior(behavior[assertion]));
                    }
                }
            }

        };
    }
});
