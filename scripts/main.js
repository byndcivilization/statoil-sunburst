'use strict';
var d3;
// Dimensions
var width = 750,
    height = 600,
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

var partition = d3.layout.partition()
    .sort(null)
    .value(function (d) { return d.total; });

var arc = d3.svg.arc()
    .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function (d) { return Math.max(0, y(d.y)); })
    .outerRadius(function (d) { return Math.max(0, y(d.y + d.dy)); });

// Keep track of the node that is currently being displayed as the root.
var node;
var opts = [
        {'value': 'total', 'text': 'Total payments (NOK)'},
        // {'value': 'taxes', 'text': 'Tax payments (NOK)'},
        // {'value': 'royalties', 'text': 'Royalty payments (NOK)'},
        // {'value': 'fees', 'text': 'Fee payments (NOK)'},
        // {'value': 'bonuses', 'text': 'Bonus payments (NOK)'},
        // {'value': 'gov_entitlements_value', 'text': 'Government entitlements (NOK)'},
        // {'value': 'gov_entitlements_mmboe', 'text': 'Government entitlements (MMBOE'},
        {'value': 'count', 'text': 'Count'}
    ];

// read in data
d3.json("./data/statoil_proj.json", function (error, root) {
   // Basic setup of page elements.
    node = root;
    initializeBreadcrumbTrail();

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    svg.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // create visualization
    var path = svg.datum(root).selectAll("path")
        .data(partition.nodes)
        .enter().append("path")
        // .attr("display", function (d) { return d.depth ? null : "none"; }) // hide inner ring
        .attr("d", arc)
        .style("fill", function (d) { return color((d.children ? d : d.parent).name); })
        // .style("fill", function (d) { return d.depth ? null : "white"; }) // hide inner ring
        .style("fill-rule", "evenodd")
        .style("opacity", 1)
        .on("click", click)
        .on("mouseover", mouseover)
        .each(stash);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.value;

    var dropdown = d3.select("#dropdown").append("select")
        .attr("class", "form-control")
        .on("change", function change() {
            var value = this.value === "count"
                    ? function () { return 1; }
                    : function (d) { return d[this.value]; };

            path
                .data(partition.value(value).nodes)
                .transition()
                .duration(1000)
                .attrTween("d", arcTweenData);
        });

    var options = dropdown.selectAll("option")
            .data(opts)
            .enter()
            .append("option");

    options.text(function (d) { return d.text; })
         .attr("value", function (d) { return d.value; });


  function click(d) {
    node = d;
    path.transition()
      .duration(1000)
      .attrTween("d", arcTweenZoom(d));
  }
});

d3.select(self.frameElement).style("height", height + "px");

function mouseover(d) {

  var payments = numberWithCommas(d.value) + ' Million NOK';

  d3.select("#node_name")
      .text(d.name);

  d3.select("#dollars")
      .text(payments);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = getAncestors(d);
  updateBreadcrumbs(sequenceArray, payments);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  svg.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
  
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");

}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, payment) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return color[d.name]; });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(payment);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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