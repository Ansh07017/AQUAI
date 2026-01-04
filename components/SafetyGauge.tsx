
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { COLORS } from '../constants';

interface SafetyGaugeProps {
  value: number; // 0 to 100
  label: string;
  unit: string;
}

const SafetyGauge: React.FC<SafetyGaugeProps> = ({ value, label, unit }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280;
    const height = 180;
    const innerRadius = 75;
    const outerRadius = 95;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height - 20})`);

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4);

    // Background segments (Good, Fair, Bad)
    const segments = 3;
    const colors = [COLORS.SAFE, COLORS.WARNING, COLORS.CRITICAL];
    const segmentLabels = ["Good", "Fair", "Bad"];
    const totalAngle = Math.PI * 1.2; // Adjusted span for a wider but cleaner look
    const startAngle = -totalAngle / 2;
    const segmentAngle = totalAngle / segments;

    for (let i = 0; i < segments; i++) {
      g.append("path")
        .datum({ 
          startAngle: startAngle + i * segmentAngle,
          endAngle: startAngle + (i + 1) * segmentAngle
        })
        .style("fill", colors[i])
        .style("opacity", 0.9) // Higher opacity for visibility
        .attr("d", arc);

      // Add labels (Good, Fair, Bad)
      const labelAngle = startAngle + (i + 0.5) * segmentAngle;
      const x = (innerRadius + 35) * Math.sin(labelAngle);
      const y = -(innerRadius + 35) * Math.cos(labelAngle);
      
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "800")
        .style("fill", "#64748b") // Slate color for readability
        .style("text-transform", "uppercase")
        .text(segmentLabels[i]);
    }

    // Determine current color based on value
    const currentColor = value < 33.33 ? colors[0] : value < 66.66 ? colors[1] : colors[2];

    // Needle Logic
    const needleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([- (totalAngle / 2) * (180 / Math.PI), (totalAngle / 2) * (180 / Math.PI)]);
    
    const needleAngle = needleScale(value);

    // Needle path (triangle shape)
    const needleLine = d3.line()([
      [-4, 0],
      [0, -outerRadius + 5],
      [4, 0]
    ]);
    
    g.append("path")
      .attr("d", needleLine)
      .attr("fill", "#FFFFFF")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("transform", `rotate(${needleAngle})`);

    // Center pivot point
    g.append("circle")
      .attr("r", 6)
      .attr("fill", "#FFFFFF")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    // Value Text in center
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-5px")
      .style("font-size", "36px")
      .style("font-weight", "900")
      .style("fill", currentColor) // Dynamic color
      .style("text-shadow", "0 0 20px rgba(0,0,0,0.5)")
      .text(`${Math.round(value)}${unit}`);

  }, [value, unit]);

  return (
    <div className="flex flex-col items-center group">
      <div className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-6 group-hover:text-blue-500 transition-colors">
        {label}
      </div>
      <div className="relative">
        <svg ref={svgRef} width="280" height="180" className="overflow-visible"></svg>
      </div>
    </div>
  );
};

export default SafetyGauge;
