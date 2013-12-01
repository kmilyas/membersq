// Author: Ilyas Khawaja
/******** facebook login ***********/
window.fbAsyncInit = function() {
    FB.init({
        appId      : membersq.vars.facebookAppId, //MembersQWeb
        channelUrl : '/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });
    
    FB.Event.subscribe('auth.login', function () {
        console.log("FB User log-in event");
        //location.reload(true);
    });

     //first checks if the user is logged in locally
    checkLocalLogin();
    
    //on page load find out if user is already logged in with Facebook
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            // connected
            console.log(response);
            checkLocalLogin(response)

        } else if (response.status === 'not_authorized') {
            // not_authorized
            //checkLocalLogin();
        } else {
            // not_logged_in
           // checkLocalLogin();
        }
    });
};

function fbLogin() {
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            // connected
            loginFbUser(response.authResponse);
        }else {
            // not_logged_in
            FB.login(function(response) {
                if (response.authResponse) {
                    // connected
                    loginFbUser(response.authResponse);
                } else {
                    // cancelled
                }
            },{perms:'email'});
        }
    });
}

function loginFbUser(authObject) {
    console.log('loginFbUser()');
    /// If user doesn't exist then create a user account
    jQuery.ajax({
        url: "/authenticate",
        type: "POST",
        dataType: "json",
        data: "provider=facebook"+"&auth_token="+authObject.accessToken,
        beforeSend: function(x) {
            if (x && x.overrideMimeType) {
                x.overrideMimeType("application/j-son;charset=UTF-8");
            }
        },
        success: function(data) {
            //expect a logged in session and then redirect to mypage
            console.log(data);
            window.location.href = "/home";
        }
    });

}

//checks to see if the user is already logged in to MembersQ
function checkLocalLogin(response){
    jQuery.ajax({
        url: "/sessionuser",
        type: 'GET',
        dataType: "json",
        success: function(data) {
            if(data.meta.code!=200){
               if(response){
                    var ask=confirm("Do you want to signin with your facebook account");
                    if(ask)
                        loginFbUser(response.authResponse);
               }
            }else{
                var ask=confirm("User:"+data.response.user.email+" is already signed in. Do you want to signout this user?");
                if(ask){
                    jQuery.ajax({
                        url: "/signout",
                        type: 'GET',
                        success: function(data) {
                            data = jQuery.parseJSON(data);
                            if(data.meta.code==200){
                                //do nothing..let the user signin

                            }else{
                                alert("Sorry, There was an error signing you out. We will have it fixed soon");
                            }
                        }
                    });
                }else{
                    //user choose not to signout so redirecting to index page
                    window.location = "/";
                }
            }
        }
    });
}

// Load the SDK Asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);

}(document));



/****************/


jQuery.noConflict();    
jQuery(document).ready(function($) {
    //validating input before creating new users
    jQuery("#signup-form").validate({
        rules: {
            first_name: "required",
            last_name: "required",
            password: {
                required: true,
                minlength: 5
            },
            confirm_password: {
                required: true,
                minlength: 5,
                equalTo: "#password"
            },
            email: {
                required: true,
                email: true
            },
            agree: "required"
        },
        messages: {
            first_name: "Please enter your firstname",
            last_name: "Please enter your lastname",
            password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 5 characters long"
            },
            confirm_password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 5 characters long",
                equalTo: "Please enter the same password as above"
            },
            email: "Please enter a valid email address",
            agree: "you must check this box"
        }
    });

    jQuery(".btn").click(function() {
        if(jQuery("#signup-form").valid()){
            jQuery.ajax({
                url: "/persons",
                type: 'POST',
                data: ko.toJS(signupPage),
                dataType: "json",
                beforeSend: function(x) {
                    if (x && x.overrideMimeType) {
                        x.overrideMimeType("application/j-son;charset=UTF-8");
                    }
                },
                success: function(data) {

                    if(data.meta.code==200){
                        jQuery.ajax({
                            url: "/login",
                            type: 'POST',
                            data: "email="+signupPage.email()+"&password="+signupPage.password()+
                                    "&rememberme="+signupPage.rememberMe(),
                            success: function(data) {

                                data = jQuery.parseJSON(data);
                                if(data.meta.code==200){
                                    //a new user has been logged in
                                    window.location = "/home";
                                }else{
                                    //Error in loggin in user
                                    alert("signin failed, please check your email or password");
                                }
                            }
                        });

                    }else{
                        //Error in loggin in user
                        alert("Error: Could not create the user");
                    }
                }
            });

        }
        return false;
    });
    
    jQuery("#connectFBButton").click(function(){
        fbLogin();
    });

});




//Knockoutjs models
function signupPageViewModel() {
  // Data
  var self = this;
  self.first_name = ko.observable("");
  self.last_name = ko.observable("");
  self.email = ko.observable("");
  self.password = ko.observable("");
  self.rememberMe = ko.observable(true);

};

var signupPage = new signupPageViewModel();
ko.applyBindings(signupPage);

