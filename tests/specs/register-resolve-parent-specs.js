(function (register) {
    'use strict';

    register({
        name: 'register-resolve-parent-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when a module is resolved, synchronously,': {
                'it should step through parent scopes until it finds a match':
                    syncParentRecursion
            },
            'when a module is resolved, asynchronously,': {
                'it should step through parent scopes until it finds a match':
                    asyncParentRecursion
            }
        };

        function syncParentRecursion () {
            // given
            var grandparent = hilary.scope('gp-' + id.createUid(8)),
                parent = hilary.scope('p-' + id.createUid(8), { parent: grandparent }),
                scope = hilary.scope(id.createUid(8), { parent: parent }),
                actual;

            grandparent.register({
                name: 'foo',
                factory: { foo: 'bar' }
            });

            // when
            actual = scope.resolve('foo');

            // then
            expect(actual.foo).to.equal('bar');
        }

        function asyncParentRecursion (done) {
            // given
            var grandparent = hilary.scope('gp-' + id.createUid(8)),
                parent = hilary.scope('p-' + id.createUid(8), { parent: grandparent }),
                scope = hilary.scope(id.createUid(8), { parent: parent });

            grandparent.register({
                name: 'foo',
                factory: { foo: 'bar' }
            });

            // when
            scope.resolve('foo', function (err, actual) {
                // then
                expect(actual.foo).to.equal('bar');
                done();
            });
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
