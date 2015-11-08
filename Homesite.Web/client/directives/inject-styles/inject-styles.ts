///<reference path="../../../typings/tsd.d.ts" />

module Root.Directives.InjectStyles {
    // Add this directive to the <head> element to allow injecting stylesheets depending on the current state.
    // Currently, it makes sure all stylesheets for the state and its ancestors are loaded, so there may be some extra
    // files loaded if a child state overrides a view in one of its ancestors (typically using the '@' syntax).

    interface IScope extends ng.IScope {
        stylesheets: string[];
    }

    function getStylesheets(state: ng.ui.IState): string[] {
        var stylesheets = _(state.views).pluck<string>('stylesheet').filter(value => value !== undefined).value();
        if (state.parent) {
            return _.union(stylesheets, getStylesheets(state.parent));
        }

        return stylesheets;
    }

    function getRelatedStylesheets(allStates: ng.ui.IState[], name: string): _.LoDashImplicitArrayWrapper<string> {
        var nameFragments = name.split('.');

        var ancestorNames = _(nameFragments)
            .map((item, index, collection) => _.reduce(_.take(collection, index + 1), (acc: string, s) => acc + '.' + s))
            .value();

        return <any>(_(allStates)
            .filter(state => _.any(ancestorNames, item => item === state.name))
            .map(state => getStylesheets(state))
            .flatten());
    }

    angular.module('fm.directives').directive('injectStyles',
        ['$rootScope', '$compile', '$state',
            ($rootScope: ng.IRootScopeService, $compile: ng.ICompileService, $state: ng.ui.IStateService) => ({
                restrict: 'A',
                scope: {},
                link: (scope: IScope, element: ng.IAugmentedJQuery) => {
                    var template = '<link ng-repeat="url in stylesheets" ng-href="{{url}}" rel="stylesheet" />';
                    element.append($compile(template)(scope));
                    scope.stylesheets = [];

                    // whenever we change state, load the stylesheets for the state we are going to
                    $rootScope.$on('$stateChangeStart', (event: any, toState: ng.ui.IState) => {
                        scope.stylesheets = getRelatedStylesheets($state.get(), toState.name)
                            .union(scope.stylesheets)
                            .value();
                    });

                    // removes any stylesheets that are no longer needed (we want to keep all stylesheets there during transitions)
                    $rootScope.$on('$stateChangeSuccess', (event: any, toState: ng.ui.IState) => {
                        scope.stylesheets = getRelatedStylesheets($state.get(), toState.name).value();
                    });
                }
            })]);
}
