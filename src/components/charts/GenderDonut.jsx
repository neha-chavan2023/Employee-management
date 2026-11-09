import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_COLORS, tooltipStyle } from './colors';

export default function GenderDonut({ data = [], total = 0 }) {
  if (!data.length) return <div className="chart-empty">No gender data available.</div>;

  return (
    <div className="chart-canvas">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} employees`, 'Count']} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="donut-total">
            {total}
          </text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="donut-label">
            Employees
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
