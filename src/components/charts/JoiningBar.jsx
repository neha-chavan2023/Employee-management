import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS, CHART_COLORS, CHART_GRID, tooltipStyle } from './colors';

export default function JoiningBar({ data = [], height = 260 }) {
  return (
    <div className="chart-canvas" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} employees`, 'Joined']} />
          <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
