    // Draw static traits (tick marks and labels) on every branch.
    g.selectAll(".trait-group")
      .data(root.links())
      .enter()
      .each(function(link) {
        const traits = link.target.data.traits;
        traits.forEach(trait => {
          // Get branch start and end coordinates.
          const x0 = link.source.y, y0 = link.source.x;
          const x1 = link.target.y, y1 = link.target.x;
          // Interpolate along the branch.
          const t = trait.position;
          const interpX = x0 + (x1 - x0) * t;
          const interpY = y0 + (y1 - y0) * t;
          // Compute the perpendicular vector to the branch.
          const dx = x1 - x0, dy = y1 - y0;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return;
          const perpX = -dy / len, perpY = dx / len;
          // Define tick mark length.
          const tickHalf = 5;
          const tickX1 = interpX - tickHalf * perpX;
          const tickY1 = interpY - tickHalf * perpY;
          const tickX2 = interpX + tickHalf * perpX;
          const tickY2 = interpY + tickHalf * perpY;
          // Append the tick mark line on the branch.
          g.append("line")
            .attr("class", "trait-tick")
            .attr("x1", tickX1)
            .attr("y1", tickY1)
            .attr("x2", tickX2)
            .attr("y2", tickY2)
            .style("stroke", "red")
            .style("stroke-width", 2)
            .on("click", (event) => {
              event.stopPropagation();
              showPopup(event, trait.name, "This is a key evolutionary trait: " + trait.name);
            });
          // Offset for text label so it doesn't overlap the branch.
          const offset = 8;
          const textX = interpX + (tickHalf + offset) * perpX;
          const textY = interpY + (tickHalf + offset) * perpY;
          // Append the trait label.
          g.append("text")
            .attr("class", "trait")
            .attr("x", textX)
            .attr("y", textY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text(trait.name)
            .on("click", (event) => {
              event.stopPropagation();
              showPopup(event, trait.name, "This is a key evolutionary trait: " + trait.name);
            });
        });
      });