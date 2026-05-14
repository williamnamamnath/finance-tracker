import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

type Props = {
  labels: string[];
  income: number[];
  expense: number[];
}

export default function SummaryChart({ labels, income, expense }: Props) {
  const data = {
    labels,
    datasets: [
      { label: 'Income', data: income, borderColor: 'rgba(34,197,94,1)', backgroundColor: 'rgba(34,197,94,0.2)' },
      { label: 'Expense', data: expense, borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.2)' }
    ]
  };

  const options = { responsive: true, plugins: { legend: { position: 'top' as const } } };
  
  return <div className="p-4 bg-white rounded shadow"><Line data={data} options={options} /></div>
}
