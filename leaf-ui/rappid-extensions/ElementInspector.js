//Class for the element properties tab that appears when an element is clicked 
var ENTER_KEY = 13;
var alphaOnly = /[A-Z]/;

/*

Note:
The relationships between functions are extremely complex in this file.

Updating variables and render preexisting values often uses the same functions.
Functions like updateGraph, and updateCell are always called whenever changes are made 
on the inspector panel. 

This approach is necessary because Chart.js is built on top HTML5 Canvas. The entire 
canvas needs to be redrawn every time a variable is changed.  

When evaluating the functions calls of a particular action, use a top-down approach in
file naviagation. That is, the first function called is always near the top. The last 
function called, will always be near the bottom.
*/


var ElementInspector = Backbone.View.extend({
	
  className: 'element-inspector',

  template: [
      '<label>Node name</label>',
      '<textarea class="cell-attrs-text"></textarea>',
      '<label>Initial Satisfaction Value</label>',
      '<select id="init-sat-value">',
        '<option value=none> None </option>',
        '<option value=conflict> Conflict </option>',
        '<option value=satisfied> Satisfied </option>',
        '<option value=partiallysatisfied> Partially Satisfied </option>',
        '<option value=unknown> Unknown </option>',
        '<option value=partiallydenied> Partially Denied </option>',
        '<option value=denied> Denied </option>',
			'</select>',
      '<br>',

  ].join(''),
  
  actor_template: [
    '<label>Actor name</label>',
    '<textarea class="cell-attrs-text" maxlength=100></textarea>',
    '<label> Actor type </label>',
    '<select class="actor-type">',
      '<option value=A> Actor </option>',
      '<option value=G> Agent </option>',
      '<option value=R> Role </option>',
    '</select>'
	].join(''),

  events: {
    'keyup .cell-attrs-text': 'nameAction',
    'change #init-sat-value':'updateHTML',
    'change #actor-type': 'updateHTML'

  },
  
  //Initializing Element Inspector using the template.
  render: function(cellView) {
    this._cellView = cellView;
    var cell = this._cellView.model;

    if (cell instanceof joint.shapes.basic.Actor){
      this.$el.html(_.template(this.actor_template)());
      this.$('.cell-attrs-text').val(cell.attr(".name/text") || '');
      return
    }else{
      this.$el.html(_.template(this.template)());
    }

    cell.on('remove', function() {
        this.$el.html('');
    }, this);
    
    // Global variables
    this.chartObject = new chartObject();

    // Genernate all available selection options based on selected function type
    this.chartHTML = {};
    this.chartHTML.all = '<option value=satisfied> Satisfied </option><option value=partiallysatisfied> Partially Satisfied </option><option value=unknown selected> Random/Stochastic </option><option value=partiallydenied> Partially Denied </option><option value=denied> Denied </option>';
    this.chartHTML.noRandom = '<option value=satisfied> Satisfied </option><option value=partiallysatisfied> Partially Satisfied </option><option value=-1> Partially Denied </option><option value=denied> Denied </option>';
    this.chartHTML.positiveOnly = '<option value=satisfied> Satisfied </option><option value=partiallysatisfied> Partially Satisfied </option>';
    this.chartHTML.negativeOnly = '<option value=denied> Denied </option><option value=partiallydenied> Partially Denied </option>';


    // Load initial value
    this.$('.cell-attrs-text').val(cell.attr(".name/text") || '');
    this.$('#init-sat-value').val(cell.attr(".satvalue/value") || 'none');
    if (!cell.attr(".satvalue/value")){
      cell.attr(".satvalue/value", 'none');
    }

  },



  // update cell name
  nameAction: function(event){
    //Prevent the ENTER key from being recorded when naming nodes.
		if (event.which === ENTER_KEY){
			event.preventDefault();
    }

    var cell = this._cellView.model;
    var text = this.$('.cell-attrs-text').val()
    // Do not allow special characters in names, replace them with spaces.

    text = text.replace(/[^\w\n]/g, ' ');
    cell.attr({ '.name': { text: text } });
  },

  // update satisfaction value and buttons selection based on function type selection
  updateHTML: function(event){
    var initValue = this.$('#init-sat-value').val();
    
    // display based on inital value
    if((initValue == "none") || (initValue == "conflict")){
      this.updateCell(null);
      return
    }else{
    }

    this.updateGraph(null);
  },

  // update chart based on function type selection
  updateGraph: function(event){
    this.updateCell(null);
  },


  //Make corresponding changes in the inspector to the actual element in the chart
  updateCell: function(event) {
		var cell = this._cellView.model;
    // Cease operation if selected is Actor
  	if (cell instanceof joint.shapes.basic.Actor){ 
    	cell.prop("actortype", this.$('.actor-type').val());
    	if (cell.prop("actortype") == 'G'){
    		cell.attr({ '.line':
    					{'ref': '.label',
            			 'ref-x': 0,
            			 'ref-y': 0.08,
            			 'd': 'M 5 10 L 55 10',
            			 'stroke-width': 1,
            			 'stroke': 'black'}});
    	}else if (cell.prop("actortype") == 'R'){
    		cell.attr({ '.line':
    					{'ref': '.label',
            			 'ref-x': 0,
            			 'ref-y': 0.6,
            			 'd': 'M 5 10 Q 30 20 55 10 Q 30 20 5 10' ,
            			 'stroke-width': 1,
            			 'stroke': 'black'}});
    	}else {
    		cell.attr({'.line': {'stroke-width': 0}});
    	}
    	return;
  	}

    // save cell data
    cell.attr(".satvalue/value", this.$('#init-sat-value').val());

    //Update node display based on function and values
    var value = this.$('#init-sat-value').val();

    if (value == "satisfied"){
      cell.attr({ '.satvalue': {'d': 'M 0 10 L 5 20 L 20 0 L 5 20 L 0 10', 'stroke': '#00FF00', 'stroke-width':4}});
    }else if(value == "partiallysatisfied") {
      cell.attr({ '.satvalue': {'d': 'M 0 8 L 5 18 L 20 0 L 5 18 L 0 8 M 17 30 L 17 15 C 17 15 30 17 18 23', 'stroke': '#00FF00', 'stroke-width':3, 'fill': 'transparent'}});
      // cell.attr({ '.satvalue': {'d': 'M 18 18 L 18 23 M 0 10 L 5 20 L 20 0 L 5 20 L 0 10 M 0 20', 'stroke': '#00FF00', 'stroke-width':4}});
    }else if (value == "denied"){
      cell.attr({ '.satvalue': {'d': 'M 0 20 L 20 0 M 10 10 L 0 0 L 20 20', 'stroke': '#FF0000', 'stroke-width': 4}});
    }else if (value == "partiallydenied") {
      cell.attr({ '.satvalue': {'d': 'M 0 15 L 15 0 M 15 15 L 0 0 M 17 30 L 17 15 C 17 15 30 17 18 23', 'stroke': '#FF0000', 'stroke-width': 3, 'fill': 'transparent'}});
      // cell.attr({ '.satvalue': {'d': 'M 23 23 L 23 28 M 0 20 L 20 0 M 10 10 L 0 0 L 20 20', 'stroke': '#FF0000', 'stroke-width': 4}});
    }else if (value == "conflict") {
      cell.attr({ '.satvalue': {'d': 'M 0 0 L 20 8 M 20 7 L 5 15 M 5 14 L 25 23', 'stroke': '#222222', 'stroke-width': 4}});
    }else if (value == "unknown") {
      cell.attr({ '.satvalue': {'d': 'M15.255,0c5.424,0,10.764,2.498,10.764,8.473c0,5.51-6.314,7.629-7.67,9.62c-1.018,1.481-0.678,3.562-3.475,3.562\
          c-1.822,0-2.712-1.482-2.712-2.838c0-5.046,7.414-6.188,7.414-10.343c0-2.287-1.522-3.643-4.066-3.643\
          c-5.424,0-3.306,5.592-7.414,5.592c-1.483,0-2.756-0.89-2.756-2.584C5.339,3.683,10.084,0,15.255,0z M15.044,24.406\
          c1.904,0,3.475,1.566,3.475,3.476c0,1.91-1.568,3.476-3.475,3.476c-1.907,0-3.476-1.564-3.476-3.476\
          C11.568,25.973,13.137,24.406,15.044,24.406z', 'stroke': '#222222', 'stroke-width': 1}});
    }else {
      cell.removeAttr(".satvalue/d");
    }
  },
  
  clear: function(){
    this.$el.html('');
  }
});
