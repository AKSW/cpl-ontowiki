//var owCon = new OntoWikiConnection(urlBase + 'jsonrpc');
//var urlBaseWebsafe = urlBase.replace(/[^a-z0-9-_.]/gi,'');

// classes for search and browser
var browserArg = {
	"model" : [ "http://uni-helmstedt.hab.de/cph/" ],
	"browse" : {
		"Professoren" : {
			//"query" : "SELECT DISTINCT ?resourceUri ?label ?image ?birthDate ?birthPlaceRes (MIN(?birthPlace) AS ?birthPlace) ?deathDate ?deathPlaceRes (MIN(?deathPlace) AS ?deathPlace) WHERE { ?resourceUri rdf:type ?body . ?resourceUri rdfs:label ?label . " +
			"query" : "SELECT DISTINCT * WHERE { ?resourceUri rdf:type ?body . ?resourceUri rdfs:label ?label . " +
				"OPTIONAL { ?resourceUri <http://uni-helmstedt.hab.de/cph/model/imageSource> ?image . } " +
				"OPTIONAL { " +
					"?resourceUri <http://uni-helmstedt.hab.de/cph/model/hasPeriod> ?birth . ?birth rdf:type <http://uni-helmstedt.hab.de/cph/model/Birth> . ?birth <http://uni-helmstedt.hab.de/cph/model/date> ?birthDate . ?birth <http://uni-helmstedt.hab.de/cph/model/periodPlace> ?birthPlaceRes . ?birthPlaceRes rdfs:label ?birthPlace . " +
					//OPTIONAL { ?birth <http://uni-helmstedt.hab.de/cph/model/date> ?birthDate . ?birth <http://uni-helmstedt.hab.de/cph/model/periodPlace> ?birthPlaceRes . ?birthPlaceRes rdfs:label ?birthPlace } . " +
					"?resourceUri <http://uni-helmstedt.hab.de/cph/model/hasPeriod> ?death . ?death rdf:type <http://uni-helmstedt.hab.de/cph/model/Death> . ?death <http://uni-helmstedt.hab.de/cph/model/date> ?deathDate . ?death <http://uni-helmstedt.hab.de/cph/model/periodPlace> ?deathPlaceRes . ?deathPlaceRes rdfs:label ?deathPlace . " +
				//"} FILTER ( ?body = <http://uni-helmstedt.hab.de/cph/model/Professor> ) } GROUP BY ?resourceUri ORDER BY ?label ?resourceUri",
					//"{ SELECT * WHERE { ?birth <http://uni-helmstedt.hab.de/cph/model/periodPlace> ?birthPlaceRes . ?birthPlaceRes rdfs:label ?birthPlace } } " +
				"} FILTER ( ?body = <http://uni-helmstedt.hab.de/cph/model/Professor> ) } GROUP BY ?resourceUri ORDER BY ?label ?resourceUri",
			"classes" : ["http://uni-helmstedt.hab.de/cph/model/Professor"]
		},
		"Personen" : {
			"classes" : ["http://uni-helmstedt.hab.de/cph/model/Person"]
		},
		"Körperschaften" : {
			"classes" : [ "http://uni-helmstedt.hab.de/cph/model/Body", "http://uni-helmstedt.hab.de/cph/model/Institution", "http://uni-helmstedt.hab.de/cph/model/Institute", "http://uni-helmstedt.hab.de/cph/model/Academy", "http://uni-helmstedt.hab.de/cph/model/Department", "http://uni-helmstedt.hab.de/cph/model/Faculty", "http://uni-helmstedt.hab.de/cph/model/School", "http://uni-helmstedt.hab.de/cph/model/Organisation", "http://uni-helmstedt.hab.de/cph/model/Party", "http://uni-helmstedt.hab.de/cph/model/PoliticalOrganisation", "http://uni-helmstedt.hab.de/cph/model/AcademicSociety", "http://uni-helmstedt.hab.de/cph/model/OtherOrganisation" ]
		},
		"Orte" : {
			"classes" : ["http://ns.aksw.org/spatialHierarchy/City", "http://ns.aksw.org/spatialHierarchy/AdministrativeDistrict", "http://ns.aksw.org/spatialHierarchy/Country"]
		}
	}
};

/*
Autocomplete Search
*/
// create custom autoconmplete item with resource uri as href
$.widget("custom.autocompleteLinkItem", $.ui.autocomplete, {
	_renderItem: function( ul, item ) {
		return $( "<li>" )
		.attr( "data-value", item.value )
		.append( '<a onclick="return false" href="' + item.value + '">' + item.label + "</a>" )
		.appendTo( ul );
		}
});
$("input.search-field").on("focus", function() {
	var queryEndpoint = urlBase + "sparql";	
	var apitype = "sparql";
	var queryDataType = "json";
	var filterClasses = [];
	$.each( browserArg["browse"], function(key, value) {
		$.merge(filterClasses,value["classes"]);
	});
	var filter = "?body = <" + filterClasses.join("> || ?body = <") + ">";
	var queryStr = "SELECT DISTINCT * WHERE { ?item <http://www.w3.org/2000/01/rdf-schema#label> ?label . ?item <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?body . FILTER ( ( " + filter + " ) && regex(?label,%s,'i') ) } ORDER BY ?label LIMIT 20";

	$(this).autocompleteLinkItem().autocompleteLinkItem({
		source: function( request, response ) {		
			var query = queryStr.replace(/%s/g, "'" + request.term + "'");
			$.ajax({
				url: queryEndpoint,
				dataType: queryDataType,
				data: {
					query: query,
					format: "json"
				},
				success: function( data ) {
					response( $.map( data.results.bindings, function( item ) {
						return {
							label: item.label.value, // wird angezeigt
							value: item.item.value
						}
	            	}));
	            },
	            error: function(err) {
	            	console.log( 'Error on autocomplete: ', err );
	            }
			});
	  	},
	  	select : function( event, ui ) {
	  		window.location.href = decodeURIComponent( ui.item.value );	
	  	},
		minLength: 2
	});
});

// Enable Browser to proflist
$(".browser").Browser( browserArg );

/*
$.each( $(".extend-list"), function(n,i) {
	var thisList = this;
	if ( $("li", this).length > 10 ) {
		var extender = $('<a href="#"><span class="caret"></span> mehr ('+($("li", this).length-10)+')</a>');
		var pretender = $('<a href="#" style="display:none"><span class="dropup"><span class="caret"></span></span> weniger</a>');
		$(this).after( $('<p class="extender"></p>').append(extender, pretender) );

		$(extender).click( function() {
			$("li", thisList).fadeIn();
			$(this).hide();
			$(pretender).show();
			return false;
		});
		$(pretender).click( function() {
			$("li:nth-child(n+11)", thisList).fadeOut();
			$(this).hide();
			$(extender).show();
			return false;
		});
	}
} );
*/

function extenderShowHide(show, hide) {
	$(hide).hide();
	$(show).show();
	$(hide).removeClass("loading");
}

$.each( $(".extend-list"), function(n,i) {
	var thisEl = this;	
	if ( $(thisEl).children().length < 10 ) {
		return true;
	}
	var query = $(thisEl).attr("data-query");
	var item = decodeURIComponent($(thisEl).attr("data-item")).replace(/\+/g, " ");
	var itemReplacements = item.match(/%\w*%/g);
	var extender = $('<a href="#"><span class="caret"></span> mehr </a>');
	var pretender = $('<a href="#" style="display:none"><span class="dropup"><span class="caret"></span></span> weniger </a>');
	$(thisEl).after( $('<p class="extender"></p>').append(extender, pretender) );	

	$(extender).click( function() {				
		$(extender).addClass("loading");
		if ( $(thisEl).attr("data-query") != "" ) {				
			$.ajax({
				url: urlBase + "sparql",
				dataType: "json",
				data: {
					query: query,
					format: "json"
				},
				success: function( data ) {
					$(thisEl).children().remove();
					$.each( data.results.bindings, function(i,el) {
						var curItem = item;
						for ( var j = 0; j < itemReplacements.length; j++ ) {
							var re = new RegExp(itemReplacements[j],"g");
							var elKey = itemReplacements[j].replace(/%/g, "");
							curItem = curItem.replace(re, el[ elKey ].value);
						}
						//$(thisEl).append( '<li class="col-md-3"><a href="'+el[ elKey ].value+'">'+el.label.value+'</a></li>' );
						$(thisEl).append( curItem );						
					});
					extenderShowHide( pretender, extender );
				},
				error: function(e) {
					console.log(e);
				},
			});
			$(thisEl).attr("data-query", "");
		} else {
			$(thisEl).children().fadeIn();
			extenderShowHide( pretender, extender );
		}				
		return false;
	});
	$(pretender).click( function() {
		//$("li:nth-child(n+11)", thisEl).fadeOut();		
		$(pretender).addClass("loading");
		$(thisEl).children("*:nth-child(n+11)").fadeOut(function() {
			extenderShowHide( extender, pretender );
		});
		return false;
	});

});