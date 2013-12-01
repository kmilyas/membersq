/**
 * Created by JetBrains WebStorm.
 * User: ikhawaja
 * Date: 2/27/13
 */
/******** facebook login ***********/
window.fbAsyncInit = function() {
    FB.init({
        appId      : membersq.vars.facebookAppId, 
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
            //checkLocalLogin();
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
            window.location.href = "/merchant";
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
jQuery(document).ready(function($){

    jQuery('#login-form').submit(function (evt) {
        evt.preventDefault();
    });

    jQuery("#login-form").validationEngine({promptPosition : "topRight", scroll: false});

    jQuery("#sign-in-button").click(function(){
        if(jQuery("#login-form").validationEngine('validate') ){
            jQuery.ajax({
                url: "/login",
                type: "POST",
                dataType: "json",
                data: "email="+signInPageModel.email()+"&password="+signInPageModel.password()+
                    "&rememberme="+signInPageModel.rememberMe(),
                success: function(data) {
                    if(data.meta.code==200){
                         // redirecting to page based on user type
                        console.log(data);
                        if(data.response.user.member_type!==null && data.response.user.member_type==='merchant'){
                            window.location.href = "/merchant";
                        }else{
                            window.location.href = "/home";
                        }


                    }else{
                        //Error in log-in in user
                        alert("sign-in failed, please check your email or password");
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
function signInPageViewModel() {
    // Data
    var self = this;
    self.email = ko.observable("");
    self.password = ko.observable("");
    self.rememberMe = ko.observable(true);

}

var signInPageModel = new signInPageViewModel();
ko.applyBindings(signInPageModel);
