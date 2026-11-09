import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS, CHART_COLORS, CHART_GRID, tooltipStyle } from './colors';

export default function AttendanceLine({ data = [], height = 260 }) {
  return (
    <div className="chart-canvas" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Present" stroke={CHART_COLORS[6]} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Late" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Absent" stroke={CHART_COLORS[7]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
