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
            },
            'when a scope has a parent, but the parent does NOT exist,': {
                'and a module is resolved,': {
                    'it should NOT attempt to step through parent scopes': noParentRecursion
                }
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

        function noParentRecursion () {
            // given
            var scope = hilary.scope(id.createUid(8), {
                    parent: id.createUid(8),
                    logging: {
                        log: function () {}
                    }
                }),
                actual;

            // when
            actual = scope.resolve('foo');

            // then
            expect(actual.isException).to.equal(true);
            expect(actual.type).to.equal('ModuleNotFound');
            expect(actual.error.message.indexOf('foo')).to.be.above(-1);
            expect(actual.messages[0].indexOf('foo')).to.be.above(-1);
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
