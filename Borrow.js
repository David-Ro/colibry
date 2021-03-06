if (Meteor.isClient) {
// SUBSCRIBE PHYSICAL BOOKS POUR RÉCUPÉRER TOUTES LES INFOS SUR LES LIVRES
	Meteor.subscribe('allAvailableBooks');
  	// Dans cette session se trouve l'ID (BOOK_INFOS) du bouquin sur lequel l'utilisateur a cliqué
  	Session.setDefault('chosenBookId', "");
  	Session.setDefault('position', "");


		// envoie l'information de quel radio button est sélectionné. Cette fonction permet à la carte de savoir ou centrer
  		function fromWhere(){  
    	if(document.getElementById('bhome').classList.contains('active'))
    	{return "home";}
    	if(document.getElementById('bwork').classList.contains('active'))
    	{return "work";}
    	if(document.getElementById('bposition').classList.contains('active'))
    	{return "position";}
    	else {return "error";}
		}

 // fonction qui permet de dessiner un cercle sur la carte en question
  // 3 arguments : le om de la map, l'addresse à encercler ainsi que la couleur (rouge pour personal et bleu pour work)
  	function setCircle(map,address, color) {
  	var addressCircles = new google.maps.Circle({
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: color,
      fillOpacity: 0.35,
      map: map.instance,
      center: {lat: address.lat, lng: address.lng},
      radius: 80
  	  });
  		}


/////// TEMPLATE displayChosenBook EVENTS //////////////
	Template.displayChosenBook.events({
  	'click .borrowButton':function()
  	{
  	  	var currentUserId = Meteor.userId();
  	document.getElementById("input_sender_Id").value = currentUserId;
  	document.getElementById("input_recipient_Id").value = this.bookOwner;
	document.getElementById("input_book_Id").value = this.bookRef;
	document.getElementById("input_physicalBook_Id").value = this._id;

}	
	}); // Fin EVENTS template displayChosenBook




// Fonctions events sur le template borrow
Template.borrow.events({ 
  'submit form': function(event, template) {
    event.preventDefault();


    swal({
		        title: "Borrow a book?",
		        text: "Send an email to borrow this book?",
		        type: "success",
		        showCancelButton: true,
		        confirmButtonColor: "#DD6B55",
		        confirmButtonText: "Yes!",
		        closeOnConfirm: true
		    }, function () {
		       toastr.options = {  "closeButton": true,  "debug": false,  "progressBar": true,  "preventDuplicates": false,  "positionClass": "toast-top-right","onclick": null,"showDuration": "400","hideDuration": "1000","timeOut": "1500","extendedTimeOut": "1000","showEasing": "swing","hideEasing": "linear", "showMethod": "fadeIn","hideMethod": "fadeOut"};
		    toastr.success("E-mail sent!");
		  var now = new Date();
		  			// Récupère l'ID d'entrée dans la DB pour ensuite l'écrire sur l'autre DB conversation
				    var mailbox_Id = Meteor.call(
				    'sendMail',
				    event.target.input_sender_Id.value,
					event.target.input_recipient_Id.value,
				  	event.target.input_book_Id.value,
				  	event.target.input_physicalBook_Id.value,
				  	now,
				  	now,
				  	true,
				  	false,
				  	"waiting"); 

				    //Puis ajoute le message dans le chat
				    Meteor.call(
				    'addChat',
				    mailbox_Id,
				    event.target.input_sender_Id.value,
					event.target.input_recipient_Id.value,
				    now,
				    event.target.InputMessage.value
				    ); 


			Router.go('mailbox');

    	});
    

	}
  });




/////// TEMPLATE DISPLAYSearch EVENTS //////////////
	Template.displaySearch.events({
  	'click':function()
  	{
  	var currentUser = Meteor.user();
  	// on vient créer une variable classDoc dans laquelle on rentre les class de l'objet qui vient d'être cliqué !
    var classDoc = event.target.classList;
    //si on a cliqué sur une image dont la class est "thumb-books", alors on affiche l'explication
      if (classDoc.contains('thumb-books') == true)
     {
  	var currentUserId = Meteor.userId();
      // si on clique sur un livre de sa bibliothèque, la fonction met l'ID du livre de la DB informationBooks dans la variable selectedPhysicalBook (afin que celui ci soit affiché)
    var selectedBook = this.__originalId;
    Session.set('chosenBookId', selectedBook);


    // Initie les ronds lorsqu'on clique sur un des bouquins
    // Cherche dans PhysicalBooks les owners de ce bouquin
    var thisBookLenders = [];
    PHYSICAL_BOOKS.find({/*bookOwner:{$ne:currentUser._id},*/bookRef:selectedBook,status:"1"}).forEach(function(element){
    	thisBookLenders.push(element.bookOwner);});

    var lendersAddresses = [];
	Meteor.users.find({_id:{ $in:thisBookLenders}}).forEach(function(element) 
	{
 	lendersAddresses.push({
		address1:{
			lat : element.profile.address1.lat,
 			lng : element.profile.address1.lng
		},
		address2:{
			lat : element.profile.address2.lat,
 			lng : element.profile.address2.lng
		}}
		);

     });

		GoogleMaps.ready('booksMap', function(map) {
			for (var nb in lendersAddresses){
				var addressCircles = new google.maps.Circle({
		      strokeColor: '#FF0000',
		      strokeOpacity: 0.8,
		      strokeWeight: 1,
		      fillColor: '#FF0000',
		      fillOpacity: 0.35,
		      map: map.instance,
		      center: {lat: lendersAddresses[nb].address1.lat, lng: lendersAddresses[nb].address1.lng},
		      radius: 80
		  	  });
			//setCircle(map,lendersAddresses[nb].address1, '#FF0000');
			//setCircle(map,lendersAddresses[nb].address2, '#000080');
			}
 		});
 	} /// FIN DU IF SI ON CLIQUE SUR Un THUMB Book

     else
     {
      //si on a pas cliqué sur une image alors l'explication sur le livre disparait !
    Session.set('chosenBookId', "");
     } 
 	}	
	}); // Fin EVENTS template Borrow

	// Lors de la création de la carte

Template.booksMap.onCreated(function(){
	GoogleMaps.ready('booksMap', function(map){

		/*
		// Avant tout, on lance la localisation de l'utilisateur pour savoir ou il est !
		Location.getGPSState(success, failure, options);
		Location.locate(function(pos){
  		 console.log("Got a position!", pos);
  		 Session.set('position',pos);
			}, function(err){
 	  console.log("Oops! There was an error", err);
		});
*/
		//Session.get('usersWhoShareCoordinatesSession').forEach(function(coordinates){
		// récupère mes infos perso
		var currentUser = Meteor.user();
		// récupère l'info de quel radio button est checked
		var from = fromWhere();
		// Mer un marker home si home est checked
		if (currentUser.profile.address1 && from =="home")
		{new google.maps.Marker({
		draggable: false,
		animation: google.maps.Animation.DROP,
		position: new google.maps.LatLng(currentUser.profile.address1.lat,currentUser.profile.address1.lng),
		title:"Home",
		map: map.instance
		});}
		// Met un marker work si work est checked
		if (currentUser.profile.address2 && from =="work")
		{new google.maps.Marker({
		draggable: false,
		animation: google.maps.Animation.DROP,
		position: new google.maps.LatLng(currentUser.profile.address2.lat,currentUser.profile.address2.lng),
		title:"Work",
		map: map.instance
		});}

		});

	}); // Fin Template



/////////////// TEMPLATE Des radios buttons ////////////
Template.locationRadioButtons.onRendered( function(){
	var currentUser = Meteor.user();

	// address1 et adress2 existent
	if (currentUser.profile.address1 && currentUser.profile.address2)
	{
	document.getElementById('bhome').classList.add('active');
	}
	// seule adress2 existe
	else if (currentUser.profile.address1 === undefined && currentUser.profile.address2 === undefined)
	{
	document.getElementById('bhome').classList.add('hidden');
	document.getElementById('bwork').classList.add('hidden');
	document.getElementById('bposition').classList.add('active');
	}
	
	else if (currentUser.profile.address1 === undefined)
	{
	document.getElementById('bhome').classList.add('hidden');
	document.getElementById('bwork').classList.add('active');
	}
	// seule adress1 existe
	else if (currentUser.profile.address2 === undefined)
	{
	document.getElementById('bwork').classList.add('hidden');
	document.getElementById('bhome').classList.add('active');
	}
	// si aucune des 2 adresses n'est renseignée
		
});

Template.locationRadioButtons.helpers({
	
}); // Fin Template



/////////////// TEMPLATE DE LA MAP = booksMap ////////////


Template.booksMap.helpers({
	booksMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // Map initialization options
      // on récupère l'info sur quel est le radio button qui est actif èa travers la fonction fromWhere()
      var from = fromWhere();
      // on récupère les infos de l'utilisateur actuellement connecté
      var currentUser = Meteor.user();
    if (from == "home")
     	{return {scrollwheel: false,
     		center: new google.maps.LatLng(currentUser.profile.address1.lat,currentUser.profile.address1.lng),
        zoom: 14};
    	}
    if (from == "work")
     	{return {scrollwheel: false,
     		center: new google.maps.LatLng(currentUser.profile.address2.lat,currentUser.profile.address2.lng),
        zoom: 14};
    	}
    if (from == "position")
     	{// A DEFINIR
     	return {scrollwheel: false,
     		center: new google.maps.LatLng(currentUser.profile.address1.lat,currentUser.profile.address1.lng),
        zoom: 14};
    	}
      
    }
  },

  'usersCoordinates': function(){
		// Récupère l'ID du livre choisi et sauvegarde dans un tableau les utilisateurs qui peuvent le prêter
		// pour l'instant la fonction renvoie les coordonnées des utilisateurs qui peuvent prêter
		// setting dans une session également au cas où une sytaxe paticulière demanderai l'appel d'une session plutôt que d'une fonction
		var chosenBookId = Session.get('chosenBookId');
		// recupération des ID des users qui peuvent partager
		var userWhoCanShare = [];
			PHYSICAL_BOOKS.find({bookRef:chosenBookId, status:"1"}).forEach(function(element) {userWhoCanShare.push(element.bookOwner);});
		Session.set('usersWhoShareSession',userWhoCanShare);
		// recupération des coordonnées des users récupérés dans la ligne du dessus
		var userWhoCanShareCoordinates = [];
		Meteor.users.find({
			_id: {
				$in : userWhoCanShare
			}
		}).forEach(function(element) {
			userWhoCanShareCoordinates.push({
				lat : element.profile.address1.lat,
				lng : element.profile.address1.lng
			});
		});

		Session.set('usersWhoShareCoordinatesSession',userWhoCanShareCoordinates);

		return userWhoCanShareCoordinates;
	}
  
}); // fin template

// https://developers.google.com/maps/documentation/javascript/examples/layer-fusiontables-simple
Template.booksMap.onCreated(function(){
	//setBorrowMap();
});


	Template.displayAvailableBooks.helpers({
    // Fonctions pour montrer toutes les infos des livres de PHYSICAL_BOOKS qui ont un statut 1
  		'availableBooks': function(){  
   		 var differentBooks = [];
   		 PHYSICAL_BOOKS.find({status:"1"}).forEach(function(element) {differentBooks.push(element.bookRef);});
   		 // renvoi les infos des livres dont les id sont contenus dans le tableau précédent
   		 return BOOKS_INFOS.find({_id:{ $in:differentBooks}});
   		 }
  	});

  	Template.displaySearch.events({
    	// Recuperation de la valeur recherchée par l'utilisateur
    	/*'submit form': function(event){
   	 		event.preventDefault();
   	 		//passage à true de tryTosearch pour valider qu'une recherche est effectuée
   	 		Session.set('tryToSearch', true);
   	 		var tryToSearch = Session.get('tryToSearch');
   	 		console.log(tryToSearch);
   	 		var searchedBookVar1 = event.target.searchedBook.value;
   	 		// on met la valeur recherchée dans searchedBookSession pour ouvoir la rappeler ensuite avec un Get
   	 		Session.set('searchedBookSession',searchedBookVar1);		
   	 	},*/

   	 	'change #home' : function(){
   	 		setBorrowMap();
   	 	},
   	 	'change #work' : function(){
   	 		setBorrowMap();
   	 	},
   	 	'change #position' : function(){
		// lorsque je clique sur le 3 eme radio button
   	 	},
   	 	/*'click .searchBooks': function(){
			// si on clique sur un livre proposé suite à la recherche, la fonction met l'ID du livre de la DB BOOKS_INFOS dans la variable selectedBook
			var chosenBookId = this._id;
			//Affiche l'ID BOOKS_INFOS du livre
			console.log(chosenBookId);
			Session.set('chosenBook',chosenBookId);
    	}*/
	});

	Template.displaySearch.helpers({
  	// Fonction qui renvoit l'index de BOOKS_INFOS. Cette fonction est utilisée dans la recherche
	biIndex: function(){
  	return BIIndex;
  	},
  	
  	//retourne les attributs de mon boutton EasySearch load more
  	moreButtonAttributes:function(){
  	return {'class':'btn btn-primary'};
  	}
	});

///////////// HELPERS POUR LE TEMPLATE searchBar ////////////////

  	Template.searchBar.helpers({
	// Fonction qui renvoit l'index de BOOKS_INFOS. Cette fonction est utilisée dans la recherche
	biIndex: function(){
  	return BIIndex;
  	},

	//retourne les attributs de mon input easySearch
  	inputAttributes: function(){
  	return {'class':'form-control', 'placeholder':'Search for a book in your neighbourhood ...'};
  	}
  	});

  

	Template.displaySearchedBooks.helpers({

		searchInAllAvailableBooks: function() {
		// Fonction pour montrer les llivres en base de donnée qui correspondent à la recherche par titre
		// on récupère la valeur recherchée
		var searchedBookVar2 = Session.get('searchedBookSession');
		// on renvoie la liste des des livres dont le titre correspond
		// la regex permet de ne pas tenir compte de la casse
   		return BOOKS_INFOS.find({title:{
                     $regex : new RegExp(searchedBookVar2, "i") }});
		},

		tryToSearch: function() {
    		return Session.get('tryToSearch');
  		}
	});

	Template.displayChosenBook.helpers({
		'myChosenBook': function(){
			// Récupère l'ID du livre choisi par l'utilisateur (sur lequel on a cliqué)
			var chosenBookId = Session.get('chosenBookId');
			// renvoie toutes les infos sur le livre
			return BOOKS_INFOS.findOne({_id:chosenBookId});
		},
		'usersWhoShareIt': function(){
			// Récupère l'ID du livre choisi par l'utilisateur (sur lequel on a cliqué) et renvoi la liste des physcal books correspondant
			var chosenBookId = Session.get('chosenBookId');
			return PHYSICAL_BOOKS.find({bookRef:chosenBookId, status:"1"});
		},
		'userInfos': function(){
		// Cette fonction 
		// On met dans une variable
		var bookOwner = this.bookOwner;
		var actualUser = Meteor.users.findOne({_id:bookOwner});
		
		// Distance jusqu'à l'add 1 et l'add 2
		var distanceToAdd1 = 1000000;
		var distanceToAdd2 = 1000000;
		var currentUser = Meteor.user();
		var from = fromWhere();
		// si actualUser existe	
	if (actualUser)
	{
		// Si le radio option = home
		if (from == "home"){
			if (currentUser.profile.address1 && actualUser.profile.address1.lat)
				{
				distanceToAdd1 = nearByLocation.getDistance({
				latA: currentUser.profile.address1.lat,
				latB: actualUser.profile.address1.lat,
				lngA: currentUser.profile.address1.lng,
				lngB: actualUser.profile.address1.lng
				});
				}
			if (currentUser.profile.address1 && actualUser.profile.address2.lat)
				{
				distanceToAdd2 = nearByLocation.getDistance({
				latA:currentUser.profile.address1.lat,
				latB: actualUser.profile.address2.lat,
				lngA: currentUser.profile.address1.lng,
				lngB: actualUser.profile.address2.lng
				});
				}
		}
		if (from == "work"){
			if (currentUser.profile.address2 && actualUser.profile.address1.lat)
				{
				distanceToAdd1 = nearByLocation.getDistance({
				latA: currentUser.profile.address2.lat,
				latB: actualUser.profile.address1.lat,
				lngA: currentUser.profile.address2.lng,
				lngB: actualUser.profile.address1.lng
				});
				}
			if (currentUser.profile.address2 && actualUser.profile.address2.lat)
				{
				distanceToAdd2 = nearByLocation.getDistance({
				latA: currentUser.profile.address2.lat,
				latB: actualUser.profile.address2.lat,
				lngA: currentUser.profile.address2.lng,
				lngB: actualUser.profile.address2.lng
				});
				}
		}
		if (from == "position"){
		// calculer la distance depuis ma position
		// var distance = nearByLocation.getDistance({})
		}

	
		// On calcule qui est le plus proche.
		if (distanceToAdd1.distance > distanceToAdd2.distance) 
		{
			if (distanceToAdd2.distance > 1) 
			{	
			return {firstName:actualUser.profile.firstName,distance:distanceToAdd2.distance.toFixed(1),unit:"km"};
			}
			else
			{
			var distanceFinale = distanceToAdd1.distance*1000;
			return {firstName:actualUser.profile.firstName,distance:distanceFinale.toFixed(0),unit:"m"};
			}
		}
		else 
		{	// on met en mètre si c'est inférieur à 1 km
			if (distanceToAdd1.distance > 1) 
			{	
			return {firstName:actualUser.profile.firstName,distance:distanceToAdd1.distance.toFixed(1),unit:"km"};
			}
			else
			{
			var distanceFinale = distanceToAdd1.distance*1000;
			return {firstName:actualUser.profile.firstName,distance:distanceFinale.toFixed(0),unit:"m"};
			}
		}
		
	}
	else
	{
	return {firstName:"User unavailable",distance:"0", unit:"m"};
	}
	}
	});
	
}


if (Meteor.isServer) {
	// fonction publish qui renvoit la liste de tous les livres available, quel que soit l'utilisateur
	Meteor.publish('allAvailableBooks',function(){
    return PHYSICAL_BOOKS.find({status: "1"});
  });


  Meteor.methods({
		  'sendMail': function(sender_Id,recipient_Id,book_Id,physicalBook_Id,createdAt,lastDiscussionDate,readBySender,readByRecipient,status){
		  
		  MAILBOX.insert({
		  	sender_Id: sender_Id,
		  	recipient_Id: recipient_Id,
		  	book_Id: book_Id,
		  	physicalBook_Id: physicalBook_Id,
		  	createdAt: createdAt,
		  	lastDiscussionDate: lastDiscussionDate,
		  	readBySender: readBySender,
		  	readByRecipient: readByRecipient,
		  	status: status
		  });
			},

		'addChat': function(mailbox_Id,sender_Id,recipient_Id,date,message){
		  
		  CHAT.insert({
		  	 mailbox_Id:mailbox_Id,
		  	 sender_Id:sender_Id,
		  	 recipient_Id:recipient_Id,
		  	 date:date,
		     message:message
		  });
			}

	});

}