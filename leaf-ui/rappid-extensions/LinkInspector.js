//Class for the Link properties tab that appears when link settings are clicked.

var LinkInspector = Backbone.View.extend({

  className: 'link-inspector',

  refinementtemplate: [
    '<label id="title">Refinement Relationship</label>',
    '<br>',
    '<select class="sublink-type">',
      '<option value=and>And-Decomposition</option>',
      '<option value=or>Or-Decomposition (Means-end)</option>',
    '</select>',
    '</div>',
    '<br>'
  ].join(''),
  neededbytemplate: [
    '<label id="title">NeededBy Relationship</label>',
    '<br>',
    '</div>',
    '<br>'
  ].join(''),
  contributiontemplate: [
    '<label id="title">Contribution Relationship</label>',
    '<br>',
    '<select class="sublink-type">',
      '<option value=makes>Makes</option>',
      '<option value=breaks>Breaks</option>',
      '<option value=helps>Helps</option>',
      '<option value=hurts>Hurts</option>',
    '</select>',
    '</div>',
    '<br>'
  ].join(''),
  qualificationtemplate: [
    '<label id="title">Qualification Relationship</label>',
    '<br>',
    '</div>',
    '<br>'
  ].join(''),
  errortemplate: [
    '<label id="title">Error</label>',
    '<br>',
    '<div> This is usually caused by 3 possible reasons:  </div>',
    '<ul> <li> Link is not connected to both source and target node </li> <li> You are connecting from resource to goal </li> <li> You are connecting from resource to resource </li>',
    '</div>',
    '<br>'
  ].join(''),
  actortemplate: [
      '<label> Link Type </label> <br>',
      '<select class="sublink-type">',
        '<option value="is-a">is-a</option>',
        '<option value="participates-in">participates-in</option>',
      '</select><br>'].join(''),

  events: {
    'change .sublink-type': 'updateCell',
  },


  //Method to create the Link Inspector using the template.
  render: function(cellView, linktype) {
    this._cellView = cellView;
    var cell = this._cellView.model;
    var type = cellView.model.attributes.labels[0].attrs.text.text

    this.relationTextA = ["And-Decomposition", "Or-Decomposition (Means-end)", "Depends"];
    this.relationTextB = ["Makes", "Breaks", "Helps", "Hurts"];
    this.relationValA = ["and", "or", "depends"];
    this.relationValB = ["makes", "breaks", "helps", "hurts"];
    // select template
    if (cell.prop("linktype")){
      this.$el.html(_.template(this.actortemplate)());
    }else{
      // Choose template based on linktype: Contribution, refinement, error, neededby, qualification
      switch(linktype){
        case 'Contribution':
          this.$el.html(_.template(this.contributiontemplate)());
          break;
        case 'Refinement':
          this.$el.html(_.template(this.refinementtemplate)());
          break;
        case 'Qualification':
          this.$el.html(_.template(this.qualificationtemplate)());
          break;
        case 'NeededBy':
          this.$el.html(_.template(this.neededbytemplate)());
          break;
        default:
          this.$el.html(_.template(this.errortemplate)());
      }

    }

    // already intialized previously
    if (cell.prop("sublink-type")){
      var val = cell.prop("sublink-type").split("|");

      // normal relation
      if (val.length == 1){
        this.$('.sublink-type').val(val[0]);
      }
    }

    cell.on('remove', function() {
      this.$el.html('');
    }, this);

  },

 
  //Whenever something is changed in the inspector, make the corresponding change to the link in the model.
  updateCell: function() {
    var link = this._cellView.model;
    this._cellView.model.prop("sublink-type", this.$('.sublink-type').val());
    var linktype = link.attr(".link-type");
    if (linktype == "Refinement"){
      if (this._cellView.model.prop("sublink-type") == 'or'){
        link.attr({
          '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
          '.marker-source': {'d': 'M 0 0'},
          '.marker-target': {stroke: '#000000', 'stroke-width': 1, "d": 'M 10 0 L 10 10 M 10 5 L 0 5' }
        });
        link.label(0 ,{position: 0.5, attrs: {text: {text: 'or'}}});
      
      }else if (this._cellView.model.prop("sublink-type") == 'and'){
        link.attr({
          '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
          '.marker-source': {'d': 'M 0 0'},
          '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 z'}
        });
        link.label(0 ,{position: 0.5, attrs: {text: {text: 'and'}}});
      }
      else {
        console.log('Error, this should not happen');
      }
    }

    else if (linktype == "Contribution"){
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
        '.marker-source': {'d': 'M 0 0'},
        '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5'}
      });
      link.label(0 ,{position: 0.5, attrs: {text: {text: link.prop("sublink-type")}}});
    }
    else if (linktype == "NeededBy"){
      link.attr({
          '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
          '.marker-source': {'d': 'M 0 0'},
          '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 z'}
        });
    }
    else if (linktype == "Qualification"){
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '5 2'},
        '.marker-source': {'d': 'M 0 0'},
        '.marker-target': {'d': 'M 0 0'}
      });
    }
    else{
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
        '.marker-source': {'d': 'M 0 0'},
        '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5'}
      });
      link.label(0 ,{position: 0.5, attrs: {text: {text: link.prop("sublink-type")}}});
    }
    
  },

  //Displays the additional options when delayed propagation is checked.
  checkboxHandler: function(e){
    if (e.currentTarget.checked){
      document.getElementById("hidden").removeAttribute("style");
    }
    else{
      document.getElementById("hidden").setAttribute("style", "display:none");
    }
  },

  clear: function(){
    this.$el.html('');
  }
});
