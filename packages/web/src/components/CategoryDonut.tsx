import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type Transaction = { amount: number; date: string; name: string };

type Props = {
  categories: Record<string, Transaction[]>;
};

const COLORS = [
  'rgba(239,68,68,0.85)',
  'rgba(59,130,246,0.85)',
  'rgba(251,191,36,0.85)',
  'rgba(34,197,94,0.85)',
  'rgba(168,85,247,0.85)',
  'rgba(249,115,22,0.85)',
  'rgba(236,72,153,0.85)',
  'rgba(20,184,166,0.85)',
  'rgba(99,102,241,0.85)',
  'rgba(107,114,128,0.85)',
];

export default function CategoryDonut({ categories }: Props) {
  const labels = Object.keys(categories);
  const data = labels.map(l => categories[l].reduce((s, t) => s + t.amount, 0));

  return (
    <div className="flex justify-center">
      <div style={{ maxWidth: 340, width: '100%' }}>
        <Doughnut
          data={{
            labels,
            datasets: [{
              data,
              backgroundColor: COLORS.slice(0, labels.length),
              borderWidth: 2,
              borderColor: '#fff',
            }],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'right' as const },
              tooltip: {
                callbacks: {
                  label: ctx => ` Total: $${Number(ctx.raw).toFixed(2)}`,
                  afterBody: (items) => {
                    const label = items[0]?.label;
                    if (!label || !categories[label]) return [];
                    return categories[label].map(
                      t => `  ${t.name} — ${new Date(t.date).toLocaleDateString()}`
                    );
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
