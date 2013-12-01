jQuery.noConflict();
window.geoObject = null;
window.isLoggedIn = false;
var geocoder =  new google.maps.Geocoder();
var browserSupportFlag =  new Boolean();
var stack_topleft = {"dir1": "down", "dir2": "right", "push": "top"};

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
            myPage.personProfile(data.response.user);
            myPage.subscribedBusinesses(myPage.personProfile().business_subscriptions);
            jQuery("#user_name").text(myPage.personProfile().email);

            getGeoLocation();
            
        }
    }
});

jQuery(document).ready(function($) {
    $.pnotify.defaults.history = false;
    
    // Enables validation on profile form
    $("#profile-form").validationEngine({promptPosition : "bottomLeft", scroll: false});
    
    // Submits user update to their profile
    jQuery("#profileUpdateButton").click(function(){
        jQuery("#updateSuccessAlert").hide();
        //valdiates the form values are correct
        if($("#profile-form").validationEngine('validate')){
              
            var myObject = {
                    id:myPage.personProfile()._id,
                    first_name:myPage.personProfile().first_name,
                    last_name:myPage.personProfile().last_name,
                    gender:myPage.personProfile().gender,
                    phone:myPage.personProfile().phone,
                    location:myPage.personProfile().location,
                    date_of_birth:{
                        day:myPage.personProfile().date_of_birth.day,
                        month:myPage.personProfile().date_of_birth.month,
                        year:myPage.personProfile().date_of_birth.year
                    }
                };

             jQuery.ajax({
                url: "/persons",
                data : myObject,
                type: 'PUT',
                success: function(data) {
                    data = jQuery.parseJSON(data);
                    if(data.meta.code===200){
                        //myPage.personProfile(data.response.user);
                        jQuery("#updateSuccessAlert").show();
                    }else{
                       jQuery.pnotify({
                                        title: 'Update Failed',
                                        text: 'Profile could not be updated',
                                        addclass: "stack_topleft",
                                        stack: stack_topleft
                                    });
                    }
                }
            });

         }

    });
    
    //initializing modal dialogues
    jQuery("#subscription-modal").dialog({
        resizable: true,
        minHeight: 300,
        minWidth: 320,
        modal: true,
        autoOpen: false,
        position: { my: "center", at: "center", of: window }

    });

    jQuery("#qr-modal").dialog({
        resizable: false,
        height: 400,
        width: 360,
        modal: true,
        autoOpen: false,
        position: { my: "center", at: "center", of: window }
    });

    $( "#dialog-confirm-modal" ).dialog({
        resizable: false,
        height:210,
        modal: true,
        autoOpen: false,
        buttons: {

        }
    });

    

    // Listener for toggeling tabs
    jQuery('a[data-toggle="tab"]').on('shown', function (e) {

        if(e.target.hash =="#discover"){
            $('#localTab a[href="#businessList"]').tab('show');
            jQuery("#businessList").show();
        }else if(e.target.hash =="#businessList"){
            jQuery("#businessList").show();
        }
        else if(e.target.hash =="#businessMap"){
            jQuery("#businessList").hide();
            initializeMap();
        }else if(e.target.text=="#subscription"){

        }

    });

    //initialize multiselect widget
    $("#search-tags").multiselect({
        selectedList: 3,
        noneSelectedText: 'Choose business types'
    }).multiselectfilter();
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

// listener for search nearby button
jQuery("#search-local-button").click(function(){
    searchLocal();
});

// listener for search button
jQuery("#search-button").click(function(){
    myPage.localBusinesses([]);
   
    var myParams = "query="+encodeURIComponent(myPage.searchLocalQuery())+
        "&ll="+encodeURIComponent(window.geoObject.latitude)+","+encodeURIComponent(window.geoObject.longitude)+
        "&limit="+10+"&radius="+16000+"&categoryId="+myPage.chosenCategories().toString().replace(/\,/g,"|");
    
    jQuery.ajax({
        url: "/business/search?"+myParams,
        type: 'GET',
        success: function(data) {
            data = jQuery.parseJSON(data);
            for(var i=0; i<data.response.businesses.length;i++){
                var newBusiness = data.response.businesses[i];
                //adding property to identify business on the list and MAP
                newBusiness.alpha =  String.fromCharCode('A'.charCodeAt() + i);
                myPage.localBusinesses.push(newBusiness);
                var matchedID =findStringInArray(myPage.subscribedBusinesses(), newBusiness._id);
                if(matchedID!==null){
                    jQuery('span[title="'+matchedID+'"]').html("<i class='icon-ok'></i><small><em>subscribed</em></small>");
                }

            }
        }
    });
        
    jQuery('#localTab a[href="#businessList"]').tab('show');
    jQuery("#businessList").show();
});


//Show QR in a modal dialog
jQuery("#qr-button").click(function(){
    jQuery('#qr-modal').html("");
    jQuery('#qr-modal').qrcode({
        render: 'div',
        width: 320,
        height: 320,
        text: myPage.personProfile().email});
    jQuery("#qr-modal").dialog("open");
});

// Gets geolocation from browser

function getGeoLocation(){
    // Try W3C Geolocation (Preferred)
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      window.geoObject = position.coords;
      codeLatLng(window.geoObject.latitude,window.geoObject.longitude);
     
      // calling search by default once geo location is figured out
      searchLocal(50, "mi");
      
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }
  
  function handleNoGeolocation(errorFlag) {
    if (errorFlag === true) {
      jQuery.pnotify({
        title: "Can't find Location",
        text: 'Geolocation service failed.',
        type: 'info',
        addclass: "stack_topleft",
        stack: stack_topleft
      });
      //jQuery("#top-search").attr("placeholder","Find places");
       jQuery("#top-info").text("Could not find current location");
      
    } else {
      //jQuery("#top-search").attr("placeholder","Find places near ");
       jQuery("#top-info").text("Could not find current location");
      jQuery.pnotify({
        title: "Can't find Location",
        text: "Your browser doesn't support geolocation",
        type: 'info',
        addclass: "stack_topleft",
        stack: stack_topleft
      });
      
    }
  }
}

//converts latlong to location using google maps api
function codeLatLng(lat,lng) {

    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[1]) {
                //jQuery("#top-search").attr("placeholder","Find places near "+results[1].formatted_address);
                jQuery("#top-info").text("Find places near "+results[1].formatted_address);
            }
        } else {
            jQuery.pnotify({
                    title: "Can't find Location",
                    text: "Geocoder failed due to: " + status,
                    addclass: "stack_topleft",
                    stack: stack_topleft
            });
            
        }
    });
}

var infowindow = new google.maps.InfoWindow({
    content: ""
});

function initializeMap() {
    /*
    var mapOptions = {
        center: new google.maps.LatLng(window.geoObject.latitude,window.geoObject.longitude),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);
    */
    var markerValues = [];
    for(var i=0;i<myPage.localBusinesses().length;i++){
        markerValues.push({latLng:[myPage.localBusinesses()[i].locations[0].lat,myPage.localBusinesses()[i].locations[0].lng],
            data:myPage.localBusinesses()[i].name,
            options: {
                icon: "common/img/green_Marker"+String.fromCharCode('A'.charCodeAt() + i) +".png"
            }});
    }
    //adding marker for current location
    markerValues.push({latLng:[window.geoObject.latitude,window.geoObject.longitude],
        data:"ME",
        options: {
            icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
        }});
    //destroy existing map to refresh
    jQuery('#map-canvas').gmap3('destroy');
    jQuery('#map-canvas').gmap3({
        map:{
            options:{
                center: [window.geoObject.latitude,window.geoObject.longitude],
                zoom: 10,
                disableDefaultUI: true,
                panControl:true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true

            }
        },

        marker:{
            values: markerValues,
            options: {
                draggable: false
            },
            events:{
                click: function(marker, event, context){

                    var map = jQuery(this).gmap3("get");
                    if (infowindow){
                        infowindow.close();
                        infowindow.open(map, marker);
                        infowindow.setContent(context.data);
                    }

                }
            },
            cluster:{
                radius: 100,

                0: {
                    content: "<div class='cluster cluster-1'>CLUSTER_COUNT</div>",
                    width: 53,
                    height: 52
                },
                20: {
                    content: "<div class='cluster cluster-2'>CLUSTER_COUNT</div>",
                    width: 56,
                    height: 55
                },
                50: {
                    content: "<div class='cluster cluster-3'>CLUSTER_COUNT</div>",
                    width: 66,
                    height: 65
                }
            }
        }

    });
}


// Show the modal page with business information
function showBusinessModal(businessId){
    jQuery.ajax({
        url: "/businesses/small/id/"+businessId,
        type: 'GET',
        success: function(data) {
            data = jQuery.parseJSON(data);
            if(data.meta.code==200){
                myPage.businessProfile(data.response.business);
                jQuery.ajax({
                    url: "/businesses/listbenefits?"+
                        "business_id="+myPage.businessProfile().id+"&person_id="+myPage.personProfile()._id,
                    type: 'GET',

                    success: function(data) {
                        myPage.businessBenefits([]);
                        data = jQuery.parseJSON(data);
                        if(data.meta.code!=200){
                            console.log("Error code:"+data.meta.code);
                            jQuery("#subscription-modal").dialog("open");
                        }else{
                            if(data.response.benefits.length>0){
                                myPage.businessBenefits(data.response.benefits);
                                //myPage.businessBenefits(test_benefits);
                            }
                            jQuery("#subscription-modal").dialog("open");
                        }
                    }
                });




            }
        }

    });
}

function findStringInArray(myArray, key){
    var foundObj = jQuery.grep(myArray, function(obj) {
        return obj.business_id === key;
    })
    if(foundObj.length>0){
        if(foundObj[0].active) //checks if subscription is active
            return foundObj[0].business_id;
        else
            return null;
    }else{
        return null;
    }
}


function searchLocal(radius, unit){
    //initializing values if passed
    if(radius){
        myPage.selectedRadius(radius);
    }
    if(unit){
        myPage.selectedRadiusUnit(unit);
    }
    
    jQuery("#noResultAlert").hide();
    var myParams = 
        "ll="+encodeURIComponent(window.geoObject.latitude)+","+encodeURIComponent(window.geoObject.longitude)+
        "&limit="+10+"&radius="+myPage.selectedRadius()+"&unit="+myPage.selectedRadiusUnit();
   
    jQuery.ajax({
        url: "/businesses/nearby?"+myParams,
        type: 'GET',
        success: function(data) {
            data = jQuery.parseJSON(data);
            if(data.response.businesses.length>0){
                myPage.localBusinesses([]);
                for(var i=0; i<data.response.businesses.length;i++){
                    var newBusiness = data.response.businesses[i];
                    //adding property to identify business on the list and MAP
                    newBusiness.alpha =  String.fromCharCode('A'.charCodeAt() + i);
                    myPage.localBusinesses.push(newBusiness);
                    var matchedID =findStringInArray(myPage.subscribedBusinesses(), newBusiness._id);
                    if(matchedID!==null){
                        jQuery('span[title="'+matchedID+'"]').html("<i class='icon-ok'></i><small><em>subscribed</em></small>");
                    }
    
                }
            }else{
                jQuery("#noResultAlert").show();
            }
        }
    });
    
    jQuery('#localTab a[href="#businessList"]').tab('show');
    jQuery("#businessList").show();
}

//Home page view model
function myPageViewModel() {
    // Data
    var self = this;
    self.searchLocalQuery = ko.observable();
    self.subscribedBusinesses = ko.observableArray();
    self.localBusinesses = ko.observableArray();
    self.personProfile = ko.observable(new Object());
    self.businessProfile = ko.observable(new Object());
    self.availableRadius =membersq.vars.searchRadius;
    self.selectedRadius = ko.observable();
    self.availableRadiusUnits =membersq.vars.radiusUnits;
    self.selectedRadiusUnit = ko.observable();
    self.businessBenefits = ko.observableArray();
    
     /*
    self.availableCategories = membersq.vars.business_types;
    self.chosenCategories = ko.observableArray();
    */
    
    // Behaviours

    self.dob = ko.computed({ //Computed date of birth for display on the form
        read: function (){
            if((self!=null) && (self.personProfile().date_of_birth!=undefined)){

                return (self.personProfile().date_of_birth.year + "-" +self.personProfile().date_of_birth.month
                    + "-" + self.personProfile().date_of_birth.day);
            }
            return "";
        },
        write: function (value) {
            var lastSlashPos = value.lastIndexOf("-");
            var firstSlashPos = value.indexOf("-");
                        
            self.personProfile().date_of_birth.year = value.substring(0, firstSlashPos); // Update "year"
            self.personProfile().date_of_birth.month = value.substring(firstSlashPos+1,lastSlashPos); // Update "month"
            self.personProfile().date_of_birth.day = value.substring(lastSlashPos + 1); // Update "year"
            

        }
    });

    self.loadBusiness = function(business) {
        var b_id = business.business_id || business._id;
        showBusinessModal(b_id);
    };

    self.subscribeToBusiness = function(business){

        var ask=confirm("Do you want to subscribe to "+business.name+" ?");
        if(ask){
            jQuery.ajax({
                url: "/businesssubscription",
                type: 'POST',
                data: "person_id="+myPage.personProfile()._id+"&business_id="+business._id+"&business_name="+business.name,
                success: function(data) {
                    data = jQuery.parseJSON(data);
                    if(data.meta.code==200){
                        myPage.subscribedBusinesses.push({"business_id":business._id,"business_name":business.name,"active":true});
                        jQuery('span[title="'+business._id+'"]').html("<i class='icon-ok'></i><small><em>subscribed</em></small>");
                    }else{
                         jQuery.pnotify({
                            title: 'Subscription Failed',
                            text: 'Error:business could not be subscribed to!',
                            addclass: "stack_topleft",
                            stack: stack_topleft
                         });
                    }
                }
            });

        }

    };

    self.unsubscribe = function(business){
        jQuery("#dialog-confirm-text").text("You will be unsubscribed from "+business.business_name+". Are you sure?")
        jQuery("#dialog-confirm-modal").dialog( "option", "title", "Remove Subscription" );
        jQuery( "#dialog-confirm-modal" ).dialog( "option", "buttons",
            [{text: "Remove",
                click: function() {
                    jQuery.ajax({
                            url: "/businesssubscription",
                            type: 'DELETE',
                            data: "person_id="+myPage.personProfile()._id+"&business_id="+business.business_id,
                            success: function(data) {
                                data = jQuery.parseJSON(data);
                                if(data.meta.code==200){
                                    console.log(myPage.subscribedBusinesses.remove(function(item) { return item.business_id ===  business.business_id }));
                                }else{
                                    jQuery.pnotify({
                                        title: 'Remove Failed',
                                        text: 'Error:business could not be removed',
                                        addclass: "stack_topleft",
                                        stack: stack_topleft
                                    });
                                }
                                
                            }
                        });
                    jQuery( this ).dialog( "close" );
                }
            },
            {text : "Cancel",
                click: function() {
                        jQuery( this ).dialog( "close" );
                      }

            }
            ]
        );

        jQuery("#dialog-confirm-modal").dialog("open");

    };

    self.openMapLink = function(business){
        var link = 'http://maps.google.com/maps?q='+encodeURIComponent(business.locations[0].street)+
        ","+encodeURIComponent(business.locations[0].city)+","+encodeURIComponent(business.locations[0].state_prov_code);
        window.open(link,'_blank');

    }

};

var myPage = new myPageViewModel();
ko.applyBindings(myPage);