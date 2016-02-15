// (function() {
  'use strict';
  let Dataset = {
    defaults: {
      parameter: 'temp',
      year: 2009,
      boundary: 'watershed'
    },
    dataByBoundary: function(val){
      let result = {}
      this.rawData.forEach((boundary)=>{
        result[boundary.id] = boundary[val];
      })
      return result;
    },
    parameter: function(){
        return d3.select('input[name=radio-parameter]:checked').node().value;
    },
    year: function (){
      return d3.select('#year-dropdown').node().value;
    },
    setDropdown: function(annum){
      let selList = document.getElementById('year-dropdown');
      for (let i = 0; i < selList.options.length; i++) {
       let tmpOptionText = selList.options[i].text;
       if(tmpOptionText == annum) selList.selectedIndex = i;
     };
    }

  };

  let margin = {top: 10, left: 10, bottom: 10, right: 10},
      width = parseInt(d3.select('#map_container').style('width')),
      barchartWidth = parseInt(d3.select('#barchart_container').style('width'))
    width = width - margin.left - margin.right
  let mapRatio = 1,
      height = width * mapRatio,
      barchartHeight = (width)/3,
      scaleMultiplier = 18 // TODO: set this programmitically with bounding box from turf

  let x = d3.scale.ordinal()
      .rangeRoundBands([0, barchartWidth], .1);

  let y = d3.scale.linear()
      .range([barchartHeight, 0]);

  let xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  let yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10);

  let mapsvg = d3.select('#map_container').append('svg')
      .attr('height', height)
      .attr('id','map')
  var barsvg = d3.select('#barchart_container').append('svg')
      .attr('height', barchartHeight)
      .attr('id','barchart')

  let colorMap = d3.map(),
      keymap = []

  let quantize = d3.scale.quantize()
      .range(d3.range(9).map(function(i) { return 'q' + i + '-9' }))

  let prettify = d3.format(".01f")

  let tiler = d3.geo.tile()
      .size([width, height])

  let projection = d3.geo.mercator()
      .center([-122.31, 37.95])
      .scale(width*scaleMultiplier)
      .translate([width / 2, height / 2])

  let path = d3.geo.path()
      .projection(projection)

  mapsvg.append("g")
    .attr("class", "legendQuant")
    .attr("transform", "translate(0,10)");

  let legend = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .shapeWidth(width/9)
    .orient('horizontal')
    .useClass(true)
    .scale(quantize);

  ttInit('body')

  // download data and draw map
  queue()
    .defer(d3.json, 'data/annual/2009.json')
    .defer(d3.json, 'data/watersheds-topo2.json')
    .await(drawFirst)

  function drawFirst(error, data, geo) {
    Dataset.rawData = data;
    Dataset.topo = topojson.feature(geo, geo.objects['watersheds.geo']).features;
    // let dataBind = Dataset.dataByTract();
    // mapchart.draw({'Geo': topoFeat, 'ToBind': dataBind});
    setColors(true);
    mapsvg.call(drawBoundaries);
    colorInBoundaries();
    drawLegend();
    barsvg.call(drawBarChart);
  };

  function drawBoundaries(svg){
    svg.append('g')
        .attr('class', 'geoBoundaries')
      .selectAll('.' + Dataset.defaults.boundary)
        .data(Dataset.topo)
      .enter().append('path')
        .attr('class', Dataset.defaults.boundary)
        .attr('d', path)
        .on('click', function(d){ return dispatcher.changeGeo(d.id) })
        .on('mouseover', function(d) {
          let me = d3.select(this),
              value = colorMap.get(d.id),
              thisText = 'watershed id: ' + d.id + '<br> value: '+ prettify(value);
          ttFollow(me, thisText)
          return setTitle(value)
        })
        .on("mouseout", ttHide )
  }

  function drawBarChart(svg){
    let param = Dataset.parameter()
    d3.json('data/basin/1113810002.json', function(data){
      let chart = svg.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(data.map(function(d) { return d.year}));
      y.domain([0, d3.max(data, function(d) { return d[param]; } )]);
      quantize.domain( y.domain() )

      chart.append("g")
          .attr("class", "x axis")
          .attr("transform",  function(d) {
            return 'translate(0,' + barchartHeight + ')'
          })
          .attr('text-anchor', 'start')
          .call(xAxis)
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "start");

      chart.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        // .append("text")
        //   .attr("transform", "rotate(-90)")
        //   .attr("y", 6)
        //   .attr("dy", ".71em")
        //   .style("text-anchor", "end")
        //   .text("Population");

      chart.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr('class', function(d){
            return 'bar ' + quantize(d[param])
          })
          .attr("x", function(d) { return x(d.year); })
          .attr("width", x.rangeBand())
          .attr("y", function(d) { return y(d[param]); })
          .attr("height", function(d) { return barchartHeight - y(d[param]); })
          // .on('click', function(d){
          //   return dispatcher.changeDemo(d.acs)
          // })
          .on("mouseover", function(d){
            var me = d3.select(this),
                thisText = d[param];
            return ttFollow(me, thisText)
          } )
          .on("mouseout", ttHide );

      // svg.append('text')
      //   .attr("y", 16)
      //   .attr("x", 25)
      //   .attr("class", "tracttitle")
      //   .text('Census Tract '+ currentTract )
    });
    svg.classed('hidden', true);
  }

  function changeBarChart(boundary){
    let param = Dataset.parameter()
    d3.json('data/basin/'+ boundary + '.json', function(data){
      x.domain(data.map(function(d) { return d.year}));
      y.domain([0, d3.max(data, function(d) { return d[param]; } )]);
      quantize.domain( y.domain() )

      var bars = d3.selectAll('.bar')
      bars.data(data)
          .attr('class', function(d){
            return 'bar ' + quantize(d[param])
          })
          .attr("y", function(d) { return y(d[param]); })
          .attr("height", function(d) { return barchartHeight - y(d[param]); })
      barsvg.classed('hidden', false)
    })
  }

  function colorInBoundaries(){
    var boundaries = mapsvg.select('.geoBoundaries').selectAll('.'+ Dataset.defaults.boundary)
    boundaries
      .attr('class', function(d){
        return Dataset.defaults.boundary+ ' ' + quantize(colorMap.get(d.id))
      });
  }

  function setColors(reverse){
    keymap.length = 0
    let param = Dataset.parameter();
    keymap = Dataset.rawData.map((boundary)=>{
      colorMap.set(boundary.id, +boundary[param]);
      return +boundary[param];
    })
    let domain = d3.extent(keymap)
    if(reverse){ domain = [domain[1], domain[0]] }
    quantize.domain(domain);
    drawLegend();
  }

  function drawLegend(){
    mapsvg.select(".legendQuant")
      .call(legend);
  }

  /* page listeners */
  d3.select('#year-dropdown').on('change', function(){
    return dispatcher.changeYear()
  })
  d3.selectAll('input[name=radio-parameter]').on('change', function(){
    return dispatcher.changeParameter()
  })
  d3.select("#citywide").on('click', function(){
    dispatcher.changeGeo('citywide')
  });
  // d3.select(window).on('resize', resize);




  let dispatcher = d3.dispatch('changeGeo', 'changeParameter', 'changeYear')
  dispatcher.on('changeGeo', function(geo){
    changeBarChart(geo);
  })
  dispatcher.on('changeParameter', function(){
    console.log(Dataset.parameter())
    if (Dataset.parameter() === 'temp'){
      setColors(true);
    }else {
      setColors();
    };
    colorInBoundaries();
  })
  dispatcher.on('changeYear', function(year){
    if (year) {
      Dataset.setDropdown(year);
    }
    year = year || Dataset.year();
    d3.json('data/annual/'+ year +'.json', function(data){
      Dataset.rawData = data;
      setColors();
      colorInBoundaries();
    })
  })


  // function renderTiles(svg, type) {
  //   svg.append('g')
  //       .attr('class', type)
  //     .selectAll('g')
  //       .data(tiler
  //         .scale(projection.scale() * 2 * Math.PI)
  //         .translate(projection([0, 0])))
  //     .enter().append('g')
  //       .each(function(d) {
  //         let g = d3.select(this)
  //         // d3.json('http://' + ['a', 'b', 'c'][(d[0] * 31 + d[1]) % 3] + '.tile.openstreetmap.us/vectiles-' + type + '/' + d[2] + '/' + d[0] + '/' + d[1] + '.json', function(error, json) {
  //         // use the locally cached tiles
  //         d3.json('data/osm/' + ['a', 'b', 'c'][(d[0] * 31 + d[1]) % 3] + '-highroad-'+ d[2] + '-' + d[0] + '-' + d[1] + '.json', function(error, json) {
  //           g.selectAll('path')
  //               .data(json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key }))
  //             .enter().append('path')
  //               .attr('class', function(d) { return d.properties.kind })
  //               .attr('d', path)
  //         })
  //       })
  // }

//   function resize() {
//     // adjust things when the window size changes
//     width = parseInt(d3.select('#map_container').style('width'));
//     barchartWidth = parseInt(d3.select('#barchart_container').style('width'));
//     width = width - margin.left - margin.right;
//     height = width * mapRatio;
//
//     // update projection
//     projection
//         .translate([width / 2, height / 2])
//         .scale(width*scaleMultiplier);
//     x.rangeRoundBands([0, barchartWidth], .1);
//     xAxis.scale(x)
//     barsvg.select(".x.axis")
//         .call(xAxis)
//     barsvg.selectAll(".x text")
//           .attr("y", 0)
//           .attr("x", 9)
//           .attr("dy", ".35em")
//           .style("text-anchor", "start")
//
//     // resize the map container
//     mapsvg
//         .style('width', width + 'px')
//         .style('height', height + 'px');
//     barsvg
//         .style('width', barchartWidth + 'px');
//
//     barsvg.selectAll(".bar")
//       .attr("width", x.rangeBand())
//       .attr("x", function(d) { return x(d.category); })
//
//     // resize the map
//     mapsvg.select('.neighborhoods').attr('d', path);
//     mapsvg.selectAll('.neighborhood').attr('d', path);
//     mapsvg.select('.highroad').attr('d', path);
//     mapsvg.selectAll('.minor_road').attr('d', path);
//     mapsvg.selectAll('.major_road').attr('d', path);
//     mapsvg.selectAll('.highway').attr('d', path);
//     mapsvg.select('.censustracts').attr('d', path);
//     mapsvg.selectAll('.censustract').attr('d', path);
//
// }

function ttInit(element){
  d3.select(element).append('div')
      .attr('id', 'tooltip')
      .attr('class', 'hidden')
    .append('span')
      .attr('class', 'value')
}

function ttFollow(element, caption, options) {
  element.on('mousemove', null);
  element.on('mousemove', function() {
    let position = d3.mouse(document.body);
    d3.select('#tooltip')
      .style('top', ( (position[1] + 30)) + "px")
      .style('left', ( position[0]) + "px");
    d3.select('#tooltip .value')
      .html(caption);
  });
  d3.select('#tooltip').classed('hidden', false);
};

function ttHide() {
  d3.select('#tooltip').classed('hidden', true);
}

function setTitle(newTitle){
  d3.select('#selected-title').text(newTitle);
}


// })()