var myApp = angular.module('libraryAdmin', ['ng-admin', 'core', 'core.config', 'angularFileUpload']);
myApp.config(['NgAdminConfigurationProvider', function (nga, $stateProvider) {

    var injector = angular.injector(['ng', 'core.config']);
    var Config = injector.get('Config');

    // create an admin application
    var admin = nga.application('Book\'s Library Admin')
    .baseApiUrl(Config.CONFIG.API_URL + '/'); // main API endpoint

    var author = nga.entity('authors');
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

    var picture = nga.entity('pictures');
    picture.listView().fields([
      nga.field('id'),
      nga.field('name'),
      nga.field('pictureType'),
      nga.field('bookId'),
      nga.field('bookId', 'reference')
        .targetEntity(book)
        .targetField(nga.field('title'))
        .label('Book')
    ]);
    picture.showView().fields([
      nga.field('id'),
      nga.field('name'),
      nga.field('pictureType'),
      nga.field('bookId', 'reference')
        .targetEntity(book)
        .targetField(nga.field('title'))
        .label('Book'),
      nga.field('Data', 'template')
        .template('<img src="' + Config.CONFIG.API_URL + '/pictures/{{ entry.values.id }}/data" width="100" />')
    ]);
    admin.addEntity(picture);

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
        nga.field('pictures', 'referenced_list')
        	.targetEntity(nga.entity('pictures'))
          .targetReferenceField('bookId')
          .targetFields([
            nga.field('id'),
            nga.field('name'),
            nga.field('pictureType')
          ]),
        nga.field('custom_action').label('')
          .template('<send-picture post="entry"></send-picture>')
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
                // test for /pictures?_filters={book_id:XXX}
                // http://localhost:8080/library/pictures?_filters={"bookId":7}&_page=1&_perPage=30
                if (/\/pictures$/.test(config.url) && config.params._filters && config.params._filters.bookId) {
                    config.url = config.url.replace('pictures', 'books/' + config.params._filters.bookId + '/pictures');
                    delete config.params._filters;
                    delete config.params._page;
                    delete config.params._perPage;
                }
                return config;
            },
        };
    });
}]);

function sendPictureController($scope, $location, FileUploader, Config, $stateParams, notification) {
    this.notification = notification;
    this.scope = $scope;
    this.bookId = $stateParams.id;
    this.location = $location;
    $scope.bookId = $stateParams.id;
    $scope.picture = {
      'type': "FRONT_COVER",
      'bookId': $stateParams.id
    };

    $scope.uploader = new FileUploader({
      alias: 'file',
      url: Config.CONFIG.API_URL + '/pictures'
    });

    $scope.uploader.onBeforeUploadItem = function(item) {
      item.url += '?type=' + $scope.picture.type + '&bookId=' + $scope.bookId;
    };
}

myApp.directive('sendPicture', ['$location', function ($location) {
    return {
        restrict: 'E',
        scope: { post: '&' },
        template: '<a class="btn btn-default" ng-click="send()">Add picture</a>',
        link: function (scope) {
            scope.send = function () {
                $location.path('/sendPicture/' + scope.post().values.id);
            };
        }
    };
}]);

sendPictureController.prototype.sendPicture = function() {
    this.scope.uploader.uploadAll();
    this.notification.log('Picture saved.', {addnCls: 'humane-flatty-success'});
    this.location.path('/books/show/' + this.bookId);
};

sendPictureController.$inject = ['$scope', '$location', 'FileUploader', 'Config', '$stateParams', 'notification'];

var sendPictureControllerTemplate =
  '<form novalidate class="picture-form">' +
    '<div class="row"><div class="col-lg-12">' +
      '<ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>' +
        '<div class="page-header">' +
          '<h1>Add a new picture for book #{{ controller.bookId }}</h1>' +
        '</div>' +
    '</div></div>' +
    '<div class="row">' +
      '<label class="col-sm-2">Title</label>' +
      '<lable>#{{ controller.bookId }}</label>' +
    '</div>'+
    '<div class="row">' +
      '<label class="col-sm-2">Picture type</label>' +
        '<select name="pictureTypeSelect" ng-model="picture.type">' +
          '<option value="FRONT_COVER">FRONT_COVER</option>' +
          '<option value="BACK_COVER">BACK_COVER</option>' +
        '</select>' +
    '</div>' +
    '<div class="row">' +
      '<label class="col-sm-2">Picture</label>' +
      '<input type="file" nv-file-select="" class="file" data-msg-placeholder="Select File for upload..." uploader="uploader"/>' +
    '</div>' +
    '<input type="submit" ng-click="controller.sendPicture()" value="Save"/>' +
  '</form>';

myApp.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('send-picture', {
        parent: 'ng-admin',
        url: '/sendPicture/:id',
        params: { id: null },
        controller: sendPictureController,
        controllerAs: 'controller',
        template: sendPictureControllerTemplate
    });
}]);
