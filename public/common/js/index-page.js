$(document).ready(function() {
    
	
	$('a[href*=#]').click(function() {
	    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'')
	    && location.hostname == this.hostname) {
	      var $target = $(this.hash);
	      $target = $target.length && $target
	      || $('[name=' + this.hash.slice(1) +']');
	      if ($target.length) {
	        var targetOffset = $target.offset().top;
	        $('html,body')
	        .animate({scrollTop: targetOffset}, {duration: 1000, easing: 'easeInOutExpo'});
	       return false;
	      }
	    }
	  });
	
	// Values in Forms
	$('#subForm .email').watermark();
	$('#name-field').watermark();
	$('#email-field').watermark();
	$('#phone-field').watermark();
	$('#company-field').watermark();
	$('#comments-field').watermark();
	$('#author').watermark();
	$('#email').watermark();
	$('#url').watermark();
	$('#comment').watermark();

	
	//Form Validation
	$(".theme-form").each(function() {
		$(this).validate();
	});
	
	// Display Contact Form
	$(".contact-link").click(function(){
		$(".contact-form").show();
		return false;
	})
    
   
	
	$(".scroll-top").click(function(){
        window.location = "/signup.html"
		//$('.sign-up-form input[type="email"]').stop().css("background-color", "#cbeefa");
	})
	
	
	
	/* Lock Form in Scroll */
	$('.down-tab, .reasons-wrap .theme-blurb h3 span').waypoint(function(event, direction) {
	   if (direction === 'down') {
	      $('.lock-header').animate({
		    top: '0'
		  }, 200, function() {
		    // Animation complete.
		  });
	   }
	   else {
	      $('.lock-header').animate({
		    top: '-70px'
		  }, 200, function() {
		    // Animation complete.
		  });
	   }
	});
    
    $(".signin-link").click(function(){
        window.location = "/signin.html"
	});
    
    $(".signout-link").click(function(){
        var ask=confirm("Are you sure you want to sign-out?");
        if(ask){
            jQuery.ajax({
                url: "/signout",
                type: 'GET',
                success: function(data) {
                    data = jQuery.parseJSON(data);
                    if(data.meta.code==200){
                        window.location = "/";
                       
                    }else{
                         console.log("Logout Failed:There was an error signing you out. We will have it fixed soon");
                                                   
                    }
                }
            });
    
        }

    });
	
    // 
	checkLocalLogin();
	
});

//checks to see if the user is already logged in to MembersQ
function checkLocalLogin(){
    jQuery.ajax({
        url: "/sessionuser",
        type: 'GET',
        dataType: "json",
        success: function(data) {
            if(data.meta.code!=200){
               // Not authorized
               jQuery(".signin-link").show();
               jQuery(".signout-link").hide();
               jQuery(".mypage-link").hide();
               window.isLoggedIn = false;
            }else{
                jQuery(".signin-link").hide();
                jQuery(".signout-link").show();
                jQuery(".mypage-link").show();
                
                jQuery(".user_name").text(data.response.user.email);
                window.isLoggedIn = true;
            }
        }
    });
}

