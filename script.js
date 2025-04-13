export function initializeTreeVisualization(dataSource) {
  import(dataSource).then(({ treeData }) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const treeScale = 125;

    const padding = 15;

    // === NODE AND BRANCH VISUALIZATION ===
    const svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);
    const g = svg.append("g");
    const root = d3.hierarchy(treeData);

    // Align leaves at the rightmost position.
    const maxDepth = Math.max(...root.descendants().map(d => d.depth));
    root.descendants().forEach(d => d.y = d.depth * treeScale);
    root.leaves().forEach(d => d.y = maxDepth * treeScale);

    // Assign vertical positions to nodes based on the size of their subtree.
    function assignVerticalPositions(node, currentY = { value: 0 }) {
      if (!node.children || node.children.length === 0) {
        // Leaf node: assign the current vertical position and increment.
        node.x = currentY.value;
        currentY.value += treeScale / 3; // Increment for the next leaf.
      } else {
        // Internal node: recursively calculate positions for children.
        node.children.forEach(child => assignVerticalPositions(child, currentY));
        // Assign the internal node's position as the average of its children's positions.
        const childPositions = node.children.map(child => child.x);
        node.x = d3.mean(childPositions);
      }
    }

    const currentY = { value: 0 };

    // Start assigning vertical positions from the root.
    assignVerticalPositions(root);

    const xExtent = d3.extent(root.descendants(), d => d.x);
    const yExtent = d3.extent(root.descendants(), d => d.y);

    const boundingBox = {
      xMin: yExtent[0] - treeScale / 2,
      xMax: yExtent[1] + 2 * treeScale, // Extra padding for labels on right.
      yMin: xExtent[0] - treeScale / 2,
      yMax: xExtent[1] + treeScale / 2
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
      if (d.data.name === "Land Plants") {
        window.location.href = "landPlants.html";
      } else {
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

    // Add tick marks for traits on branches
    function addTraitTicks(root) {
      const links = root.links();
    
      links.forEach(link => {
        const traits = link.target.data.traits || [];
        const numTraits = traits.length;
    
        if (numTraits > 0) {
          // Calculate the source and target coordinates of the branch
          const x0 = link.source.x;
          const y0 = link.source.y;
          const x1 = link.target.x;
          const y1 = link.target.y;
    
          // Calculate the angle of the branch
          const dx = x1 - x0;
          const dy = y1 - y0;
          const branchLength = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / branchLength; // Unit vector in the x direction
          const unitY = dy / branchLength; // Unit vector in the y direction
    
          // Add a tick mark for each trait
          traits.forEach((trait, index) => {
            // Calculate the position of the tick mark along the branch
            const position = (index + 1) / (numTraits + 1); // Evenly space ticks
            const tickX = x0 + dx * position;
            const tickY = y0 + dy * position;
    
            // Calculate the perpendicular vector
            const perpX = -unitY * 5; // Perpendicular vector scaled for tick length
            const perpY = unitX * 5;
    
            // Draw the tick mark
            g.append("line")
              .attr("class", "trait-tick")
              .attr("x1", tickY - perpY)
              .attr("y1", tickX - perpX)
              .attr("x2", tickY + perpY)
              .attr("y2", tickX + perpX)
              .attr("stroke", "black")
              .attr("stroke-width", 2);
    
            // Adjust label placement dynamically to avoid overlap
            const labelOffset = 15; // Base offset for labels
            const angle = Math.atan2(dy, dx); // Angle of the branch in radians
            const labelDistance = labelOffset + index * 5; // Increase distance for each label to avoid overlap
    
            // Adjust label position based on the branch angle
            const labelX = tickY + Math.cos(angle) * labelDistance + perpY * 2;
            const labelY = tickX + Math.sin(angle) * labelDistance + perpX * 2;
    
            // Add a label for the trait
            g.append("text")
              .attr("class", "trait-label")
              .attr("x", labelX)
              .attr("y", labelY)
              .attr("text-anchor", "middle")
              .text(trait)
              .style("font-size", "12px")
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                showPopup(event, trait, `This is a key evolutionary trait: ${trait}`);
              });
          });
        }
      });
    }

    // Call the function after the tree is drawn
    addTraitTicks(root);    

    // === POLYPHYLETIC GROUPS ===
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
        .attr("rx", d => (d.yMax - d.yMin) / 2 + padding)
        .attr("ry", d => (d.xMax - d.xMin) / 2 + padding)
        .attr("fill", "lightgray")
        .attr("opacity", 0.2);

      // Add group labels to the right of the members, vertically centered.
      const labels = groupG.selectAll(".group-label")
        .data(groupData)
        .enter()
        .append("text")
        .attr("class", "group-label")
        .attr("x", d => d.yMax + treeScale)    // Increased horizontal offset to avoid overlap.
        .attr("y", d => (d.xMin + d.xMax) / 2) // Vertically center about the members.
        .attr("text-anchor", "start")          // Align text to the left.
        .text(d => d.name)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "lightgray")
        .style("opacity", 0.6);

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

    drawPolyphyleticGroups(treeData.polyphyleticGroups, root);

    // === ZOOMING AND LAYOUT ===
    // Define zoom behavior with translateExtent to restrict panning.
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 3]) // Allow zooming in as far as 3x but not zooming out beyond the bounding box.
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

    // === POPUPS ===
    // Function to show the custom pop-up box.
    function showPopup(event, title, description) {
      const popup = document.getElementById("popup");
      const content = document.getElementById("popup-content");
      content.innerHTML = `<strong>${title}</strong><br>${description}`;
      popup.style.display = "block";

      // Disable zoom and pan by removing the zoom behavior.
      svg.on(".zoom", null);

      // Calculate the popup position.
      let left = event.pageX + padding;
      let top = event.pageY + padding;

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
        left = boundingBox.xMax - popupWidth - padding; // Adjust to fit within the right edge.
      }
      if (top + popupHeight > boundingBox.yMax) {
        top = boundingBox.yMax - popupHeight - padding; // Adjust to fit within the bottom edge.
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
    };

    // === SPLIT SCREEN SUPPORT ===
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
  });
}