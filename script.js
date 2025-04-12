import { treeData } from './treeData.js';
const width = window.innerWidth;
const height = window.innerHeight;

const treeScale = 100

// Create the SVG container.
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

// Create a group for the tree elements.
const g = svg.append("g");

// Create the hierarchy from the tree data.
const root = d3.hierarchy(treeData);

// Use a tree layout with increased vertical spacing ([vertical, horizontal]).
const treeLayout = d3.tree().nodeSize([treeScale, treeScale]);
treeLayout(root);

// Align leaves at the rightmost position.
const maxDepth = Math.max(...root.descendants().map(d => d.depth));
root.descendants().forEach(d => d.y = d.depth * treeScale);
root.leaves().forEach(d => d.y = maxDepth * treeScale);

// Calculate the bounding box of the tree.
const xExtent = d3.extent(root.descendants(), d => d.x);
const yExtent = d3.extent(root.descendants(), d => d.y);

const boundingBox = {
  xMin: yExtent[0] - treeScale,
  xMax: yExtent[1] + treeScale + 50, // Extra padding for labels on right.
  yMin: xExtent[0] - treeScale,
  yMax: xExtent[1] + treeScale
};

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

// Define zoom behavior with translateExtent to restrict panning.
const zoomBehavior = d3.zoom()
  .scaleExtent([1, 3]) // Allow zooming in as far as 3x but not zooming out beyond the bounding box.
  .translateExtent([
    [boundingBox.xMin, boundingBox.yMin],
    [boundingBox.xMax, boundingBox.yMax]
  ])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

// Apply zoom behavior to the SVG.
svg.call(zoomBehavior);

// Set the initial zoom to fit the entire tree within the viewport.
const initialScale = Math.min(
  width / (boundingBox.xMax - boundingBox.xMin),
  height / (boundingBox.yMax - boundingBox.yMin)
);
const initialTransform = d3.zoomIdentity
  .translate(
    (width - (boundingBox.xMax + boundingBox.xMin) * initialScale) / 2,
    (height - (boundingBox.yMax + boundingBox.yMin) * initialScale) / 2
  )
  .scale(initialScale);

svg.call(zoomBehavior.transform, initialTransform);

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

// Function to update the tree layout and zoom on window resize.
function updateLayout() {
  // Update width and height based on the new window size.
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  // Update the SVG container size.
  svg.attr("width", newWidth).attr("height", newHeight);

  // Recalculate the bounding box.
  const xExtent = d3.extent(root.descendants(), d => d.x);
  const yExtent = d3.extent(root.descendants(), d => d.y);

  const boundingBox = {
    xMin: yExtent[0] - treeScale,
    xMax: yExtent[1] + treeScale + 50, // Extra padding for labels on right.
    yMin: xExtent[0] - treeScale,
    yMax: xExtent[1] + treeScale
  };

  // Update zoom behavior with the new bounding box.
  zoomBehavior.translateExtent([
    [boundingBox.xMin, boundingBox.yMin],
    [boundingBox.xMax, boundingBox.yMax]
  ]);

  // Preserve the current zoom transform.
  const currentTransform = d3.zoomTransform(svg.node());
  svg.call(zoomBehavior.transform, currentTransform);
}

// Add an event listener to handle window resize.
window.addEventListener("resize", updateLayout);

// Initial call to set up the layout.
updateLayout();