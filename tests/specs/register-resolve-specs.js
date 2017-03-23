(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when a single module with no dependencies is registered with an object literal,': {
                'it should be able to resolve modules': function () {
                    // given
                    var name = id.createUid(8);

                    // when
                    var registration = hilary.register({ name: name, factory: { foo: 'bar' } }),
                        actual = hilary.resolve(name);

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(actual.foo).to.equal('bar');
                }
            },
            'when a single module with no dependencies is registered with a function,': {
                'it should be able to resolve modules': function () {
                    var name = id.createUid(8),
                        scope = hilary.scope(id.createUid(8), { logging: { level: 'info' } }),
                        registration,
                        actual;

                    // when
                    registration = scope.register({ name: name, factory: function () {
                        return { foo: 'bar' };
                    }});
                    actual = scope.resolve(name);

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(actual.foo).to.equal('bar');
                }
            },
            'when a single module with dependencies is registered,': {
                'it should be able to resolve modules': function (done) {
                    var scope = hilary.scope(id.createUid(8), { logging: { level: 'info' } }),
                        registration1,
                        registration2,
                        registration3,
                        registration4;

                    // when
                    registration1 = scope.register({ name: 'regfunc1', factory: function () {
                        return { foo: 'bar' };
                    }});
                    registration2 = scope.register({
                        name: 'regfunc2',
                        dependencies: ['regfunc1'],
                        factory: function (f1) {
                            return {
                                f1: f1,
                                hello: 'world'
                            };
                        }
                    });
                    registration3 = scope.register({
                        name: 'regfunc3',
                        dependencies: ['regfunc1', 'regfunc2'],
                        factory: function (f1, f2) {
                            return {
                                f1: f1,
                                f2: f2,
                                chaka: 'khan'
                            };
                        }
                    });
                    registration4 = scope.register({
                        name: 'regfunc4',
                        dependencies: ['regfunc1', 'regfunc2', 'regfunc3'],
                        factory: function (f1, f2, f3) {
                            // then
                            expect(f1.foo).to.equal('bar');
                            expect(f2.hello).to.equal('world');
                            expect(f3.chaka).to.equal('khan');
                            expect(f2.f1.foo).to.equal('bar');
                            expect(f3.f1.foo).to.equal('bar');
                            expect(f3.f2.hello).to.equal('world');
                            done();
                            return true;
                        }
                    });

                    expect(registration1.isException).to.equal(undefined);
                    expect(registration2.isException).to.equal(undefined);
                    expect(registration3.isException).to.equal(undefined);
                    expect(registration4.isException).to.equal(undefined);
                    scope.resolve('regfunc4');
                }
            },
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
                        expect(hilary.register({
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
                }
            },
            'when a module with a different number if dependencies and args is registered,': {
                // factory: function (arg1) {} INCORRECT NUMBER OF ARGS
                'it should return an exception': function () {
                    // then
                    expect(hilary.register({
                        name: 'testdepmismatch',
                        dependencies: ['arg1', 'arg2'],
                        factory: function (arg1) {}
                    }).isException).to.equal(true);
                }
            },
            'when a module with a class is registered': {
                // facory: class {}
                'hilary should be able to resolve modules': function (done) {
                    var scope = hilary.scope(id.createUid(8), { logging: { level: 'info' } }),
                        registration1,
                        registration2,
                        registration3,
                        registration4;

                    // when
                    registration1 = scope.register({ name: 'regfunc1', factory: class {
                        constructor() {
                            this.foo = 'bar';
                        }
                    }});
                    registration2 = scope.register({
                        name: 'regfunc2',
                        dependencies: ['regfunc1'],
                        factory: class {
                            constructor(f1) {
                                this.f1 = f1;
                                this.hello = 'world';
                            }
                        }
                    });
                    registration3 = scope.register({
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
                    registration4 = scope.register({
                        name: 'regfunc4',
                        dependencies: ['regfunc1', 'regfunc2', 'regfunc3'],
                        factory: class {
                            constructor(f1, f2, f3) {
                                // then
                                expect(f1.foo).to.equal('bar');
                                expect(f2.hello).to.equal('world');
                                expect(f3.chaka).to.equal('khan');
                                expect(f2.f1.foo).to.equal('bar');
                                expect(f3.f1.foo).to.equal('bar');
                                expect(f3.f2.hello).to.equal('world');
                                done();
                            }
                        }
                    });

                    expect(registration1.isException).to.equal(undefined);
                    expect(registration2.isException).to.equal(undefined);
                    expect(registration3.isException).to.equal(undefined);
                    expect(registration4.isException).to.equal(undefined);
                    scope.resolve('regfunc4');
                }
            }

            // TODO
            // factory: function () {}
            // factory: function (arg1) {} // no deps
            // factory: function (arg1) {} // deps = false
            // factory: function (arg1) {} // deps = string
            // factory: function (arg1) {} // matching deps
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
