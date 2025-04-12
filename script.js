import { treeData } from './treeData.js';
const width = window.innerWidth;
const height = window.innerHeight;

const treeScale = 125
const popupPadding = 10

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
  xMin: yExtent[0] - treeScale/2,
  xMax: yExtent[1] + 2*treeScale, // Extra padding for labels on right.
  yMin: xExtent[0] - treeScale/2,
  yMax: xExtent[1] + treeScale/2
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

// Append circles for nodes, skipping blanks
node.append("circle")
  .filter(d => d.data.name !== "")
  .attr("r", 6)
  .attr("fill", "#69b3a2");

// Append labels for nodes.
// For internal nodes (groups), offset the label upward.
node.append("text")
  .attr("dy", d => d.children ? -10 : 4)
  .attr("x", 10)
  .text(d => d.data.name)
  .style("font-size", "14px");

// Draw polyphyletic groups.
function drawPolyphyleticGroups(groups, root) {
  const groupData = groups.map(group => {
    const nodes = root.descendants().filter(d => group.members.includes(d.data.name));
    const xExtent = d3.extent(nodes, d => d.x);
    const yExtent = d3.extent(nodes, d => d.y);

    return {
      name: group.name,
      members: nodes, // Store the member nodes for interaction
      xMin: xExtent[0],
      xMax: xExtent[1],
      yMin: yExtent[0],
      yMax: yExtent[1]
    };
  });

  const groupG = g.append("g").attr("class", "polyphyletic-groups");

  // Draw translucent bubbles around the group members.
  const bubbles = groupG.selectAll(".group-bubble")
    .data(groupData)
    .enter()
    .append("ellipse")
    .attr("class", "group-bubble")
    .attr("cx", d => (d.yMin + d.yMax) / 2)
    .attr("cy", d => (d.xMin + d.xMax) / 2)
    .attr("rx", d => (d.yMax - d.yMin) / 2 + 20) // Add padding
    .attr("ry", d => (d.xMax - d.xMin) / 2 + 20) // Add padding
    .attr("fill", "lightgray") // Default color is light gray
    .attr("opacity", 0.2);

  // Add group labels to the right of the members, vertically centered.
  const labels = groupG.selectAll(".group-label")
    .data(groupData)
    .enter()
    .append("text")
    .attr("class", "group-label")
    .attr("x", d => d.yMax + treeScale) // Increased horizontal offset to avoid overlap.
    .attr("y", d => (d.xMin + d.xMax) / 2) // Vertically center about the members.
    .attr("text-anchor", "start") // Align text to the left.
    .text(d => d.name)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "lightgray") // Default color is light gray
    .style("opacity", 0.6); // Slightly translucent text.

  // Add hover and click behavior for bubbles, labels, and leaf nodes.
  groupData.forEach(group => {
    const bubble = bubbles.filter(d => d.name === group.name);
    const label = labels.filter(d => d.name === group.name);
    const memberNodes = g.selectAll(".node").filter(d => group.members.includes(d));

    // Function to highlight the bubble and label.
    const highlightGroup = () => {
      bubble.style("fill", "green").style("opacity", 0.6);
      label.style("fill", "green").style("opacity", 1);
    };

    // Function to reset the bubble and label.
    const resetGroup = () => {
      bubble.style("fill", "lightgray").style("opacity", 0.2);
      label.style("fill", "lightgray").style("opacity", 0.6);
    };

    // Add hover behavior to the bubble and label.
    bubble.on("mouseover", highlightGroup).on("mouseout", resetGroup);
    label.on("mouseover", highlightGroup).on("mouseout", resetGroup);

    // Add hover and click behavior to the member nodes.
    memberNodes
      .on("mouseover", highlightGroup)
      .on("mouseout", resetGroup)
      .on("click", highlightGroup); // Keep the group highlighted on click.
  });
}

// Call the function to draw polyphyletic groups.
drawPolyphyleticGroups(treeData.polyphyleticGroups, root);

// Define zoom behavior with translateExtent to restrict panning.
const zoomBehavior = d3.zoom()
  .scaleExtent([1, 3]) // Allow zooming in as far as 3x but not zooming out beyond the bounding box.
  .translateExtent([
    [boundingBox.xMin, boundingBox.yMin],
    [boundingBox.xMax, boundingBox.yMax]
  ])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);

    // Update the zoom level in the cursor position div.
    const zoomLevel = event.transform.k.toFixed(2); // Get the zoom level from the transform.
    const currentText = d3.select("#cursor-position").text();
    const updatedText = currentText.replace(/zoom: \d+(\.\d+)?/, `zoom: ${zoomLevel}`);
    d3.select("#cursor-position").text(updatedText);
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

// Apply the initial zoom transform to the SVG.
svg.call(zoomBehavior.transform, initialTransform);

// Function to show the custom pop-up box.
function showPopup(event, title, description) {
  const popup = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  content.innerHTML = `<strong>${title}</strong><br>${description}`;
  popup.style.display = "block";

  // Disable zoom and pan by removing the zoom behavior.
  svg.on(".zoom", null);

  // Calculate the popup position.
  let left = event.pageX + popupPadding;
  let top = event.pageY + popupPadding;

  // Get the bounding box dimensions.
  const boundingBox = {
    xMin: 0,
    xMax: window.innerWidth,
    yMin: 0,
    yMax: window.innerHeight
  };

  // Get the popup dimensions.
  const popupWidth = popup.offsetWidth;
  const popupHeight = popup.offsetHeight;

  // Adjust the position to keep the popup inside the bounding box.
  if (left + popupWidth > boundingBox.xMax) {
    left = boundingBox.xMax - popupWidth - popupPadding; // Adjust to fit within the right edge.
  }
  if (top + popupHeight > boundingBox.yMax) {
    top = boundingBox.yMax - popupHeight - popupPadding; // Adjust to fit within the bottom edge.
  }

  // Apply the adjusted position.
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

// Function to close the pop-up box.
window.closePopup = function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";

  // Re-enable zoom and pan by reapplying the zoom behavior.
  svg.call(zoomBehavior);
};

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