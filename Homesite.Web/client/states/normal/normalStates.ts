///<reference path="../../../typings/tsd.d.ts"/>

module Root.States {
    class StateConfig {
        static $inject = ['$stateProvider', '$urlRouterProvider'];
        constructor(
            $stateProvider: ng.ui.IStateProvider,
            $urlRouterProvider: ng.ui.IUrlRouterProvider) {

            var header = Root.Views.Header.view;
            var footer = Root.Views.Footer.view;

            $stateProvider
                .state('normal', {
                    abstract: true,
                    templateUrl: 'states/normal/normal-layout.html'
                })
                .state('normal.home', {
                    url: '/home',
                    views: {
                        'header': header,
                        'main': Root.Views.Normal.Main.Home.view,
                        'footer': footer
                    }
                })
                .state('normal.notFound', {
                    url: '/not-found',
                    views: {
                        'header': header,
                        //'main': Root.Views.Normal.Main.NotFound.view,
                        'footer': footer
                    }
                });

            $urlRouterProvider.when('', '/home');
            $urlRouterProvider.otherwise('/not-found');
        }
    }

    angular.module('root.states').config(StateConfig);
}