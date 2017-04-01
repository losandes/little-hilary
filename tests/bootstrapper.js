(function (require, ifBrowser, ifNode) {
    'use strict';

    var chai = require('chai'),
        polyn = require('polyn'),
        hilary = require('../index'),
        testRunner = require('./testRunner'),
        skip = function (func) {
            func = func || function () {};
            func.skip = true;
            return func;
        },
        fail = function () { chai.expect(true).to.equal(false); };

    testRunner.describe('hilary,', function () {
        testRunner.run(require('./specs/Container-specs')(hilary, chai.expect));
        testRunner.run(require('./specs/hilary-specs')(hilary, chai.expect, polyn.id, skip));
        testRunner.run(require('./specs/HilaryModule-specs')(hilary.HilaryModule, chai.expect, polyn.id, skip));
        testRunner.run(require('./specs/register-resolve-specs')(hilary, chai.expect, polyn.id));
        testRunner.run(require('./specs/register-resolve-class-specs')(hilary, chai.expect, polyn.id));
        testRunner.run(require('./specs/register-resolve-function-specs')(hilary, chai.expect, polyn.id));
        testRunner.run(require('./specs/register-resolve-parent-specs')(hilary, chai.expect, polyn.id));
        testRunner.run(require('./specs/register-resolve-degrade-specs')(hilary, chai.expect, polyn.id, ifBrowser, ifNode));
    });

}(
    (function () { // require
        'use strict';

        if (typeof module !== 'undefined' && module.exports && require) {
            return require;
        } else if (typeof window !== 'undefined') {
            return function (path) {
                if (path === '../index') {
                    return window.hilary;
                } else if (path.indexOf('./') > -1) {
                    return window.fixtures[path.replace('./', '').replace('specs/', '')];
                } else {
                    return window[path];
                }
            };
        } else {
            throw new Error('[HILARY-TESTS] Unkown runtime environment');
        }
    }()),
    (function () { // ifBrowser
        'use strict';
        if (typeof module !== 'undefined' && module.exports && require) {
            return function (func) {
                func = func || function () {};
                func.differentRuntime = true;
                return func;
            };
        } else if (typeof window !== 'undefined') {
            return function (func) {
                return func;
            };
        }
    }()),
    (function () { // ifNode
        'use strict';
        if (typeof module !== 'undefined' && module.exports && require) {
            return function (func) {
                return func;
            };
        } else if (typeof window !== 'undefined') {
            return function (func) {
                func = func || function () {};
                func.differentRuntime = true;
                return func;
            };
        }
    }())
));
