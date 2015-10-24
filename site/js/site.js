//var owCon = new OntoWikiConnection(urlBase + 'jsonrpc');
//var urlBaseWebsafe = urlBase.replace(/[^a-z0-9-_.]/gi,'');

// classes for search and browser
var browserArg = {
		"model" : [ "http://uni-helmstedt.hab.de/cph/" ],
		"browse" : {
			"Professoren" : {
				"classes" : ["http://uni-helmstedt.hab.de/cph/model/Professor"]
			},
			"Personen" : {
				"classes" : ["http://uni-helmstedt.hab.de/cph/model/Person"]
			},
			"Matrikel" : {
				"classes" : ["http://uni-helmstedt.hab.de/cph/model/Matrikel"]
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

// add browser.js 
if ( $(".proflist").length > 0 ) {
	$(".proflist").Browser( browserArg );
}

// drag and drop functionality for the root form
function drag_start(event) {
    var style = window.getComputedStyle(event.target, null);
    event.dataTransfer.setData("text/plain",
    (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
} 
function drag_over(event) { 
    event.preventDefault(); 
    return false; 
} 
function drop(event) { 
    var offset = event.dataTransfer.getData("text/plain").split(',');
    var dm = document.getElementsByTagName("form")[0];
    
    var dm1 = document.getElementById("rdform-drag-header");
    
    //console.log(event.clientX, event.dataTransfer.getData("text/plain"), parseInt(offset[0],10));
    //dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
    dm.style.left = (event.clientX + 470 - Math.abs( ( parseInt(offset[0],10) ) + event.clientX ) ) + 'px';
    //dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
    dm.style.top = (event.clientY) + 'px';
    event.preventDefault();
    return false;
}
function drag_init() {
	return false;
	//var dm = document.getElementsByTagName("form")[0];
	var dm = document.getElementById("rdform-drag-header");
	$(dm).attr("draggable", "true");
	dm.addEventListener('dragstart',drag_start,false); 
	document.body.addEventListener('dragover',drag_over,false); 
	document.body.addEventListener('drop',drop,false);
}