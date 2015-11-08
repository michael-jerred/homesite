///<reference path="../../typings/tsd.d.ts"/>

module Root.States {
    class StateConfig {
        static $inject = ['$urlMatcherFactoryProvider'];
        constructor(
            $urlMatcherFactoryProvider: ng.ui.IUrlMatcherFactory) {

            $urlMatcherFactoryProvider.strictMode(false);
        }
    }

    angular.module('root.states').config(StateConfig);
}