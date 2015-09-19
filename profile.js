
if (Meteor.isClient) {
Meteor.subscribe('images');
Session.setDefault('updatingProfile', false);

	Template.infoProfile.events({
	'click .saveProfile' : function(){
    event.preventDefault();
	Session.set('updatingProfile', false);
	}
	});

	Template.infoProfile.helpers({
// Options de connexion a l'API GOOGLE uniquement pour la partie
// adresses de location, ici on pourra jouer sur le country. Pour les autres options, regarder les données du package ou de l'API GOOGLE
  optsGoogleplace: function() {
    return {
       type: 'googleUI',
       stopTimeoutOnKeyup: false,
       googleOptions: {
         componentRestrictions: { country:'ca' }
       }
    }
  },

// données de configuration de la map qu'on affiche sur le profile
  addressesMapOptions: function() {
    // Make sure the maps API has loaded
   	var currentUser = Meteor.user();

    if (GoogleMaps.loaded()) {
      // Map initialization options
      return {
        center: new google.maps.LatLng(currentUser.profile.address1.lat,currentUser.profile.address1.lng),
        scrollwheel: false,
         // Apply the map style array to the map.
    	styles: styleArray,
        zoom: 15
      };
    }
  },

	'actuallyUpdatingProfile' : function(){
	var updatingProfile = Session.get('updatingProfile');
	return updatingProfile;
  }

});


Template.infoProfile.onCreated(function() {
  // We can use the `ready` callback to interact with the map API once the map is ready.
  GoogleMaps.ready('addressesMap', function(map) {
    // Add a marker to the map once it's ready
    var marker = new google.maps.Marker({
      position: map.options.center,
      map: map.instance
    });
  });
});


  // Specify features and elements to define styles of my map
// On peut jouer dedans...
 var styleArray = [
    {
      featureType: "all",
      stylers: [
       { saturation: -80 }
      ]
    },{
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        { hue: "#00ffee" },
        { saturation: 50 }
      ]
    },{
      featureType: "poi.business",
      elementType: "labels",
      stylers: [
        { visibility: "off" }
      ]
    }
  ];




 

	

	Template.photoProfile.helpers({
		// Permet d'afficher la photo de profile
	'getProfilePic': function () {
	var currentUser = Meteor.user();
	var profilePicId = currentUser.profile.pic;
    return IMAGES.findOne({_id:profilePicId}); // Where Images is an FS.Collection instance
  },

	'birthdayDateFormat' : function() {
	// pour s'amuser : http://momentjs.com/docs/#/displaying/from/
	// Permet de mettre la date du jour au bon format
   	var currentUser = Meteor.user();
   	var birthdayDate = moment(currentUser.profile.birthday).format('DD/MM/YYYY');
   	return birthdayDate;
	},

	'timeFromInscription' : function() {
	// pour s'amuser : http://momentjs.com/docs/#/displaying/from/
   	var currentUser = Meteor.user();
   	// CREATEDAT NE FONCTIONNE PAS. A REGLER....
   	var a = currentUser.createdAt;
  
   	console.log(a);
   	var c = moment(a).toNow();
   	console.log(c);
   	return c;
	},

	'actuallyUpdatingProfile' : function(){
	var updatingProfile = Session.get('updatingProfile');
	return updatingProfile;
  }
});

Template.profileActions.helpers({
	'actuallyUpdatingProfile' : function(){
	var updatingProfile = Session.get('updatingProfile');
	return updatingProfile;
  }
});




Template.profileActions.events({
	'click .updateProfile' : function(){
	Session.set('updatingProfile', true);
	
	},

	'click .saveProfile' : function(){
	Session.set('updatingProfile', false);
	},

	'click .suppressAccount' : function(){
	dhtmlx.message({type:"error", text:"Dumb, you thought you could leave like that ? ", expire: 1000});
	}  
});

}



if (Meteor.isServer) {
}
