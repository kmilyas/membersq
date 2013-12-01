jQuery.noConflict();
window.isLoggedIn = false;
var stack_topleft = {"dir1": "down", "dir2": "right", "push": "top"};
var test_vals = [{"name":"5 dollar discount","description":"aaa","point_value":100,"active":true},{"name":"Try our Taco Appetizer for Free!","description":"bbb","point_value":200,"active":true}];
var test_vals2 = [{"first_name":"John","gender":"male","last_name":"Ali","location":"Toronto"},{"first_name":"Jane","gender":"female","last_name":"Doe","location":"Boston"}];
// Checks to see if user is logged in and gets the user object

jQuery.ajax({
    url: "/sessionuser",
    type: 'GET',
    success: function(data) {
        data = jQuery.parseJSON(data);
        if(data.meta.code!=200){
            //redirecting to the main page to login
            window.isLoggedIn = false;
            window.location = "/";
        }else{
            window.isLoggedIn = true;
            mePage.personProfile(data.response.user);
            jQuery("#user_name").text(mePage.personProfile().email);
            //test business Id
            var businessId = mePage.personProfile().business_id;

            // querying to get business information
            jQuery.ajax({
                url: "/businesses/small/id/"+businessId,
                type: 'GET',
                success: function(data) {
                    data = jQuery.parseJSON(data);
                    if(data.meta.code==200){
                        mePage.businessId(data.response.business.id);
                        jQuery("#businessTitle").text(data.response.business.name);
                        //Displaying benefits first up
                        showBenefits();

                    }
                }

            });

        }
    }
});

jQuery(document).ready(function($) {
    $.pnotify.defaults.history = false;
    
     $("#profile-form").validationEngine({promptPosition : "bottomLeft", scroll: false});
      // Submits user update to their profile
    jQuery("#profileUpdateButton").click(function(){
        jQuery("#updateSuccessAlert").hide();
    });


    // Listener for toggeling tabs
    jQuery('a[data-toggle="tab"]').on('shown', function (e) {

        if(e.target.hash ==="#loyalty"){
            showBenefits();
        }else if(e.target.hash ==="#profile"){
            //jQuery("#businessList").show();
        }
        else if(e.target.hash==="#subscribers"){
            showSubscribers();
        }
    });



});


jQuery("#logout-link").click(function(){
    var ask=confirm("Are you sure you want to logout?");
    if(ask){
        jQuery.ajax({
            url: "/signout",
            type: 'GET',
            success: function(data) {
                data = jQuery.parseJSON(data);
                if(data.meta.code==200){
                    window.location = "/";
                    window.isLoggedIn = false;
                }else{
                    $.pnotify({
                        title: 'Logout Failed',
                        text: 'Sorry, There was an error signing you out. We will have it fixed soon',
                        type: 'error',
                        addclass: "stack_topleft",
                        stack: stack_topleft
                    });

                }
            }
        });

    }

});

function showBenefits(){
    jQuery.ajax({
        url: "/businesses/listbenefits?"+
            "business_id="+mePage.businessId()+"&person_id="+mePage.personProfile()._id,
        type: 'GET',

        success: function(data) {
            mePage.benefitsList([]);
            data = jQuery.parseJSON(data);
            if(data.meta.code!=200){
                console.log("Error code:"+data.meta.code);
            }else{
                mePage.benefitsList(data.response.benefits);

            }
        }
    });

}

function showSubscribers(){
    jQuery.ajax({
        url: "/businesses/listsubscribers?"+
            "business_id="+mePage.businessId()+"&person_id="+mePage.personProfile()._id,
        type: 'GET',

        success: function(data) {
            data = jQuery.parseJSON(data);
            if(data.meta.code!=200){
                console.log("Error code:"+data.meta.code);
            }else{
                mePage.subscriberList(data.response.subscribers);

            }
        }
    });
}


//Knockoutjs models
function mePageViewModel() {
    // Data
    var self = this;
    self.personProfile = ko.observable(new Object());
    self.businessId =ko.observable();
    self.subscriberList = ko.observableArray();
    self.benefitsList = ko.observableArray();
    self.countries = membersq.vars.countries_list;
    self.selectedCountry = ko.observable();
    self.states = membersq.vars.states_list;
    self.selectedState = ko.observable();
    // Behaviours
    self.removeSubscriber = function(person){

    };
    self.addPoints = function(person){

    };
    self.removePoints = function(person){

    };
    self.addBenefit = function(person){

    };
    self.editBenefit = function(person){

    };
    self.deleteBenefit = function(person){

    };

};

var mePage = new mePageViewModel();
ko.applyBindings(mePage);