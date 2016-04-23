/*
 *  Helper Functions
 */

function loadFile (url) {
    return new Promise(function(resolve, reject) {
	var oReq = new XMLHttpRequest();
	oReq.open("get", url, true);

	oReq.onerror = function() { console.error(oReq.statusText); };
	oReq.onload = function() {
	    if (oReq.status === 200) {
		resolve(oReq.responseText)
	    }
	    else {
		reject(oReq.statusText);
	    }
	};
	oReq.send(null);
    });
};

/*
 * The citeproc-js sys object, implementing retrieveItem and retriveLocale
 */

function citeProcSys (bibFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', bibFile, false);
    xhr.send(null);
    this.references = JSON.parse(xhr.responseText);
    this.retrieveLocale = function (lang) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'citeproc-js/locale/locales-' + lang + '.xml', false);
        xhr.send(null);
        return xhr.responseText;
    };
    this.retrieveItem = function (id){
        var refs = this.references.filter(function (value, index, arr) {
	    return id == value.id;
	});
	if (refs)
	    return refs[0];
	else
	    console.log("citeProcSys: itemID " + id + " not found");
    };
}

/*
 * Convenience function, generate a citeproc engine with given style
 */
function getProcessor (styleID, bibFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'styles/' + styleID + '.csl', false);
    xhr.send(null);
    var styleAsText = xhr.responseText;
    var citeproc = new CSL.Engine(new citeProcSys(bibFile),styleAsText, "en-US");
    return citeproc;
};

/*
 * Generate a bibliography and insert/format citations for parent.
 * Uses the <cite> tags with their 'id' attr matching the id
 * of the citation in the citeproc engine
 */
function processCitations(parent, citeproc) {
    var citeTags = parent.getElementsByTagName("cite");
    var itemIDs = [];

    //citeproc silently fails if ID doesn't exits in bibfile...
    //will need to either check here, or fix citeproc to not fail
    for (var i=0; i<citeTags.length; i++) {
	if (citeTags[i].id)
	    itemIDs.push(citeTags[i].id);
    }

    if (itemIDs)
	citeproc.updateItems(itemIDs);
    for (var i=0; i<citeTags.length; ++i) {
	if (citeTags[i].id) {
	    var citation = {
		citationItems : [ {"id" : citeTags[i].id} ],
		properties : {}
	    };
	    var result = citeproc.appendCitationCluster(citation);
	    citeTags[i].innerHTML = result[0][1];
	}
    }

    var bibs = parent.getElementsByClassName("bibliography");
    var bibresult = citeproc.makeBibliography();
    
    for (var j=0; j<bibs.length; ++j) {
	bibs[j].innerHTML = bibresult[1].join('\n');
    }
}

function processReferenced() {
    var referencedSlides = document.getElementsByClassName("referenced");
    for (var i=0; i<referencedSlides.length; ++i) {
	var bibfile = referencedSlides[i].getAttribute("data-bibfile");
	var csl = referencedSlides[i].getAttribute("data-csl");
	if (!bibfile)
	    bibfile = "refs.json";
	if (!csl)
	    csl = "american-chemical-society";
	processCitations(referencedSlides[i], getProcessor(csl, bibfile));
    };
}
