(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when an object literal is registered as a factory,': {
                // factory: {}
                'it should be able to resolve modules': function () {
                    // when
                    var registration = hilary.register({
                        name: 'testobj',
                        factory: { foo: 'bar' }
                    });

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(hilary.resolve('testobj').foo).to.equal('bar');
                },
                'and it has dependencies,': {
                    // factory: {} MISMATCH
                    'it should log and return an exception': function () {
                        var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

                        expect(scope.register({
                            name: 'testobjdep',
                            dependencies: ['arg1'],
                            factory: { foo: 'bar' }
                        }).isException).to.equal(true);
                    }
                }
            },
            'when a number is registered,': {
                // factory: 42
                'it should be able to resolve modules': function () {
                    // when
                    var registration = hilary.register({
                        name: 'testnum',
                        factory: 42
                    });

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(hilary.resolve('testnum')).to.equal(42);
                },
                'and it has dependencies,': {
                    // factory: {} MISMATCH
                    'it should log and return an exception': function () {
                        var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

                        expect(scope.register({
                            name: 'testobjdep',
                            dependencies: ['arg1'],
                            factory: 42
                        }).isException).to.equal(true);
                    }
                }
            },
            'when a boolean is registered,': {
                // factory: false
                'it should be able to resolve modules': function () {
                    // when
                    var registration = hilary.register({
                        name: 'testbool',
                        factory: false
                    });

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(hilary.resolve('testbool')).to.equal(false);
                },
                'and it has dependencies,': {
                    // factory: {} MISMATCH
                    'it should log and return an exception': function () {
                        var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

                        expect(scope.register({
                            name: 'testobjdep',
                            dependencies: ['arg1'],
                            factory: false
                        }).isException).to.equal(true);
                    }
                }
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
