import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Props = {
  labels: string[];
  data: number[];
  color: string;
  label: string;
};

export default function TransactionChart({ labels, data, color, label }: Props) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: color,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: { legend: { position: "top" as const } },
  };
  return (
    <div className="p-4 bg-white rounded shadow">
      <Bar data={chartData} options={options} />
    </div>
  );
}
