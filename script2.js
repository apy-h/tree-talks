import { treeData } from './landPlantData.js';
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

// Align leaves at the rightmost position.
const maxDepth = Math.max(...root.descendants().map(d => d.depth));
root.descendants().forEach(d => d.y = d.depth * treeScale);
root.leaves().forEach(d => d.y = maxDepth * treeScale);

// Calculate the total number of leaf nodes.
const leafNodes = root.leaves();
const totalLeafNodes = leafNodes.length;

// Assign vertical positions to nodes based on the size of their subtree.
function assignVerticalPositions(node, currentY = { value: 0 }) {
  if (!node.children || node.children.length === 0) {
    // Leaf node: assign the current vertical position and increment.
    node.x = currentY.value;
    currentY.value += treeScale/3; // Increment for the next leaf.
  } else {
    // Internal node: recursively calculate positions for children.
    node.children.forEach(child => assignVerticalPositions(child, currentY));
    // Assign the internal node's position as the average of its children's positions.
    const childPositions = node.children.map(child => child.x);
    node.x = d3.mean(childPositions);
  }
}

// Define currentY as an object with a value property.
const currentY = { value: 0 };

// Start assigning vertical positions from the root.
assignVerticalPositions(root);

// Recalculate positions for all nodes to ensure proper alignment.
root.descendants().forEach(d => {
  if (!d.children) {
    // Leaf nodes already positioned.
    return;
  }

  // For internal nodes, position them based on the average position of their children.
  const childPositions = d.children.map(child => child.x);
  d.x = d3.mean(childPositions);
});

// Calculate the bounding box of the tree.
const xExtent = d3.extent(root.descendants(), d => d.x);
const yExtent = d3.extent(root.descendants(), d => d.y);

const boundingBox = {
  xMin: yExtent[0] - treeScale/2,
  xMax: yExtent[1] + 2*treeScale, // Extra padding for labels on right.
  yMin: xExtent[0] - treeScale/2,
  yMax: xExtent[1] + treeScale/2
};

// Set the SVG height to fit the entire tree.
const treeHeight = currentY.value;
svg.attr("height", Math.max(treeHeight, height)); // Ensure the SVG is tall enough

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

// Add click behavior to nodes.
node.on("click", (event, d) => {
  event.stopPropagation();
  if (d.data.name === "Land Plants (Embryophytes)") {
    // Redirect to the Land Plants page.
    window.location.href = "landPlants.html";
  } else {
    // Show popup for other nodes.
    showPopup(event, d.data.name, d.data.description);
  }
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

  // Add hover and click behavior for bubbles and labels.
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
      g.selectAll(".group-bubble")
        .style("fill", "lightgray")
        .style("opacity", 0.2);

      g.selectAll(".group-label")
        .style("fill", "lightgray")
        .style("opacity", 0.6);
    };

    // Add hover behavior to the bubble and label.
    bubble.on("mouseover", highlightGroup).on("mouseout", resetGroup);
    label.on("mouseover", highlightGroup).on("mouseout", resetGroup);

    // Ensure member nodes retain their click behavior for popups.
    memberNodes
      .on("mouseover", highlightGroup)
      .on("mouseout", resetGroup)
      .on("click", (event, d) => {
        event.stopPropagation();
        showPopup(event, d.data.name, d.data.description); // Ensure popup opens on click.
      });
  });
}

// Call the function to draw polyphyletic groups.
drawPolyphyleticGroups(treeData.polyphyleticGroups, root);

// Define zoom behavior with translateExtent to restrict panning.
const zoomBehavior = d3.zoom()
  .scaleExtent([0.5, 3]) // Allow zooming in as far as 3x but not zooming out beyond the bounding box.
  .translateExtent([
    [boundingBox.xMin, boundingBox.yMin],
    [boundingBox.xMax, Math.max(boundingBox.yMax, treeHeight)]
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

  // Highlight the bubble and label for all groups the plant belongs to.
  const groups = treeData.polyphyleticGroups.filter(group =>
    group.members.includes(title)
  );

  groups.forEach(group => {
    const bubble = g.selectAll(".group-bubble").filter(d => d.name === group.name);
    const label = g.selectAll(".group-label").filter(d => d.name === group.name);

    bubble.style("fill", "green").style("opacity", 0.6);
    label.style("fill", "green").style("opacity", 1);
  });
}

// Function to close the pop-up box.
window.closePopup = function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";

  // Re-enable zoom and pan by reapplying the zoom behavior.
  svg.call(zoomBehavior);

  // Reset group highlights.
  resetGroup();
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

  const newBoundingBox = {
    xMin: yExtent[0] - treeScale,
    xMax: yExtent[1] + 2 * treeScale, // Extra padding for labels on right.
    yMin: xExtent[0] - treeScale,
    yMax: xExtent[1] + treeScale
  };

  // Update zoom behavior with the new bounding box.
  zoomBehavior.translateExtent([
    [newBoundingBox.xMin, newBoundingBox.yMin],
    [newBoundingBox.xMax, newBoundingBox.yMax]
  ]);

  // Reapply the zoom behavior to the SVG.
  svg.call(zoomBehavior);

  // Preserve the current zoom transform.
  const currentTransform = d3.zoomTransform(svg.node());
  svg.call(zoomBehavior.transform, currentTransform);
}

// Add an event listener to handle window resize.
window.addEventListener("resize", updateLayout);

// Initial call to set up the layout.
updateLayout();