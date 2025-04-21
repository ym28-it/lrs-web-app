// chart.js
export function drawExecutionTimeChart(data, moduleParams, labels) {
    const ctx = document.getElementById("executionChart").getContext("2d");

    const datasets = moduleParams.map((module, idx) => ({
        label: module,
        data: data.map(entry => entry[module]),
        fill: false,
        borderWidth: 2,
        tension: 0.2,
    }));

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Execution Time per Module per Input File",
                },
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Execution Time (ms)",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Input Files",
                    },
                },
            },
        },
    });
}
