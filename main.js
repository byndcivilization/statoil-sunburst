'use strict';
var d3;
var width = 750,
    height = 500,
    radius = Math.min(width, height) / 2,
    color = d3.scale.category20c();

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, radius]);

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = { w: 250, h: 30, s: 5, t: 7 };

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

// initialize d3
var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// calculation for which number to pull from
var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function (d) { return d.total; });

var arc = d3.svg.arc()
    .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function (d) { return Math.max(0, y(d.y)); })
    .outerRadius(function (d) { return Math.max(0, y(d.y + d.dy)); });

// Keep track of the node that is currently being displayed as the root.
var node

// read in data
d3.json("./data/statoil_proj.json", function (error, root) {
   // Basic setup of page elements.
    node = root;
    // initializeBreadcrumbTrail();

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    var path = svg.datum(root).selectAll("path")
        .data(partition.nodes)
        .enter().append("path")
        .attr("display", function (d) { return d.depth ? null : "none"; }) // hide inner ring
        .attr("d", arc)
        .style("fill", function (d) { return color((d.children ? d : d.parent).name); })
        .on("click", function (d) {
            node = d;
            path.transition()
                .duration(1000)
                .attrTween("d", arcTweenZoom(d));
        })
        .each(stash);

    d3.selectAll("input").on("change", function change() {
        var value = this.value === "count"
            ? function () { return 1; }
            : function (d) { return d.total; };

        path
            .data(partition.value(value).nodes)
            .transition()
            .duration(1000)
            .attrTween("d", arcTweenData);
    });
});

d3.select(self.frameElement).style("height", height + "px");

// Setup for switching data: stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// When switching data: interpolate the arcs in data space.
function arcTweenData(a, i) {
  var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  function tween(t) {
    var b = oi(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  }
  if (i == 0) {
   // If we are on the first arc, adjust the x domain to match the root node
   // at the current zoom level. (We only need to do this once.)
    var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
    return function (t) {
      x.domain(xd(t));
      return tween(t);
    };
  } else {
    return tween;
  }
}

// When zooming: interpolate the scales.
function arcTweenZoom(d) {
  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function (d, i) {
    return i
        ? function (t) { return arc(d); }
        : function (t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}