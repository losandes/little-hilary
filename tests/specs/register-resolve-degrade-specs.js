(function (register) {
    'use strict';

    register({
        name: 'register-resolve-degrade-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id, skipIfBrowser, skipIfNode) {
        return {
            'when a module is resolved,': {
                'it should gracefully degrade to require': skipIfBrowser(function () {
                    // given
                    var scope = hilary.scope(id.createUid(8), { }),
                        actual;

                    scope.register({
                        name: 'foo',
                        dependencies: ['http'],
                        factory: function (http) {
                            this.http = http;
                        }
                    });

                    // when
                    actual = scope.resolve('foo');

                    // then
                    expect(typeof actual.http.request).to.equal('function');
                }),
                'it should gracefully degrade to window': skipIfNode(function () {
                    // given
                    var scope = hilary.scope(id.createUid(8), { }),
                        moduleName = id.createUid(8),
                        actual;

                    window[moduleName] = { foo: 'bar' };

                    scope.register({
                        name: 'foo',
                        dependencies: [moduleName],
                        factory: function (onWindow) {
                            this.onWindow = onWindow;
                        }
                    });

                    // when
                    actual = scope.resolve('foo');

                    // then
                    expect(typeof actual.onWindow.foo).to.equal('bar');
                })
            }
        };
    } // /Spec

}(function (registration) {
    'use strict';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = registration.Spec;
    } else if (typeof window !== 'undefined') {
        window.fixtures = window.fixtures || {};
        window.fixtures[registration.name] = registration.Spec;
    } else {
        throw new Error('[HILARY-TESTS] Unkown runtime environment');
    }
}));
