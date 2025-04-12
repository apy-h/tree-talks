import { treeData } from './treeData.js';
const width = window.innerWidth;
const height = window.innerHeight;

// Create the SVG container.
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

// Define zoom behavior with translateExtent to restrict panning.
const zoomBehavior = d3.zoom()
  .scaleExtent([0.5, 5])
  .translateExtent([[-100, -100], [width + 100, height + 100]])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoomBehavior);

// Create a group for the tree elements.
const g = svg.append("g");

// Create the hierarchy from the tree data.
const root = d3.hierarchy(treeData);

// Use a tree layout with increased vertical spacing ([vertical, horizontal]).
const treeLayout = d3.tree().nodeSize([80, 200]);
treeLayout(root);

// Align leaves at the rightmost position.
const maxDepth = Math.max(...root.descendants().map(d => d.depth));
root.descendants().forEach(d => d.y = d.depth * 200);
root.leaves().forEach(d => d.y = maxDepth * 200);

// Draw links (branches) between nodes.
g.selectAll(".link")
  .data(root.links())
  .enter()
  .append("path")
  .attr("class", "link")
  .attr("stroke", "#555")
  .attr("fill", "none")
  .attr("stroke-width", 2)
  .attr("d", d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x));

// Draw nodes as groups.
const node = g.selectAll(".node")
  .data(root.descendants())
  .enter()
  .append("g")
  .attr("class", "node")
  .attr("transform", d => `translate(${d.y},${d.x})`)
  .on("click", (event, d) => {
    event.stopPropagation();
    showPopup(event, d.data.name, d.data.description);
  });

// Append circles for nodes.
node.append("circle")
  .attr("r", 6)
  .attr("fill", "#69b3a2");

// Append labels for nodes.
// For internal nodes (groups), offset the label upward.
node.append("text")
  .attr("dy", d => d.children ? -10 : 4)
  .attr("x", 10)
  .text(d => d.data.name)
  .style("font-size", "14px");

// Function to show the custom pop-up box.
function showPopup(event, title, description) {
  const popup = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  content.innerHTML = `<strong>${title}</strong><br>${description}`;
  popup.style.display = "block";
  popup.style.left = (event.pageX + 10) + "px";
  popup.style.top = (event.pageY + 10) + "px";
}

// Function to close the pop-up box.
function closePopup() {
  document.getElementById("popup").style.display = "none";
}