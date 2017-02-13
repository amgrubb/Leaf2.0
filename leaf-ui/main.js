// Global variables
var graph;
var paper;
var stencil;
var mode;

// Mode specific variables
var graphObject = new graphObject();		// Stores all variables between modes

var linkInspector = new LinkInspector();
var elementInspector = new ElementInspector();
var currentHalo;
var currentAnalysis;

// Analysis variables
var historyObject = new historyObject();
var sliderObject = new sliderObject();
var queryObject = new queryObject();

var loader;
var reader;

//Properties for both core and simulator.
var satvalues = {satisfied: 2, partiallysatisfied: 1, partiallydenied: -1, denied: -2, unknown: 0, conflict: 3, none: 4};

//var functions = {A: 'AI', O: 'OI', N: 'NT', M: 'MP', R: 'R', S: 'SP', MN: 'MN', SN: 'SN', U: 'UD'};


// ----------------------------------------------------------------- //
// Page setup

// Mode used specify layout and functionality of toolbars
mode = "Modelling";		// 'Analysis' or 'Modelling'
linkMode = "Relationships";	// 'Relationships' or 'Constraints'

graph = new joint.dia.Graph();

// Create a paper and wrap it in a PaperScroller.
paper = new joint.dia.Paper({
    width: 1000,
    height: 1000,
    gridSize: 10,
    perpendicularLinks: false,
    model: graph,
    defaultLink: new joint.dia.Link({
		'attrs': {
			'.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
			'.marker-source': {'d': 'M 0 0'},
			'.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 z'}
			},
		'labels': [{position: 0.5, attrs: {text: {text: "this is default link. You shouldnt be able to see it"}}}]
	})
});

var paperScroller = new joint.ui.PaperScroller({
	autoResizePaper: true,
	paper: paper
});

$('#paper').append(paperScroller.render().el);
paperScroller.center();


// Create and populate stencil.
stencil = new joint.ui.Stencil({
	graph: graph,
	paper: paper,
	width: 200,
	height: 600
});

$('#stencil').append(stencil.render().el);

var goal = new joint.shapes.basic.Goal({ position: {x: 50, y: 20} });
var task = new joint.shapes.basic.Task({ position: {x: 50, y: 100} });
var quality = new joint.shapes.basic.Softgoal({ position: {x: 50, y: 170} });
var res = new joint.shapes.basic.Resource({ position: {x: 50, y: 250} });
var act = new joint.shapes.basic.Actor({ position: {x: 40, y: 400} });

stencil.load([goal, task, quality, res, act]);

//Setup LinkInspector
$('.inspector').append(linkInspector.el);

//Interface set up for modelling mode on startup
$('#dropdown-model').css("display","none");
$('#history').css("display","none");

//Initialize Slider setup
sliderObject.sliderElement = document.getElementById('slider');
sliderObject.sliderValueElement = document.getElementById('sliderValue');

$('#slider').width($('#paper').width() * 0.8);
$('#slider').css("margin-top", $(window).height() * 0.9);

// Adjust slider value position based on stencil width and paper width
var sliderValuePosition = 200 + $('#paper').width() * 0.1;
$('#sliderValue').css("top", '20px');
$('#sliderValue').css("left", sliderValuePosition.toString() + 'px');
$('#sliderValue').css("position", "relative");

$(window).resize(function() {
	$('#slider').css("margin-top", $(this).height() * 0.9);
	$('#slider').width($('#paper').width() * 0.8);
});

//If a cookie exists, process it as a previously created graph and load it.
if (document.cookie){
	var cookies = document.cookie.split(";");
	var prevgraph = "";

	//Loop through the cookies to find the one representing the graph, if it exists
	for (var i = 0; i < cookies.length; i++){
		if (cookies[i].indexOf("graph=") >= 0){
			prevgraph = cookies[i].substr(6);
			break;
		}
	}

	if (prevgraph){
		graph.fromJSON(JSON.parse(prevgraph));
	}
}



// ----------------------------------------------------------------- //
// Rappid setup

var element_counter = 0;
var max_font = 20;
var min_font = 6;
var current_font = 10;

//Whenever an element is added to the graph
graph.on("add", function(cell){
	if (cell instanceof joint.dia.Link){
		if (graph.getCell(cell.get("source").id) instanceof joint.shapes.basic.Actor){

			cell.attr({
				'.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
				'.marker-source': {'d': '0'},
				'.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5'}
			});
			cell.prop("linktype", "actorlink");

			// Unable to model constraints for actors
			if(linkMode == "Relationships"){
				cell.label(0, {attrs: {text: {text: "is-a"}}});
			}
		}
	}	//Don't do anything for links

	//Give element a unique default
	cell.attr(".name/text", cell.attr(".name/text") + "_" + element_counter);
	element_counter++;

	//Add Functions and sat values to added types
	if (cell instanceof joint.shapes.basic.Intention){
		cell.attr('.funcvalue/text', ' ');
	}

	//Send actors to background so elements are placed on top
	if (cell instanceof joint.shapes.basic.Actor){
		cell.toBack();
	}

	paper.trigger("cell:pointerup", cell.findView(paper));
});

//Auto-save the cookie whenever the graph is changed.
graph.on("change", function(){
	var graphtext = JSON.stringify(graph.toJSON());
	document.cookie = "graph=" + graphtext;
});

var selection = new Backbone.Collection();

var selectionView = new joint.ui.SelectionView({
	paper: paper,
	graph: graph,
	model: selection
});


// Initiate selecting when the user grabs the blank area of the paper while the Shift key is pressed.
// Otherwise, initiate paper pan.
paper.on('blank:pointerdown', function(evt, x, y) {
    if (_.contains(KeyboardJS.activeKeys(), 'shift')) {
    	if(mode == "Analysis")
			return

        selectionView.startSelecting(evt, x, y);
    } else {
        paperScroller.startPanning(evt, x, y);
    }
});

paper.on('cell:pointerdown', function(cellView, evt, x, y){
	if(mode == "Analysis"){
		queryObject.addCell(cellView);
		return
	}

	var cell = cellView.model;
	if (cell instanceof joint.dia.Link){
		cell.reparent();
	}

	//Unembed cell so you can move it out of actor
	if (cell.get('parent') && !(cell instanceof joint.dia.Link)) {
		graph.getCell(cell.get('parent')).unembed(cell);
	}
});

// Unhighlight everything when blank is being clicked
paper.on('blank:pointerclick', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		var cellView  = elements[i].findView(paper);
		cellView.unhighlight();
	}
});



// Disable context menu inside the paper.
paper.el.oncontextmenu = function(evt) { evt.preventDefault(); };


// A simple element editor.
// --------------------------------------
$('.inspector').append(elementInspector.el);

//Link equivalent of the element editor
paper.on("link:options", function(evt, cell){
	if(mode == "Analysis")
		return
	var link = cell.model;
	setLinkType(link);
	var linktype = link.attr(".link-type");
	linkInspector.clear();
	elementInspector.clear();
	if (linkMode == "Relationships"){
		linkInspector.render(cell, linktype);

	}
});
// Identify link-type: Refinement, Contribution, Qualification or NeededBy
// And store the linktype into the link
function setLinkType(link){
	if (!link.getTargetElement() || !link.getSourceElement()){
		link.attr(".link-type", "Error");
		return;
	}
	var sourceCell = link.getSourceElement().attributes.type;
	var targetCell = link.getTargetElement().attributes.type;


	switch(true){
		case ((sourceCell == "basic.Goal") && (targetCell == "basic.Goal")):
			link.attr(".link-type", "Refinement");
			break;
		case ((sourceCell == "basic.Goal") && (targetCell == "basic.Softgoal")):
			link.attr(".link-type", "Contribution");
			break;
		case ((sourceCell == "basic.Goal") && (targetCell == "basic.Task")):
			link.attr(".link-type", "Refinement");
			break;
		case ((sourceCell == "basic.Goal") && (targetCell == "basic.Resource")):
			link.attr(".link-type", "Error");
			break;
		case ((sourceCell == "basic.Softgoal") && (targetCell == "basic.Goal")):
			link.attr(".link-type", "Qualification");
			break;
		case ((sourceCell == "basic.Softgoal") && (targetCell == "basic.Softgoal")):
			link.attr(".link-type", "Contribution");
			break;
		case ((sourceCell == "basic.Softgoal") && (targetCell == "basic.Task")):
			link.attr(".link-type", "Qualification");
			break;
		case ((sourceCell == "basic.Softgoal") && (targetCell == "basic.Resource")):
			link.attr(".link-type", "Qualification");
			break;
		case ((sourceCell == "basic.Task") && (targetCell == "basic.Goal")):
			link.attr(".link-type", "Refinement");
			break;
		case ((sourceCell == "basic.Task") && (targetCell == "basic.Softgoal")):
			link.attr(".link-type", "Contribution");
			break;
		case ((sourceCell == "basic.Task") && (targetCell == "basic.Task")):
			link.attr(".link-type", "Refinement");
			break;
		case ((sourceCell == "basic.Task") && (targetCell == "basic.Resource")):
			link.attr(".link-type", "Error");
			break;
		case ((sourceCell == "basic.Resource") && (targetCell == "basic.Goal")):
			link.attr(".link-type", "Error");
			break;
		case ((sourceCell == "basic.Resource") && (targetCell == "basic.Softgoal")):
			link.attr(".link-type", "Contribution");
			break;
		case ((sourceCell == "basic.Resource") && (targetCell == "basic.Task")):
			link.attr(".link-type", "NeededBy");
			break;
		case ((sourceCell == "basic.Resource") && (targetCell == "basic.Resource")):
			link.attr(".link-type", "Error");
			break;

		default:
			console.log('Default');
	}
	return;
}
// Need to draw a link upon user creating link between 2 nodes
// Given a link and linktype, draw the deafult link
function drawDefaultLink(link, linktype){
	switch(linktype){
		case "Refinement":
			link.label(0 ,{position: 0.5, attrs: {text: {text: 'and'}}});
			break;
		case "Qualification":
			link.attr({
			  '.connection': {stroke: '#000000', 'stroke-dasharray': '5 2'},
			  '.marker-source': {'d': 'M 0 0'},
			  '.marker-target': {'d': 'M 0 0'}
			});
			link.label(0 ,{position: 0.5, attrs: {text: {text: ""}}});
			break;
		case "Contribution":
			link.attr({
			  '.marker-target': {'d': 'M 12 -3 L 5 5 L 12 13 M 5 5 L 30 5', 'fill': 'transparent'}
			})
			link.label(0 ,{position: 0.5, attrs: {text: {text: "makes"}}});
			break;
		case "NeededBy":
			link.attr({
			  '.marker-target': {'d': 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0'}
			})
			link.label(0 ,{position: 0.5, attrs: {text: {text: "NeededBy"}}});
			break;
		case "Error":
			link.label(0 ,{position: 0.5, attrs: {text: {text: "Error"}}});
			break;
		default:
			break;
	}
}

//When a cell is clicked, create the Halo
function isLinkInvalid(link){
	return (!link.prop('source/id') || !link.prop('target/id'));
}

//Single click on cell
paper.on('cell:pointerup', function(cellView, evt) {
	if(mode == "Analysis")
		return

	// Link
	if (cellView.model instanceof joint.dia.Link){
		var link = cellView.model;
		var sourceCell = link.getSourceElement().attributes.type;
		setLinkType(link);
		var linktype = link.attr(".link-type");
		drawDefaultLink(link, linktype);

		// Check if link is valid or not
		if (link.getTargetElement()){
			var targetCell = link.getTargetElement().attributes.type;
			// Links of actors must be paired with other actors
			if (((sourceCell == "basic.Actor") && (targetCell != "basic.Actor")) ||
				((sourceCell != "basic.Actor") && (targetCell == "basic.Actor"))){
				link.label(0 ,{position: 0.5, attrs: {text: {text: 'error'}}});
			}else if ((sourceCell == "basic.Actor") && (targetCell == "basic.Actor")){
				link.label(0 ,{position: 0.5, attrs: {text: {text: 'is-a'}}});
			}
		}
		return

	// element is selected
	}else{
		selection.reset();
		selection.add(cellView.model);
		var cell = cellView.model;
		// Unhighlight everything
		var elements = graph.getElements();
		for (var i = 0; i < elements.length; i++){
			var cellview  = elements[i].findView(paper);
			cellview.unhighlight();
		}
		// Highlight when cell is clicked
		cellView.highlight();

		currentHalo = new joint.ui.Halo({
			graph: graph,
			paper: paper,
			cellView: cellView,
			type: 'toolbar'
		});

		currentHalo.removeHandle('unlink');
		currentHalo.removeHandle('clone');
		currentHalo.removeHandle('fork');
		currentHalo.removeHandle('rotate');
		currentHalo.render();

		//Embed an element into an actor boundary, if necessary
		if (!(cellView.model instanceof joint.shapes.basic.Actor)){
			var ActorsBelow = paper.findViewsFromPoint(cell.getBBox().center());

			if (ActorsBelow.length){
				for (var a = 0; a < ActorsBelow.length; a++){
					if (ActorsBelow[a].model instanceof joint.shapes.basic.Actor){
						ActorsBelow[a].model.embed(cell);
					}
				}
			}
		}

		linkInspector.clear();
		elementInspector.render(cellView);
	}
});

graph.on('change:size', function(cell, size){
	cell.attr(".label/cx", 0.25 * size.width);

	//Calculate point on actor boundary for label (to always remain on boundary)
	var b = size.height;
	var c = -(size.height/2 + (size.height/2) * (size.height/2) * (1 - (-0.75 * size.width/2) * (-0.75 * size.width/2)  / ((size.width/2) * (size.width/2)) ));
	var y_cord = (-b + Math.sqrt(b*b - 4*c)) / 2;

	cell.attr(".label/cy", y_cord);
});


// ----------------------------------------------------------------- //
// Keyboard shortcuts


var clipboard = new joint.ui.Clipboard();
KeyboardJS.on('ctrl + c', function() {
	// Copy all selected elements and their associatedf links.
	clipboard.copyElements(selection, graph, { translate: { dx: 20, dy: 20 }, useLocalStorage: true });
});
KeyboardJS.on('ctrl + v', function() {
	clipboard.pasteCells(graph);

	selectionView.cancelSelection();

	clipboard.pasteCells(graph, { link: { z: -1 }, useLocalStorage: true });

	// Make sure pasted elements get selected immediately. This makes the UX better as
	// the user can immediately manipulate the pasted elements.
	clipboard.each(function(cell) {
		if (cell.get('type') === 'link') return;

		// Push to the selection not to the model from the clipboard but put the model into the graph.
		// Note that they are different models. There is no views associated with the models
		// in clipboard.
		selection.add(graph.get('cells').get(cell.id));
	});

	selection.each(function(cell) {
	selectionView.createSelectionBox(paper.findViewByModel(cell));
	});
});

//Delete selected nodes when the delete key is pressed.

KeyboardJS.on('del', function(){
// 	while (selection.length > 0){
// 		selection.pop();
// //		console.log(paper.findViewByModel(current));
// //		selectionView.destroySelectionBox(paper.findViewByModel(current));
// //		current.remove();
// 	}
});
// Override browser's default action when backspace is pressed
KeyboardJS.on('backspace', function(){

});
// ----------------------------------------------------------------- //
// Toolbar

var commandManager = new joint.dia.CommandManager({ graph: graph });

$('#btn-undo').on('click', _.bind(commandManager.undo, commandManager));
$('#btn-redo').on('click', _.bind(commandManager.redo, commandManager));
$('#btn-clear-all').on('click', function(){
	graph.clear();
	//Delete cookie by setting expiry to past date
	document.cookie='graph={}; expires=Thu, 18 Dec 2013 12:00:00 UTC';
});

$('#btn-clear-elabel').on('click', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		elements[i].removeAttr(".satvalue/d");
		elements[i].attr(".constraints/lastval", "none");
		elements[i].attr(".funcvalue/text", " ");
		var cellView  = elements[i].findView(paper);
		elementInspector.render(cellView);
		elementInspector.$('#init-sat-value').val("none");
		elementInspector.updateHTML(null);

	}

});
$('#btn-clear-flabel').on('click', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		if (elements[i].attr(".constraints/lastval") != "none"){
			elements[i].attr(".funcvalue/text", "C");
		}
	}
});
$('#btn-svg').on('click', function() {
	paper.openAsSVG();
});

$('#btn-zoom-in').on('click', function() {
	paperScroller.zoom(0.2, { max: 3 });
});
$('#btn-zoom-out').on('click', function() {
	paperScroller.zoom(-0.2, { min: 0.2 });
});

$('#btn-save').on('click', function() {
	// Always initalize files on modelling links for code simplicity
	if (linkMode == "Constraints")
		$('#symbolic-btn').trigger( "click" );

	var name = window.prompt("Please enter a name for your file. \nIt will be saved in your Downloads folder. \n.json will be added as the file extension.", "<file name>");
	if (name){
		var fileName = name + ".json";
		download(fileName, JSON.stringify(graph.toJSON()));
	}
});

//Workaround for load, activates a hidden input element
$('#btn-load').on('click', function(){
	if (linkMode == "Constraints")
		$('#symbolic-btn').trigger( "click" );
	$('#loader').click();
});

//Universally increase or decrease font size
$('#btn-fnt-up').on('click', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		if (elements[i].attr(".name/font-size") < max_font){
			elements[i].attr(".name/font-size", elements[i].attr(".name/font-size") + 1);
		}
	}
});

$('#btn-fnt-down').on('click', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		if (elements[i].attr(".name/font-size") > min_font){
			elements[i].attr(".name/font-size", elements[i].attr(".name/font-size") - 1);
		}
	}
});

//Default font size
$('#btn-fnt').on('click', function(){
	var elements = graph.getElements();
	for (var i = 0; i < elements.length; i++){
		elements[i].attr(".name/font-size", 10);
	}
});

//Save in .leaf format
$('#btn-save-leaf').on('click', saveLeaf);

//Simulator
loader = document.getElementById("loader");
reader = new FileReader();

//Whenever the input is changed, read the file.
loader.onchange = function(){
	reader.readAsText(loader.files.item(0));
};

//When read is performed, if successful, load that file.
reader.onload = function(){
	if (reader.result){
		if (mode == "Modelling"){
			graph.fromJSON(JSON.parse(reader.result));

			// Load different links and intension constraints
			var allLinks = graph.getLinks();
			graphObject.links = [];
			graphObject.intensionConstraints = [];
			allLinks.forEach(function(link){
				if(link.attr('./display') == "none"){
					graphObject.intensionConstraints.push(link);
				}else{
					graphObject.links.push(link);
				}
			});
		}else{
			analysisResults = reader.result.split("\n");
			loadAnalysis(analysisResults, null, -1);
		}
	}
};


//Save in a .leaf format
function saveLeaf(){
	var datastring = generateLeafFile();
	var name = window.prompt("Please enter a name for your file. \nIt will be saved in your Downloads folder. \n.leaf will be added as the file extension.", "<file name>");
	if (name){
		var fileName = name + ".leaf";
		download(fileName, datastring);
	}
}

//Helper function to download saved graph in JSON format
function download(filename, text) {
	var dl = document.createElement('a');
	dl.setAttribute('href', 'data:application/force-download;charset=utf-8,' + encodeURIComponent(text));
	dl.setAttribute('download', filename);

	dl.style.display = 'none';
	document.body.appendChild(dl);

	dl.click();
	document.body.removeChild(dl);
}


// Generates file needed for backend analysis
function generateLeafFile(){

	//Step 0: Get elements from graph.
	var all_elements = graph.getElements();
	var savedLinks = [];
	var savedConstraints = [];

	if (linkMode == "Relationships"){
		savedConstraints = graphObject.intensionConstraints;
		var links = graph.getLinks();
	    links.forEach(function(link){
	        if(!isLinkInvalid(link)){
				if (link.attr('./display') != "none")
	        		savedLinks.push(link);
	        }
	        else{link.remove();}
	    });
	}else if (linkMode == "Constraints"){
		savedLinks = graphObject.links;
		var betweenIntensionConstraints = graph.getLinks();
	    betweenIntensionConstraints.forEach(function(link){
			var linkStatus = link.attributes.labels[0].attrs.text.text.replace(/\s/g, '');
	        if(!isLinkInvalid(link) && (linkStatus != "constraint") && (linkStatus != "error")){
				if (link.attr('./display') != "none")
					savedConstraints.push(link);
	        }
	        else{link.remove();}
	    });
	}

	//Step 1: Filter out Actors
	var elements = [];
	var actors = [];
	for (var e1 = 0; e1 < all_elements.length; e1++){
		if (!(all_elements[e1] instanceof joint.shapes.basic.Actor)){
			elements.push(all_elements[e1]);
		}
		else{
			actors.push(all_elements[e1]);
		}
	}

	//save elements in global variable for slider, used for toBackEnd funciton only
	graphObject.allElements = elements;
	graphObject.elementsBeforeAnalysis = elements;

	var datastring = actors.length + "\n";
	//print each actor in the model
	for (var a = 0; a < actors.length; a++){
		var actorId = a.toString();
		while (actorId.length < 3){ actorId = "0" + actorId;}
		actorId = "a" + actorId;
		actors[a].prop("elementid", actorId);
		datastring += ("A\t" + actorId + "\t" + actors[a].attr(".name/text") + "\t" + (actors[a].prop("actortype") || "A") + "\n");
	}


	// Step 2: Print each element in the model

	// conversion between values used in Element Inspector with values used in backend
	var satValueDict = {
		"unknown": 5,
		"satisfied": 3,
		"partiallysatisfied": 2,
		"partiallydenied": 1,
		"denied": 0,
		"conflict": 4,
		"none": 6
	}
	datastring += elements.length + "\n";
	for (var e = 0; e < elements.length; e++){
		//var id = e.toString();
		//while (id.length < 4){ id = "0" + id;}
		//elements[e].prop("elementid", id);
		var elementID = e.toString();
		while (elementID.length < 4){ elementID = "0" + elementID;}
		elements[e].prop("elementid", elementID);

		var actorid = '-';
		if (elements[e].get("parent")){
			actorid = (graph.getCell(elements[e].get("parent")).prop("elementid") || "-");
		}
		console.log(actorid);

	// Print NT in "core" of tool where time does not exist.
	//datastring += ("I\t" + actorid + "\t" + elementID + "\t" + (functions[elements[e].attr(".funcvalue/text")] || "NT") + "\t");

	  datastring += ("I\t" + actorid + "\t" + elementID + "\t");
		if (elements[e] instanceof joint.shapes.basic.Goal)
		  	datastring += "G\t";
		else if (elements[e] instanceof joint.shapes.basic.Task)
		  	datastring += "T\t";
		else if (elements[e] instanceof joint.shapes.basic.Softgoal)
		  	datastring += "S\t";
		else if (elements[e] instanceof joint.shapes.basic.Resource)
		  	datastring += "R\t";
		else
	  		datastring += "I\t";

	  	var v = elements[e].attr(".satvalue/value")

	  	// treat satvalue as unknown if it is not yet defined
	  	if((!v) || (v == "none"))
			v = "none";

		datastring += satValueDict[v];
		datastring += "\t" + elements[e].attr(".name/text").replace(/\n/g, " ") + "\n";
	}


	//Step 3: Print each link in the model
	for (var l = 0; l < savedLinks.length; l++){
		var current = savedLinks[l];
		var relationship = current.label(0).attrs.text.text.toUpperCase()
		var source = "-";
		var target = "-";

		if (current.get("source").id)
			source = graph.getCell(current.get("source").id).prop("elementid");
		if (current.get("target").id)
			target = graph.getCell(current.get("target").id).prop("elementid");

		if (relationship.indexOf("|") > -1){
			evolvRelationships = relationship.replace(/\s/g, '').split("|");
			datastring += 'L\t' + evolvRelationships[0] + '\t' + source + '\t' + target + '\t' + evolvRelationships[1] + "\n";
		}else{
			datastring += 'L\t' + relationship + '\t' + source + '\t' + target + "\n";
		}
	}


	//Step 4: Print constraints between intensions.
	for (var e = 0; e < savedConstraints.length; e++){
		var c = savedConstraints[e];
		var type = c.attributes.labels[0].attrs.text.text.replace(/\s/g, '');
		var source = c.getSourceElement().attributes.elementid;
		var target = c.getTargetElement().attributes.elementid;
		var sourceVar = c.attr('.constraintvar/src');
		var targetVar = c.attr('.constraintvar/tar');

		datastring += ("C\t" + type + "\t" + source + "\t" + sourceVar + "\t" + target + "\t" + targetVar + "\n");
	}

	console.log(datastring);
	return datastring
}
