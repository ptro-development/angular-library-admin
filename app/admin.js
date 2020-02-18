var myApp = angular.module('libraryAdmin', ['ng-admin', 'core', 'core.config', 'angularFileUpload']);
myApp.config(['NgAdminConfigurationProvider', function (nga, $stateProvider) {

    var injector = angular.injector(['ng', 'core.config']);
    var Config = injector.get('Config');

    // create an admin application
    var admin = nga.application('Book\'s Library Admin')
    .baseApiUrl(Config.CONFIG.API_URL + '/'); // main API endpoint

    var author = nga.entity('authors');
    author.listView().perPage(5);
    author.listView().fields([
        nga.field('id'),
        nga.field('firstName'),
        nga.field('middleName'),
        nga.field('lastName'),
        nga.field('about')
    ]);
    author.creationView().fields([
      nga.field('firstName')
        .attributes({ placeholder: 'No space allowed, 1 chars min, 25 chars max' })
        .validation({ required: true, minlength: 1, maxlength: 25 }),
      nga.field('middleName')
        .attributes({ placeholder: 'No space allowed, 1 chars min, 25 chars max' })
        .validation({ required: false, minlength: 1, maxlength: 25 }),
      nga.field('lastName')
        .attributes({ placeholder: '255 chars max' })
        .validation({ required: true, maxlength: 255 }),
      nga.field('about')
    ]);
    author.editionView().fields(author.creationView().fields());
    admin.addEntity(author);

    var publisher = nga.entity('publishers');
    publisher.listView().perPage(5);
    publisher.listView().fields([
        nga.field('id'),
        nga.field('name'),
        nga.field('address'),
        nga.field('webAddress')
    ]);
    publisher.creationView().fields([
      nga.field('name')
        .attributes({ placeholder: '1 chars min, 60 chars max' })
        .validation({ required: true, minlength: 1, maxlength: 60 }),
      nga.field('address')
        .attributes({ placeholder: 'Empty allowed' })
        .validation({ required: true, pattern: '[A-Za-z]{0,255}' }),
      nga.field('webAddress')
        .attributes({ placeholder: 'Empty allowed' })
        .validation({ validator: function(value) {
          if (value != null && valuevalue.length > 0 && value.indexOf('http://') !== 0) throw new Error ('Invalid url in website');
        }})
    ]);
    publisher.editionView().fields(publisher.creationView().fields());
    admin.addEntity(publisher);

    var book = nga.entity('books');
    book.listView().perPage(5);
    book.listView().fields([
        nga.field('id', 'number'),
        nga.field('title'),
        nga.field('isbn10'),
        nga.field('isbn13'),
        nga.field('authorId', 'reference')
          .targetEntity(author)
          .targetField(nga.field('lastName'))
          .label('Author'),
        nga.field('publisherId', 'reference')
          .targetEntity(publisher)
          .targetField(nga.field('name'))
          .label('Publisher')
    ]).listActions(['show']);

    var pictureSummary = nga.entity('picturesSummaries')
    pictureSummary.listView().perPage(5);
    pictureSummary.listView().fields([
      nga.field('id'),
      nga.field('name'),
      nga.field('pictureType'),
      nga.field('pictureSize'),
      nga.field('pageNumber'),
      nga.field('bookId'),
      nga.field('bookId', 'reference')
        .targetEntity(book)
        .targetField(nga.field('title'))
        .label('Book')

    ]).filters([
        //nga.field('q').label('').attributes({ placeholder: 'Full text' }),
        nga.field('pictureType'),
        nga.field('pictureSize')
    ]);
    pictureSummary.showView().fields([
      nga.field('id'),
      nga.field('name'),
      nga.field('pictureType'),
      nga.field('pictureSize'),
      nga.field('pageNumber'),
      nga.field('bookId', 'reference')
        .targetEntity(book)
        .targetField(nga.field('title'))
        .label('Book'),
      nga.field('Picture', 'template')
        .template('<img src="' + Config.CONFIG.API_URL + '/picturesSummaries/{{ entry.values.id }}/picture" width="100" />'),
      nga.field('custom_action').label('')
        .template('<create-picture post="entry"></create-picture>'),
      nga.field('custom_action').label('')
        .template('<delete-picture post="entry"></delete-picture>'),
    ]);
    pictureSummary.creationView().fields([
      nga.field('bookId', 'reference')
        .targetEntity(book)
        .targetField(nga.field('title'))
        .label('Book'),
      nga.field('pageNumber')
        .attributes({ required: false, placeholder: 'Number of page only if required.' }),
      nga.field('type', 'choice')
        .choices([
          { value: 'FRONT_COVER', label: 'FRONT_COVER' },
          { value: 'BACK_COVER', label: 'BACK_COVER' },
          { value: 'PAGE', label: 'PAGE' },
        ])
    ])
    admin.addEntity(pictureSummary);

    book.showView().fields([
        nga.field('title'),
        nga.field('isbn10'),
        nga.field('isbn13'),
        nga.field('authorId', 'reference')
          .targetEntity(author)
          .targetField(nga.field('lastName'))
          .label('Author'),
        nga.field('publisherId', 'reference')
          .targetEntity(publisher)
          .targetField(nga.field('name'))
          .label('Publisher'),
        nga.field('picturesSummaries', 'referenced_list')
        	.targetEntity(nga.entity('picturesSummaries'))
          .targetReferenceField('bookId')
          .targetFields([
            nga.field('id'),
            nga.field('name'),
            nga.field('pictureType'),
            nga.field('pictureSize'),
            nga.field('pageNumber')
          ])
    ]);

    book.creationView().fields([
      nga.field('title')
        .attributes({ placeholder: '1 chars min, 255 chars max' })
        .validation({ required: true, minlength: 1, maxlength: 255 }),
      nga.field('isbn10')
        .attributes({ placeholder: 'Empty allowed' })
        .validation({ validator: function(value) {
          if (value && value.length != 10) throw new Error ('Isbn10 has to have 10 numbers');
        }}),
      nga.field('isbn13')
        .attributes({ placeholder: 'Empty allowed' })
        .validation({ validator: function(value) {
          if (value && value.length != 13) throw new Error ('Isbn13 has to :{{ value }}:have 13 numbers');
        }}),
      nga.field('publisherId')
        .attributes({ required: true, placeholder: 'Id number of existing publisher.' }),
      nga.field('authorId')
        .attributes({ required: true, placeholder: 'Id number of existing author.' })
    ]);
    book.editionView().fields(book.creationView().fields());
    admin.addEntity(book);

    // attach the admin application to the DOM and execute it
    nga.configure(admin);

}]);

myApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(function() {
        return {
            request: function(config) {
                if (/\/picturesSummaries$/.test(config.url) && config.method == 'GET' && config.params._filters && config.params._filters.bookId) {
                    config.url = config.url.replace('picturesSummaries', 'books/' + config.params._filters.bookId + '/picturesSummaries');
                    delete config.params._filters;
                    delete config.params._page;
                    delete config.params._perPage;
                    return config;
                }
                if (/\/picturesSummaries$/.test(config.url) && config.method == 'POST') {
                   config['params'] = {
                      'bookId': config.data['bookId'],
                      'pageNumber': config.data['pageNumber'],
                      'type': config.data['type']
                   }
                }
                return config;
            },
        };
    });
}]);

myApp.config(['RestangularProvider', function (RestangularProvider) {
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params, httpConfig) {
        if (operation == 'getList' && (
            what == 'picturesSummaries' || what == 'books' || what == 'publishers' || what == 'authors')) {
            params._page -= 1;
        }
        return { params: params };
    });
}]);

// Create / Add picture

function createPictureController($scope, $location, FileUploader, Config, $stateParams, notification) {
    this.notification = notification;
    this.scope = $scope;
    this.pictureSummaryId = $stateParams.id;
    this.location = $location;
    $scope.pictureSummaryId = $stateParams.id;
    $scope.picture = {
      'pictureSummaryId': $stateParams.id,
    };

    $scope.uploader = new FileUploader({
      alias: 'file',
      url: Config.CONFIG.API_URL + '/picturesSummaries/' + $stateParams.id + '/picture'
    });
}

myApp.directive('createPicture', ['$location', function ($location) {
    return {
        restrict: 'E',
        scope: { post: '&' },
        template: '<a class="btn btn-default" ng-click="send()">Add picture</a>',
        link: function (scope) {
            scope.send = function () {
                $location.path('/createPicture/' + scope.post().values.id);
            };
        }
    };
}]);

createPictureController.prototype.createPicture = function() {
    this.scope.uploader.uploadAll();
    this.notification.log('Picture was sent.', {addnCls: 'humane-flatty-success'});
    this.location.path('/picturesSummaries/show/' + this.pictureSummaryId);
};

createPictureController.$inject = ['$scope', '$location', 'FileUploader', 'Config', '$stateParams', 'notification'];

var createPictureControllerTemplate =
  '<form novalidate class="picture-form">' +
    '<div class="row"><div class="col-lg-12">' +
      '<ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>' +
        '<div class="page-header">' +
          '<h1>Add a new picture for picture summary #{{ controller.pictureSummaryId }}</h1>' +
        '</div>' +
    '</div></div>' +
    '<div class="row">' +
      '<label class="col-sm-2">Picture</label>' +
      '<input type="file" nv-file-select="" class="file" data-msg-placeholder="Select File for upload..." uploader="uploader"/>' +
    '</div>' +
   '<input type="submit" ng-click="controller.createPicture()" value="Save"/>' +
  '</form>';

myApp.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('create-picture', {
        parent: 'ng-admin',
        url: '/createPicture/:id',
        params: { id: null },
        controller: createPictureController,
        controllerAs: 'controller',
        template: createPictureControllerTemplate
    });
}]);

// Delete picture

function deletePictureController($scope, $location, $http, Config, $stateParams, notification) {
    this.notification = notification;
    this.scope = $scope;
    this.id = $stateParams.id;
    this.http = $http;
    this.location = $location;
    this.url = Config.CONFIG.API_URL + '/picturesSummaries/' + $stateParams.id + '/picture';
    $scope.id = $stateParams.id;
}

deletePictureController.prototype.deletePicture = function(confirmation) {
    let notification = this.notification;
    let location = this.location;
    let id = this.id;
    if (confirmation === true) {
      this.http.delete(this.url).then(
          function successCallback(response) {
            notification.log('Picture was deleted.', {addnCls: 'humane-flatty-success'});
            location.path('/picturesSummaries/show/' + id);
          },
          function errorCallback(response) {
            notification.log('Picture was not deleted.', {addnCls: 'humane-flatty-failure'});
            location.path('/picturesSummaries/show/' + id);
          });
    } else {
       location.path('/picturesSummaries/show/' + id);
    }
};

deletePictureController.$inject = ['$scope', '$location', '$http', 'Config', '$stateParams', 'notification'];

var deletePictureControllerTemplate =
    '<div class="row"><div class="col-lg-12">' +
      '<ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>' +
        '<div class="page-header">' +
          '<h1>Are you sure you want to delete picture under summary #{{ controller.id }} ?</h1>' +
        '</div>' +
    '</div></div>' +
    '<div class="row">' +
      '<label class="col-sm-2">Picture</label>' +
      '<img src="{{ controller.url }}" width="100" />' +
    '</div>' +
    '<button class="btn btn-danger ng-scope" ng-click="controller.deletePicture(true)" translate="YES">Yes</button>' +
    '<button class="btn btn-default ng-scope" ng-click="controller.deletePicture(false)" translate="NO">No</button>';

myApp.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('delete-picture', {
        parent: 'ng-admin',
        url: '/deletePicture/:id',
        params: { id: null },
        controller: deletePictureController,
        controllerAs: 'controller',
        template: deletePictureControllerTemplate
    });
}]);

myApp.directive('deletePicture', ['$location', function ($location) {
    return {
        restrict: 'E',
        scope: { post: '&' },
        template: '<a class="btn btn-default" ng-click="delete()">Delete picture</a>',
        link: function (scope) {
            scope.delete = function () {
                $location.path('/deletePicture/' + scope.post().values.id);
            };
        }
    };
}]);
