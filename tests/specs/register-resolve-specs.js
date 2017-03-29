(function (register) {
    'use strict';

    register({
        name: 'register-resolve-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when an object literal is registered as a factory,': {
                'it should be resolvable': registerObjectLiteral,
                'and it has dependencies,': {
                    'it should log and return an exception': registerObjectLiteralWithDependencies
                }
            },
            'when a primitive (number) is registered as a factory,': {
                'it should be resolvable': registerPrimitiveNumber,
                'and it has dependencies,': {
                    'it should log and return an exception': registerPrimitiveNumberWithDependencies
                }
            },
            'when a primitive (boolean) is registered as a factory,': {
                'it should be resolvable': registerPrimitiveBoolean,
                'and it has dependencies,': {
                    'it should log and return an exception': registerPrimitiveBooleanWithDependencies
                }
            }
        };

        // factory: {}
        function registerObjectLiteral () {
            // when
            var registration = hilary.register({
                name: 'testobj',
                factory: { foo: 'bar' }
            });

            // then
            expect(registration.isException).to.equal(undefined);
            expect(hilary.resolve('testobj').foo).to.equal('bar');
        }

        // factory: {} MISMATCH
        function registerObjectLiteralWithDependencies () {
            var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

            expect(scope.register({
                name: 'testobjdep',
                dependencies: ['arg1'],
                factory: { foo: 'bar' }
            }).isException).to.equal(true);
        }

        // factory: 42
        function registerPrimitiveNumber () {
            // when
            var registration = hilary.register({
                name: 'testnum',
                factory: 42
            });

            // then
            expect(registration.isException).to.equal(undefined);
            expect(hilary.resolve('testnum')).to.equal(42);
        }

        // factory: 42 MISMATCH
        function registerPrimitiveNumberWithDependencies () {
            var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

            expect(scope.register({
                name: 'testobjdep',
                dependencies: ['arg1'],
                factory: 42
            }).isException).to.equal(true);
        }

        // factory: false
        function registerPrimitiveBoolean () {
            // when
            var registration = hilary.register({
                name: 'testbool',
                factory: false
            });

            // then
            expect(registration.isException).to.equal(undefined);
            expect(hilary.resolve('testbool')).to.equal(false);
        }

        // factory: false MISMATCH
        function registerPrimitiveBooleanWithDependencies () {
            var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});

            expect(scope.register({
                name: 'testobjdep',
                dependencies: ['arg1'],
                factory: false
            }).isException).to.equal(true);
        }

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
