/**
 * Edition field for a file - a file uploader.
 *
 * @example <ma-file-field field="field"></ma-file-field>
 */
export default function maFileField(Upload) {
    return {
        scope: {
            'field': '&',
            'value': '='
        },
        restrict: 'E',
        link: {
            pre: function(scope) {
                var uploadInformation = scope.field().uploadInformation();
                if (!uploadInformation.hasOwnProperty('url')) {
                    throw new Error('You must provide a URL property to allow the upload of files.');
                }

                scope.multiple = uploadInformation.hasOwnProperty('multiple') ? uploadInformation.multiple : false;
                scope.accept = "*";
                if (uploadInformation.hasOwnProperty('accept')) {
                    scope.accept = uploadInformation.accept;
                }
                scope.apifilename = uploadInformation.hasOwnProperty('apifilename') ? uploadInformation.apifilename : false;

                var files = scope.value ? scope.value.split(',') : [];
                scope.files = {};
                for (var file in files) {
                    scope.files[files[file]] = {
                        "name": files[file],
                        "progress": 0
                    };
                }
            },
            post: function(scope, element) {
                var field = scope.field();
                scope.name = field.name();
                scope.v = field.validation();
                if (scope.value) {
                    scope.v.required = false;
                }
                var input = element.find('input')[0];
                var attributes = field.attributes();
                for (var name in attributes) {
                    input.setAttribute(name, attributes[name]);
                }

                scope.fileSelected = function(selectedFiles) {
                    if (!selectedFiles || !selectedFiles.length) {
                        return;
                    }

                    var uploadParams;

                    scope.files = {};
                    for (var file in selectedFiles) {
                        uploadParams = angular.copy(scope.field().uploadInformation());
                        uploadParams.file = selectedFiles[file];
                        var succ = uploadParams.success || function(){ return true; };
                        var err = uploadParams.error || function(){ return true; };
                        Upload
                            .upload(uploadParams)
                            .progress(function(evt) {
                                scope.files[evt.config.file.name] = {
                                    "name": evt.config.file.name,
                                    "progress": Math.min(100, parseInt(100.0 * evt.loaded / evt.total))
                                };
                            })
                            .success(function(data, status, headers, config) {
                                if(succ(data, status, headers, config, scope) !== false){
                                    scope.files[config.file.name] = {
                                        "name": scope.apifilename ? data[scope.apifilename] : config.file.name,
                                        "progress": 0
                                    };
                                    if (scope.apifilename) {
                                        var apiNames = Object.keys(scope.files).map(function(fileindex) {
                                            return scope.files[fileindex].name;
                                        });
                                        scope.value = apiNames.join(',');
                                    } else {
                                        scope.value = Object.keys(scope.files).join(',');
                                    }
                                }
                            })
                            .error(function(data, status, headers, config) {
                                if(err(data, status, headers, config, scope) !== false){
                                    delete scope.files[config.file.name];

                                    scope.value = Object.keys(scope.files).join(',');
                                }
                            });
                    }
                };

                scope.selectFile = function () {
                    input.click();
                };
            }
        },
        template:
`<div class="row">
    <div class="col-md-2">
        <a class="btn btn-default" ng-click="selectFile()">
            <span translate="BROWSE"></span>
        </a>
    </div>
    <div class="col-md-10">
        <div class="row" ng-repeat="file in files track by $index">
            <div class="col-md-3" style="padding-top: 6px;">
                <div class="progress" style="margin-bottom: 0;" ng-if="file.progress">
                    <div class="progress-bar" role="progressbar" aria-valuenow="{{ file.progress }}" aria-valuemin="0" aria-valuemax="100" style="width: {{ file.progress }}%;">
                        <span class="sr-only" translate="N_COMPLETE" translate-values="{ progress: file.progress }"></span>
                    </div>
                </div>
            </div>
            <div class="col-md-9" style="padding-top: 6px;"><small><em>{{ file.name }}<em><small></div>
        </div>
    </div>
</div>
<input type="file" ngf-multiple="multiple" accept="{{ accept }}" ngf-select="fileSelected($files)"
       id="{{ name }}" name="{{ name }}" ng-required="v.required" style="display:none" />`
    };
}

maFileField.$inject = ['Upload'];
