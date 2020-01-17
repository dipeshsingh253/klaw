'use strict'

// confirmation of delete
// edit 
// solution for transaction
// message store / key / gui
var app = angular.module('indexApp',[]);

app.controller("indexCtrl", function($scope, $http, $location, $window) {
	
	// Set http service defaults
	// We force the "Accept" header to be only "application/json"
	// otherwise we risk the Accept header being set by default to:
	// "application/json; text/plain" and this can result in us
	// getting a "text/plain" response which is not able to be
	// parsed. 
	$http.defaults.headers.common['Accept'] = 'application/json';
	$scope.showServerStatus = "false";

        $scope.getClusterApi = function() {

            $http({
                method: "GET",
                url: "getClusterApiStatus",
                headers : { 'Content-Type' : 'application/json' }
            }).success(function(output) {
                $scope.clusterapi = output;
            }).error(
                function(error)
                {
                    $scope.alert = error;
                }
            );
        };

        $scope.getEnvs = function() {
            if($scope.showServerStatus == "false")
                return;

            $http({
                method: "GET",
                url: "getEnvsStatus",
                headers : { 'Content-Type' : 'application/json' }
            }).success(function(output) {
                $scope.allenvs = output;
                $scope.showProgressBar = "false";
            }).error(
                function(error)
                {
                    $scope.alert = error;
                }
            );
        };


        $scope.onShowServerStatus = function(){
            $scope.showServerStatus = "true";
            $scope.showProgressBar = "true";
        }

        $scope.getSchemaRegEnvs = function() {

        if($scope.showServerStatus == "false")
            return;

            $http({
                method: "GET",
                url: "getSchemaRegEnvsStatus",
                headers : { 'Content-Type' : 'application/json' }
            }).success(function(output) {
                $scope.allschenvs = output;
            }).error(
                function(error)
                {
                    $scope.alert = error;
                }
            );

          }

          $scope.onClickRefresh = function(){
                $scope.showServerStatus = "false";
                $scope.showProgressBar = "false";
          }

           $scope.getAuth = function() {
           	$http({
                   method: "GET",
                   url: "getAuth",
                   headers : { 'Content-Type' : 'application/json' }
               }).success(function(output) {
                   $scope.statusauth = output.status;
                   $scope.userlogged = output.username;
                   $scope.teamname = output.teamname;
                   $scope.kafkawizeversion = output.kafkawizeversion;
                    $scope.notifications = output.notifications;
                    $scope.notificationsAcls = output.notificationsAcls;
                   $scope.statusauthexectopics = output.statusauthexectopics;
                   $scope.alerttop = output.alertmessage;
                   if(output.companyinfo == null){
                       $scope.companyinfo = "Company not defined!!";
                   }
                   else
                       $scope.companyinfo = output.companyinfo;

                   if($scope.userlogged != null)
                       $scope.loggedinuser = "true";
               }).error(
                   function(error)
                   {
                       $scope.alert = error;
                   }
               );
       	}

        $scope.logout = function() {
            //alert("onload");
            $http({
                method: "GET",
                url: "logout"
            }).success(function(output) {

                $location.path('/');
                $window.location.reload();
            }).error(
                function(error)
                {
                    $scope.alert = error;
                }
            );
        }


}
);