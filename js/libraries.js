'use strict'
let years=['1920','1921','1922','1923','1924','1925','1926','1927','1928','1929','1930','1931','1932','1933','1934','1935','1936','1937','1938','1939','1940','1941','1942','1943','1944','1945','1946','1947','1948','1949','1950','1951','1952','1953','1954','1955','1956','1957','1958','1959','1960','1961','1962','1963','1964','1965','1966','1967','1968','1969','1970','1971','1972','1973','1974','1975','1976','1977','1978','1979','1980','1981','1982','1983','1984','1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009']
let yearChooser = document.getElementById('year-dropdown');

years.forEach(addOption, yearChooser);

function addOption(el,i, arr){
  var option = document.createElement("option");
  option.value = el;
  option.text = el;
  if (el == '2009')
    option.selected = true;
  this.appendChild(option);
}
//adapted from: https://github.com/wrobstory/d3.chart.choropleth
(function() {
  d3.chart('Choropleth', {

      initialize: function() {

          var chart = this;

          chart.brews = {
            BuGn: ["#EDF8FB", "#CCECE6", "#CCECE6", "#66C2A4", "#41AE76", "#238B45", "#005824"],
            q10s: ["q0-9", "q1-9", "q2-9", "q3-9", "q4-9", "q5-9", "q6-9", "q7-9", "q8-9"]
          };
          chart.w = chart.base.attr('width') || 960;
          chart.h = chart.base.attr('height') || 500;
          chart._gender = chart._gender || 'male';
          chart._range = chart._range || chart.brews.BuGn;
          chart._domain = chart._domain || 0;
          chart._path = d3.geo.path();
          chart._projection = chart._projection || d3.geo.mercator();
          chart._scale = chart._scale || 1000;
          chart._boundary = chart._boundary || 'boundary';

          chart.quantize = d3.scale.quantize()
            .domain(chart._domain)
            .range(chart._range);

          function dataBind(data) {

            var chart = this.chart();

            chart.geo_data = data.Geo;
            chart.data = data.ToBind;

            var getMax = function(data) {
              var maxVal = -1;
              var maxId = null;
              for (var id in data) {
                var value = data[id];
                if (value > maxVal) {
                  maxId = id;
                  maxVal = value;
                }
              }
              return maxVal;
            };

            chart._domain = chart._domain === 0 ? [0, getMax(chart.data)] : chart._domain;
            chart.quantize.domain(chart._domain).range(chart._range);

            return this.selectAll("path")
                       .data(chart.geo_data);
          }

          function insert() {
              var chart = this.chart();

              var scale = chart._scale;

              return this.append("path")
                  .attr('class', function(d){ return chart.quantize(chart.data[d.id]) })
                  // .style("fill", function (d) { return chart.quantize(chart.data[d.id]); })
                  .classed(chart._boundary, true)
                  .attr("d", chart._path.projection(chart._projection
                                                         .scale(chart._scale)
                                                         .translate([chart.w / 2, chart.h / 2])));
          }

          var mapBase = this.base
            .append('g')
            .classed('geodata', true)
            .attr('height', chart.h)
            .attr('width', chart.w);

          chart.layer('map', mapBase, {
              dataBind: dataBind,
              insert: insert
          });
      },

      width: function(newWidth) {
      if (arguments.length === 0) {
        return this.w;
      }
      this.w = newWidth;
      return this;
      },

      height: function(newHeight) {
        if (arguments.length === 0) {
          return this.h;
        }
        this.h = newHeight;
        return this;
      },

      gender: function(newGender) {
        if (arguments.length === 0) {
          return this._gender;
        }
        this._gender = newGender;
        return this;
      },

      boundary: function(newBoundary) {
        if (arguments.length === 0) {
          return this._boundary;
        }
        this._boundary = newBoundary;
        return this;
      },

     range: function(newRange) {
       if (arguments.length === 0) {
          return this._range;
        }
        this._range = this.brews[newRange];
        return this;
      },

     domain: function(newDomain) {
       if (arguments.length === 0) {
          return this._domain;
        }
        this._domain= newDomain;
        return this;
      },

      projection: function(newProj) {
       if (arguments.length === 0) {
          return this._projection;
        }
        this._projection= newProj;
        return this;
      },

      scale: function(newScale) {
       if (arguments.length === 0) {
          return this._scale;
        }
        this._scale = newScale;
        return this;
      }

  });
}());