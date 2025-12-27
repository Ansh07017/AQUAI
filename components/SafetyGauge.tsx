
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { COLORS, SEVERITY_THRESHOLDS } from '../constants';

interface SafetyGaugeProps {
  value: number; // 0 to 100
  isDarkMode: boolean;
}

const SafetyGauge: React.FC<SafetyGaugeProps> = ({ value, isDarkMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 240;
    const height = 150;
    const radius = 110;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height - 20})`);

    const arc = d3.arc<any>()
      .innerRadius(80)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)
      .cornerRadius(6);

    // Background track
    g.append("path")
      .datum({ endAngle: Math.PI / 2 })
      .style("fill", isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")
      .attr("d", arc);

    // Color Logic
    const getColor = (v: number) => {
      if (v <= SEVERITY_THRESHOLDS.SAFE) return COLORS.SAFE;
      if (v <= SEVERITY_THRESHOLDS.WARNING) return COLORS.WARNING;
      return COLORS.CRITICAL;
    };

    const valueScale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);

    // Value arc - strictly monotonic filling
    g.append("path")
      .datum({ endAngle: valueScale(value) })
      .style("fill", getColor(value))
      .attr("d", arc);
      // Glow removed as requested to avoid eye irritation

    // Main Percentage Text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-1.2em")
      .style("font-size", "36px")
      .style("font-weight", "900")
      .style("fill", isDarkMode ? "#ffffff" : "#1e293b")
      .style("font-family", "Inter, sans-serif")
      .text(`${Math.round(value)}%`);

    // Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.6em")
      .style("font-size", "10px")
      .style("font-weight", "900")
      .style("fill", isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)")
      .style("text-transform", "uppercase")
      .style("letter-spacing", "0.2em")
      .text("SEVERITY INDEX");

  }, [value, isDarkMode]);

  return (
    <div className="flex justify-center items-center">
      <svg ref={svgRef} width="240" height="150"></svg>
    </div>
  );
};

export default SafetyGauge;
