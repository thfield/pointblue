// (function() {
  'use strict'
  let dropdown = {
    yearChooser: document.getElementById('year-dropdown'),
    past: function(){
      this.clearOptions()
      for(let i=1920; i <2010; i++){
        this.addOption(i);
      }
    },
    future: function(){
      this.clearOptions()
      for(let i=2010; i <2099; i++){
        this.addOption(i);
      }
    },
    addOption: function(el,i, arr){
      var option = document.createElement("option");
      option.value = el;
      option.text = el;
      // if (el == '2009')
      //   option.selected = true;
      this.yearChooser.appendChild(option);
    },
    clearOptions: function(){
      var myNode = this.yearChooser;
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  }

  let Dataset = {
    defaults: {
      parameter: 'temp',
      // year: 2009,
      boundary: 'watershed'
    },
    model: function (){
      return d3.select('#model-dropdown').node().value;
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

  // tooltip methods
  let tt = {
    init: function(element){
      d3.select(element).append('div')
          .attr('id', 'tooltip')
          .attr('class', 'hidden')
        .append('span')
          .attr('class', 'value')
    },
    follow: function(element, caption, options) {
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
    },
    hide: function() {
      d3.select('#tooltip').classed('hidden', true);
    }
  }



  dropdown.past();
  let margin = {top: 0, left: 40, bottom: 40, right: 0},
      width = parseInt(d3.select('#map_container').style('width')),
      // width = window.getComputedStyle(document.getElementById("map_container"), null).getPropertyValue("width"),
      barchartWidth = parseInt(d3.select('#barchart_container').style('width')) - margin.left - margin.right
    // width = width - margin.left - margin.right
  let mapRatio = 1,
      height = width * mapRatio,
      barchartHeight = (width/3)- margin.top - margin.bottom,
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

  // let tiler = d3.geo.tile()
  //     .size([width, height])

  let projection = d3.geo.mercator()
      .center([-122.31, 37.95])
      .scale(width*scaleMultiplier)
      .translate([width / 2, height / 2])

  var zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 5])
      .on("zoom", zoomed);

  let path = d3.geo.path()
      .projection(projection)

  mapsvg.append('g')
      .attr('class', 'geoBoundaries')

  mapsvg.call(zoom)

  mapsvg.append("g")
    .attr("class", "legendQuant")
    .attr("transform", "translate(0,10)");

  let legend = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .shapeWidth(width*.8/9)
    .shapePadding(6)
    .orient('horizontal')
    .useClass(true)
    .scale(quantize);

  tt.init('body')


  function zoomed() {
    var g = d3.select('#map_container .geoBoundaries');
    g.style("stroke-width", 1 / d3.event.scale + "px");
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }



  // download data and draw map
  queue()
    .defer(d3.json, 'data/watersheds-topo2.json')
    .defer(d3.json, 'data/'+ Dataset.model() +'/annual/'+Dataset.year()+'.json')
    .defer(d3.json, 'data/'+ Dataset.model() +'/basin/1113810002.json')
    .await(renderFirst)

  function renderFirst(error, geo, data, annual) {
    Dataset.rawData = data;
    Dataset.basinData = annual;
    Dataset.topo = topojson.feature(geo, geo.objects['watersheds.geo']).features;
    // let dataBind = Dataset.dataByTract();
    // mapchart.draw({'Geo': topoFeat, 'ToBind': dataBind});
    mapsvg.call(renderGeo);
    colorGeo(true);
    drawLegend();
    barsvg.call(renderBarChart);
  };



  /* map drawing and updating methods :
   * renderX = first time
   * drawX   = general
   * updateX = redraw
   */
  function drawLegend(){
    mapsvg.select(".legendQuant")
      .call(legend);
  }

  function renderGeo(svg){
    d3.select('.geoBoundaries')
      .selectAll('.' + Dataset.defaults.boundary)
        .data(Dataset.topo)
      .enter().append('path')
        .attr('class', Dataset.defaults.boundary)
        .attr('d', path)
        .on('click', function(d){ return dispatcher.changeGeo(d.id) })
        .on('mouseover', function(d) {
          let me = d3.select(this),
              value = colorMap.get(d.id),
              thisText = d.properties.name + '<br>watershed id: ' + d.id + '<br> value: '+ prettify(value);
          tt.follow(me, thisText)
          // return setTitle(value)
        })
        .on("mouseout", tt.hide )
  }

  function renderBarChart(svg){
    let param = Dataset.parameter()
    x.domain(Dataset.basinData.map(function(d) { return d.year}));
    y.domain(d3.extent(Dataset.basinData, function(d) { return d[param]; } ));
    let domain = y.domain();
    if(param === 'temp'){ domain = [domain[1], domain[0]] }
    quantize.domain(domain);
    let chart = svg.append('g')//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    chart.append("g")
        .attr("class", "y axis")
        .attr("transform",  function(d) {
          return 'translate('+margin.left+',0)'
        })
        .call(yAxis)
    chart.selectAll(".bar")
        .data(Dataset.basinData)
      .enter().append("rect")
      // .enter().append("circle")
        .attr('class', function(d){
          return 'bar ' + quantize(d[param])
        })
        // .attr("cx", function(d) { return x(d.year); })
        // .attr("cy", function(d) { return y(d[param]); })
        // .attr("r", '5')
        .attr("x", function(d) { return x(d.year); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d[param]); })
        .attr("height", function(d) { return barchartHeight - y(d[param]); })
        .on("mouseover", function(d){
          var me = d3.select(this),
              thisText = d.year + ': '+ prettify(d[param]);
          return tt.follow(me, thisText);
        } )
        .on("mouseout", tt.hide );
    // svg.classed('hidden', true);
  }

  function updateBarChart(data){
    let param = Dataset.parameter()
    x.domain(data.map(function(d) {return d.year}));
    y.domain(d3.extent(data, function(d) { return d[param]; } ));
    let domain = y.domain();
    if(param === 'temp'){ domain = [domain[1], domain[0]] }
    quantize.domain(domain);

    let bars = d3.selectAll('.bar')
    bars.data(data)
        .attr('class', function(d){
          return 'bar ' + quantize(d[param])
        })
        // .attr("cy", function(d) { return y(d[param]); })
        .attr("y", function(d) { return y(d[param]); })
        .attr("height", function(d) { return barchartHeight - y(d[param]); })
        .on("mouseover", function(d){
          var me = d3.select(this),
              thisText = d.year + ': '+ prettify(d[param]);
          return tt.follow(me, thisText);
        })

    d3.select('.y.axis').call(yAxis);
    // d3.select('.x.axis').call(xAxis);
    // barsvg.classed('hidden', false);
  }

  function colorGeo(reverse){
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

    let boundaries = mapsvg.select('.geoBoundaries').selectAll('.'+ Dataset.defaults.boundary)
    boundaries
      .attr('class', function(d){
        return Dataset.defaults.boundary+ ' ' + quantize(colorMap.get(d.id))
      });
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
  d3.select('#model-dropdown').on('change', function(){
    return dispatcher.changeModel()
  })
  // d3.select(window).on('resize', resize);




  /* dispatcher events */
  let dispatcher = d3.dispatch('changeGeo', 'changeParameter', 'changeYear', 'changeModel')
  dispatcher.on('changeGeo', function(geo){
    d3.json( 'data/'+ Dataset.model() +'/basin/'+ geo + '.json', function(data){
      Dataset.basinData = data;
      updateBarChart(Dataset.basinData)
    })
  })
  dispatcher.on('changeParameter', function(){
    if (Dataset.parameter() === 'temp'){
      colorGeo(true);
    }else {
      colorGeo();
    };
    updateBarChart(Dataset.basinData);
  })
  dispatcher.on('changeYear', function(year){
    if (year) {
      Dataset.setDropdown(year);
    }
    year = year || Dataset.year();
    d3.json('data/'+ Dataset.model() +'/annual/'+ year +'.json', function(data){
      Dataset.rawData = data;
      colorGeo();
    })
  })
  dispatcher.on('changeModel', function(){
    if(Dataset.model()==='HST'){ dropdown.past() }
    else{ dropdown.future();}
    // dispatcher.changeYear()
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

  // function resize() {
  //   // adjust things when the window size changes
  //   width = parseInt(d3.select('#map_container').style('width'));
  //   barchartWidth = parseInt(d3.select('#barchart_container').style('width'));
  //   width = width - margin.left - margin.right;
  //   height = width * mapRatio;
  //
  //   // update projection
  //   projection
  //       .translate([width / 2, height / 2])
  //       .scale(width*scaleMultiplier);
  //   x.rangeRoundBands([0, barchartWidth], .1);
  //   xAxis.scale(x)
  //   barsvg.select(".x.axis")
  //       .call(xAxis)
  //   barsvg.selectAll(".x text")
  //         .attr("y", 0)
  //         .attr("x", 9)
  //         .attr("dy", ".35em")
  //         .style("text-anchor", "start")
  //
  //   // resize the map container
  //   mapsvg
  //       .style('width', width + 'px')
  //       .style('height', height + 'px');
  //   barsvg
  //       .style('width', barchartWidth + 'px');
  //
  //   barsvg.selectAll(".bar")
  //     .attr("width", x.rangeBand())
  //     .attr("x", function(d) { return x(d.category); })
  //
  //   // resize the map
  //   mapsvg.select('.geoBoundaries').attr('d', path);
  //   mapsvg.selectAll('.' + Dataset.defaults.boundary).attr('d', path);
  // }




  function setTitle(newTitle){
    d3.select('#selected-title').text(newTitle);
  }


// })()