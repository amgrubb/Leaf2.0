//Class for the Link properties tab that appears when link settings are clicked.

var LinkInspector = Backbone.View.extend({

  className: 'link-inspector',

  template: [
    '<label id="title">Constant Relationship</label>',
    '<br>',
    '<select class="link-type">',
      '<option value=and>And-Decomposition</option>',
      '<option value=or>Or-Decomposition (Means-end)</option>',
      '<option value=depends>Depends</option>',
      '<option value=makes>Makes</option>',
      '<option value=breaks>Breaks</option>',
      '<option value=helps>Helps</option>',
      '<option value=hurts>Hurts</option>',
    '</select>',
    '</div>',
    '<br>'
  ].join(''),

  actortemplate: [
      '<label> Link Type </label> <br>',
      '<select class="link-type">',
        '<option value="is-a">is-a</option>',
        '<option value="participates-in">participates-in</option>',
      '</select><br>'].join(''),

  events: {
    'change .link-type': 'updateCell',
  },


  //Method to create the Link Inspector using the template.
  render: function(cellView, tmp) {
    console.log(tmp);
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
      this.$el.html(_.template(this.template)());
    }

    // already intialized previously
    if (cell.prop("link-type")){
      var val = cell.prop("link-type").split("|");

      // normal relation
      if (val.length == 1){
        this.$('.link-type').val(val[0]);
      }
    }

    cell.on('remove', function() {
      this.$el.html('');
    }, this);

  },

 
  //Whenever something is changed in the inspector, make the corresponding change to the link in the model.
  updateCell: function() {
    var link = this._cellView.model;
    this._cellView.model.prop("link-type", this.$('.link-type').val());
    if (this._cellView.model.prop("link-type") == 'and'){
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
        '.marker-source': {'d': '0'},
        '.marker-target': {stroke: '#000000', 'stroke-width': 1, "d": 'M 10 0 L 10 10 M 10 5 L 0 5' }
      });
      link.label(0 ,{position: 0.5, attrs: {text: {text: 'and'}}});
    
    }else if (this._cellView.model.prop("link-type") == 'or' || this._cellView.model.prop("link-type") == 'xor'){
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '5 2'},
        '.marker-source': {'d': '0'},
        '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 z'}
      });
      link.label(0 ,{position: 0.5, attrs: {text: {text: link.prop("link-type")}}});
    
    }else{
      link.attr({
        '.connection': {stroke: '#000000', 'stroke-dasharray': '0 0'},
        '.marker-source': {'d': '0'},
        '.marker-target': {stroke: '#000000', "d": 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5'}
      });
      link.label(0 ,{position: 0.5, attrs: {text: {text: link.prop("link-type")}}});
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
