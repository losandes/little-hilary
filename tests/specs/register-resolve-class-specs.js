(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when an es6 class is registered with no dependencies or arguments,': {
                // facory: class {}
                'hilary should execute the constructor when it\'s resolved': function () {
                    var scope = hilary.scope(id.createUid(8)),
                        registration1;

                    // when
                    registration1 = scope.register({
                        name: 'regfunc1',
                        factory: class {
                            constructor() {
                                this.hello = 'world';
                            }
                        }
                    });

                    expect(registration1.isException).to.equal(undefined);
                    expect(scope.resolve('regfunc1').hello).to.equal('world');
                }
            },
            'when es6 classes are registered,': {
                // facory: class {}
                'hilary should be able to resolve modules': function () {
                    // given
                    var scope = hilary.scope(id.createUid(8), { logging: { level: 'info' } }),
                        actual;

                    scope.register({
                        name: 'regfunc1',
                        factory: class {
                            constructor() {
                                this.foo = 'bar';
                            }
                        }
                    });

                    scope.register({
                        name: 'regfunc2',
                        dependencies: ['regfunc1'],
                        factory: class {
                            constructor(f1) {
                                this.f1 = f1;
                                this.hello = 'world';
                            }
                        }
                    });

                    scope.register({
                        name: 'regfunc3',
                        dependencies: ['regfunc1', 'regfunc2'],
                        factory: class {
                            constructor(f1, f2) {
                                this.f1 = f1;
                                this.f2 = f2;
                                this.chaka = 'khan';
                            }
                        }
                    });

                    scope.register({
                        name: 'regfunc4',
                        dependencies: ['regfunc1', 'regfunc2', 'regfunc3'],
                        factory: class {
                            constructor (f1, f2, f3) {
                                this.f1 = f1;
                                this.f2 = f2;
                                this.f3 = f3;
                            }
                        }
                    });

                    // when
                    actual = scope.resolve('regfunc4');

                    // then
                    expect(actual.f1.foo).to.equal('bar');
                    expect(actual.f2.hello).to.equal('world');
                    expect(actual.f3.chaka).to.equal('khan');
                    expect(actual.f2.f1.foo).to.equal('bar');
                    expect(actual.f3.f1.foo).to.equal('bar');
                    expect(actual.f3.f2.hello).to.equal('world');
                }
            },
            'when es6 classes are registered with undeclared dependencies,': {
                // facory: class {}
                'hilary should discover the dependencies': function () {
                    var scope = hilary.scope(id.createUid(8), { logging: { level: 'info' } }),
                        registration1,
                        registration2;

                    // when
                    registration1 = scope.register({ name: 'regfunc1', factory: class {
                        constructor() {
                            this.foo = 'bar';
                        }
                    }});

                    registration2 = scope.register({
                        name: 'regfunc2',
                        factory: class {
                            constructor(regfunc1) {
                                this.f1 = regfunc1;
                                this.hello = 'world';
                            }
                        }
                    });

                    expect(registration1.isException).to.equal(undefined);
                    expect(registration2.isException).to.equal(undefined);
                    expect(scope.resolve('regfunc2').f1.foo).to.equal('bar');
                }
            },
            'when an es6 class is registered with a different number if dependencies and args,': {
                // factory: function (arg1) {} INCORRECT NUMBER OF ARGS
                'it should return an exception': function () {
                    var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});
                    expect(scope.register({
                        name: 'testdepmismatch',
                        dependencies: ['arg1', 'arg2'],
                        /* jshint -W098 */
                        factory: class {
                            constructor (arg1) {}
                        }
                        /* jshint +W098 */
                    }).isException).to.equal(true);
                }
            },
            'when an es6 class is registered with dependencies that are not an array,': {
                // factory: function (arg1) {} INCORRECT NUMBER OF ARGS
                'it should return an exception': function () {
                    var scope = hilary.scope(id.createUid(8), { logging: { log: function () {}}});
                    expect(scope.register({
                        name: 'testdepmismatch',
                        dependencies: 'foobar',
                        /* jshint -W098 */
                        factory: class {
                            constructor (arg1) {}
                        }
                        /* jshint +W098 */
                    }).isException).to.equal(true);
                }
            },
            'when an es6 class that accepts arguments, and has an empty dependencies array, is resolved,': {
                // facory: class {}
                'hilary should return the constructor': function () {
                    // given
                    var scope = hilary.scope(id.createUid(8)),
                        Actual,
                        actual;

                    scope.register({
                        name: 'regfunc1',
                        dependencies: [],
                        factory: class {
                            constructor(arg1) {
                                this.val = arg1;
                            }
                        }
                    });

                    // when
                    Actual = new scope.resolve('regfunc1');
                    actual = new Actual('world');

                    // then
                    expect(actual.val).to.equal('world');
                }
            },
            'when an es6 class that accepts arguments, and has `false` dependencies, is resolved,': {
                // facory: class {}
                'hilary should return the constructor': function () {
                    // given
                    var scope = hilary.scope(id.createUid(8)),
                        Actual,
                        actual;

                    scope.register({
                        name: 'regfunc1',
                        dependencies: false,
                        factory: class {
                            constructor(arg1) {
                                this.val = arg1;
                            }
                        }
                    });

                    // when
                    Actual = new scope.resolve('regfunc1');
                    actual = new Actual('world');

                    // then
                    expect(actual.val).to.equal('world');
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
