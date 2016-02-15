(function() {
  'use strict';

  let Dataset = {
    dataByTract: function(){
      let result = _.mapValues(this.rawData, (prop) => {
        return +prop[this.demographic]
      });
      return result;
    },
    nameDemographic: function(arr){
      let demographicDict = {B01001_003E:"Under 5 years",B01001_004E:"5 to 9 years",B01001_005E:"10 to 14 years",B01001_006E:"15 to 17 years",B01001_007E:"18 and 19 years",B01001_008E:"20 years",B01001_009E:"21 years",B01001_010E:"22 to 24 years",B01001_011E:"25 to 29 years",B01001_012E:"30 to 34 years",B01001_013E:"35 to 39 years",B01001_014E:"40 to 44 years",B01001_015E:"45 to 49 years",B01001_016E:"50 to 54 years",B01001_017E:"55 to 59 years",B01001_018E:"60 and 61 years",B01001_019E:"62 to 64 years",B01001_020E:"65 and 66 years",B01001_021E:"67 to 69 years",B01001_022E:"70 to 74 years",B01001_023E:"75 to 79 years",B01001_024E:"80 to 84 years",B01001_025E:"85 years and over",B01001_027E:"Under 5 years",B01001_028E:"5 to 9 years",B01001_029E:"10 to 14 years",B01001_030E:"15 to 17 years",B01001_031E:"18 and 19 years",B01001_032E:"20 years",B01001_033E:"21 years",B01001_034E:"22 to 24 years",B01001_035E:"25 to 29 years",B01001_036E:"30 to 34 years",B01001_037E:"35 to 39 years",B01001_038E:"40 to 44 years",B01001_039E:"45 to 49 years",B01001_040E:"50 to 54 years",B01001_041E:"55 to 59 years",B01001_042E:"60 and 61 years",B01001_043E:"62 to 64 years",B01001_044E:"65 and 66 years",B01001_045E:"67 to 69 years",B01001_046E:"70 to 74 years",B01001_047E:"75 to 79 years",B01001_048E:"80 to 84 years",B01001_049E:"85 years and over",a:"Under 5 years",b:"5 to 9 years",c:"10 to 14 years",d:"15 to 17 years",e:"18 and 19 years",f:"20 years",g:"21 years",h:"22 to 24 years",i:"25 to 29 years",j:"30 to 34 years",k:"35 to 39 years",l:"40 to 44 years",m:"45 to 49 years",n:"50 to 54 years",o:"55 to 59 years",p:"60 and 61 years",q:"62 to 64 years",r:"65 and 66 years",s:"67 to 69 years",t:"70 to 74 years",u:"75 to 79 years",v:"80 to 84 years",w:"85 years and over"}
      arr.map(el => el.name = demographicDict[el.name] );
      arr.map((el,i) => { if (el.name === undefined) { arr.splice(i,1) } });
      return arr;
    },
    gender: function(){
        return d3.select('input[name=mf]:checked').node().value;
    }
  };

  // Set default values:
  Dataset.censusTract = 'citywide';
  Dataset.demographic = 'B01001_002E';




  let mapchart = d3.select('#map_container')
    .append("svg")
    .chart("Choropleth")
    .range('q10s')
    .projection(d3.geo.mercator().center([-122.3129835144942, 37.95379741727219]))
    .scale(10000)
    .height(500)
    .width(480)
    .boundary('watershed');


  queue()
    .defer(d3.json, 'data/annual/2009.json')
    .defer(d3.json, 'data/watersheds-topo2.json')
    .await(drawFirst)

  function drawFirst(error, data, geo) {
    Dataset.rawData = data;
    let topoFeat = topojson.feature(geo, geo.objects['watersheds.geo']).features;
    let dataBind = Dataset.dataByTract();
    mapchart.draw({'Geo': topoFeat, 'ToBind': dataBind});
  };


  /* page listeners */
  // d3.select(window).on('resize', resize);
  d3.select('#dropdown').on('change', function(){
    return dispatcher.changeDemog()
  })
  d3.selectAll('input[name=mf]').on('change', function(){
    return dispatcher.changeGender()
  })
  d3.select("#citywide").on('click', function(){
    dispatcher.changeTract('citywide')
  });
  d3.select('#something').on('click', function(){
    dispatcher.changeTract('980200')
  });


  /* dispatcher for events */
  let dispatcher = d3.dispatch('changeTract', 'changeGender', 'changeDemog')
  dispatcher.on('changeTract', function(tract){
    Dataset.censusTract = tract;
    barchart.draw(Dataset.dataByDemographic());
    // redrawCharts();
  })
  dispatcher.on('changeGender', function(){
    barchart.gender(Dataset.gender())
    barchart.draw(Dataset.dataByDemographic());
    // setMapGender()
    // redrawMap() //choropleth.js needs redraw method
  })
  dispatcher.on('changeDemog', function(inputDemog){
    Dataset.demographic = inputDemog
    // if (inputDemog) {
    //   setActiveDropdown(inputDemog)
    //   return changeDemographic(inputDemog)
    // }
    // return changeDemographic(selectKey[demog][gender] )
  })


  // function setActiveDropdown(demog){
  //   var title = categoryDict[demog]
  //   var selList = document.getElementById('dropdown');
  //   for (var i = 0; i < selList.options.length; i++) {
  //    var tmpOptionText = selList.options[i].text;
  //    if(tmpOptionText == title) selList.selectedIndex = i;
  //   }
  // }


  function setTitle(newTitle){
    d3.select('#selected-title').text(newTitle)
  }

}());


