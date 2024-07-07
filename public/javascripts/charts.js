
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#dateform');
    const liveCheckbox = document.getElementById('live');
    let intervalId = null;
    let temperatureChart = null;
    let humidityChart = null;
    let lightLevelChart = null;
    let temperaturePieChart = null;
    let humidityPieChart = null;
    let lightLevelPieChart = null;
    let temperatureHeatmap = null;
    let humidityHeatmap = null;
    let lightLevelHeatmap = null;
    let temperatureBarChart = null;
    let humidityBarChart = null;
    let lightLevelBarChart = null;
    let temperatureCandlestickChart = null;
    let humidityCandlestickChart = null;
    let lightLevelCandlestickChart = null;
    let thresholds = { temperature: 0, humidity: 0, lightLevel: 0 };
    let currentRecords = null;
    let currentDay = null;
    let currentRangeStart = null;
    let currentPot = null;
    let allPots = null;
    fetchPots();

    if (liveCheckbox.checked) {
        fetchLastDayAndUpdate(new Date().toISOString());
        intervalId = setInterval(async function () {
            const day = new Date().toISOString();
            await fetchLastDayAndUpdate(day);
            //}, 3600000); // 1 hour interval
        }, 3600);
    }


    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        liveCheckbox.checked = false;
        clearInterval(intervalId);
        const day = document.getElementById('day').value;
        if (day) {
            await fetchDataAndUpdate(day);
        }
    });

    liveCheckbox.addEventListener('change', function() {
        if (liveCheckbox.checked) {
            const day = new Date().toISOString();
            fetchLastDayAndUpdate(day);
            intervalId = setInterval(async function() {
                const day = new Date().toISOString();
                await fetchLastDayAndUpdate(day);
                //}, 3600000); // 1 hour interval
            }, 3600);
            document.getElementById('day').value = null;
        } else {
            clearInterval(intervalId);
        }
    });

    $('#daterange').on('apply.daterangepicker', async function(ev, picker) {
        ev.preventDefault();
        liveCheckbox.checked = false;
        clearInterval(intervalId);
        const start = picker.startDate.toISOString();
        const end = picker.endDate.toISOString();
        await fetchRangeDataAndUpdate(start, end);
    });

    function UTCtoLocal(date) {
        const localDate = new Date(date);
        return localDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
    }
    async function fetchDataAndUpdate(day) {
        const encodedPot = encodeURIComponent(currentPot);
        const response = await fetch(`/api/day/${day}/?pot=${encodedPot}`);
        const records = await response.json();
        currentRecords = records;
        currentDay = day;
        currentRangeStart = null;
        console.log(records);
        updatePage(records, UTCtoLocal(day));
        if (records.length<=24){
            const response2 = await fetch(`/api/day/${day}`);
            const records2 = await response2.json();
            await renderHeatmaps(records2);
        }
        //
        const date = new Date(day);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const startDate = new Date(Date.UTC(year, month, 1)).toISOString();
        const endDate = new Date(Date.UTC(year, month+1, 0)).toISOString();
        const response3 = await fetch(`/api/range?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`);
        const records3 = await response3.json();
        await renderBarCharts(records3);
    }

    async function fetchLastDayAndUpdate(day) {
        const encodedPot = encodeURIComponent(currentPot);
        const response = await fetch(`/api/day/${day}/now?pot=${encodedPot}`);
        const records = await response.json();
        currentRecords = records;
        currentDay = day;
        currentRangeStart = null;
        console.log(records);
        updatePage(records, UTCtoLocal(day));
        if (records.length<=24){
            const response2 = await fetch(`/api/day/${day}/now`);;
            const records2 = await response2.json();
            await renderHeatmaps(records2);
        }
        //
        const date = new Date(day);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const endDate = new Date(Date.UTC(year, month, 0)).toISOString();
        const response3 = await fetch(`/api/range?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`);
        const records3 = await response3.json();
        await renderBarCharts(records3);
        //
        const endDate2 = date;
        const startDate2 = new Date(endDate2);
        startDate2.setUTCDate(endDate2.getUTCDate() - 6);
        const startISODate = startDate2.toISOString();
        const endISODate = endDate2.toISOString();
        const response4 = await fetch(`/api/range?start=${encodeURIComponent(startISODate)}&end=${encodeURIComponent(endISODate)}&pot=${encodedPot}`);
        const records4 = await response4.json();
        if (records4 && records4.length>0) {
            await renderCandlestickChart(records4);
        }
    }

    async function fetchRangeDataAndUpdate(start, end) {
        const encodedStart = encodeURIComponent(start);
        const encodedEnd = encodeURIComponent(end);
        const encodedPot = encodeURIComponent(currentPot);
        const response = await fetch(`/api/range?start=${encodedStart}&end=${encodedEnd}&pot=${encodedPot}`);
        const records = await response.json();
        currentRecords = records;
        currentDay = end;
        currentRangeStart = start;
        console.log(records);
        updatePage(records, `${UTCtoLocal(start)} - ${UTCtoLocal(end)}`);
        const response2 = await fetch(`/api/range?start=${encodedStart}&end=${encodedEnd}`);
        const records2 = await response2.json();
        if (records.length<=24){
            await renderHeatmaps(records2);
        }
        await renderBarCharts(records2);
        await renderCandlestickChart(records);
    }

    function updatePage(records, day) {
        const dataTitle = document.getElementById('dataTitle');
        const noDataMessage = document.getElementById('noDataMessage');
        const temperatureChartElement = document.getElementById('temperatureChart');
        const humidityChartElement = document.getElementById('humidityChart');
        const lightLevelChartElement = document.getElementById('lightLevelChart');
        const temperaturePieChartElement = document.getElementById('temperaturePieChart');
        const humidityPieChartElement = document.getElementById('humidityPieChart');
        const lightLevelPieChartElement = document.getElementById('lightLevelPieChart');
        const temperatureHeatmapElement = document.getElementById('temperatureHeatmap');
        const humidityHeatmapElement = document.getElementById('humidityHeatmap');
        const lightLevelHeatmapElement = document.getElementById('lightLevelHeatmap');
        const temperatureBarChartElement = document.getElementById('temperatureBarChart');
        const humidityBarChartElement = document.getElementById('humidityBarChart');
        const lightLevelBarChartElement = document.getElementById('lightLevelBarChart');
        const temperatureCandlestickChartElement = document.getElementById('temperatureCandlestickChart');
        const humidityCandlestickChartElement = document.getElementById('humidityCandlestickChart');
        const lightLevelCandlestickChartElement = document.getElementById('lightLevelCandlestickChart');

        if (records && records.length > 0) {
            dataTitle.innerText = `Data for ${day}`;
            noDataMessage.style.display = 'none';
            temperatureChartElement.style.display = 'block';
            humidityChartElement.style.display = 'block';
            lightLevelChartElement.style.display = 'block';
            temperaturePieChartElement.style.display = 'block';
            humidityPieChartElement.style.display = 'block';
            lightLevelPieChartElement.style.display = 'block';
            temperatureBarChartElement.style.display = 'block';
            humidityBarChartElement.style.display = 'block';
            lightLevelBarChartElement.style.display = 'block';
            renderLineCharts(records);
            renderPieCharts(records);
            if (records.length<=24){
                temperatureHeatmapElement.style.display = 'block';
                humidityHeatmapElement.style.display = 'block';
                lightLevelHeatmapElement.style.display = 'block';
            } else {
                temperatureHeatmapElement.style.display = 'none';
                humidityHeatmapElement.style.display = 'none';
                lightLevelHeatmapElement.style.display = 'none';
            }
            if (!currentRangeStart && liveCheckbox.checked===false){
                temperatureCandlestickChartElement.style.display = 'none';
                humidityCandlestickChartElement.style.display = 'none';
                lightLevelCandlestickChartElement.style.display = 'none';
            } else {
                temperatureCandlestickChartElement.style.display = 'block';
                humidityCandlestickChartElement.style.display = 'block';
                lightLevelCandlestickChartElement.style.display = 'block';
            }
        } else {
            dataTitle.innerText = '';
            noDataMessage.style.display = 'block';
            temperatureChartElement.style.display = 'none';
            humidityChartElement.style.display = 'none';
            lightLevelChartElement.style.display = 'none';
            temperaturePieChartElement.style.display = 'none';
            humidityPieChartElement.style.display = 'none';
            lightLevelPieChartElement.style.display = 'none';
            temperatureHeatmapElement.style.display = 'none';
            humidityHeatmapElement.style.display = 'none';
            lightLevelHeatmapElement.style.display = 'none';
            temperatureBarChartElement.style.display = 'none';
            humidityBarChartElement.style.display = 'none';
            lightLevelBarChartElement.style.display = 'none';
            temperatureCandlestickChartElement.style.display = 'none';
            humidityCandlestickChartElement.style.display = 'none';
            lightLevelCandlestickChartElement.style.display = 'none';
        }

        updateSummary(records);
    }

    function renderLineCharts(records) {
        const times = records.map(record => {
            const date = new Date(record.time);
            //const hours = String(date.getUTCHours()).padStart(2, '0');
            //const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        });

        console.log(times[0]);
        console.log(new Date(records[0].time));
        const temperatureData = {
            labels: times,
            datasets: [{
                label: 'Temperature',
                data: records.map(record => record.temperature),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
            }, {
                label: 'Threshold',
                data: Array(records.length).fill(thresholds.temperature),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        };

        const humidityData = {
            labels: times,
            datasets: [{
                label: 'Humidity',
                data: records.map(record => record.humidity),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
            }, {
                label: 'Threshold',
                data: Array(records.length).fill(thresholds.humidity),
                borderColor: 'rgba(54, 162, 235, 1)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        };

        const lightLevelData = {
            labels: times,
            datasets: [{
                label: 'Light Level',
                data: records.map(record => record.lightLevel),
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
            }, {
                label: 'Threshold',
                data: Array(records.length).fill(thresholds.lightLevel),
                borderColor: 'rgba(255, 206, 86, 1)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        };

        const makeOptions = (unit) => {
            return {
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => ctx.chart.canvas.id.replace('Chart', ' Chart')
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += `${context.parsed.y}${unit}`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value + unit;
                            }
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            };
        };


        if (temperatureChart) {
            temperatureChart.data = temperatureData;
            temperatureChart.update();
        } else {
            const ctxTemp = document.getElementById('temperatureChart').getContext('2d');
            temperatureChart = new Chart(ctxTemp, {
                type: 'line',
                data: temperatureData,
                options: makeOptions("°C")
            });
        }

        if (humidityChart) {
            humidityChart.data = humidityData;
            humidityChart.update();
        } else {
            const ctxHumidity = document.getElementById('humidityChart').getContext('2d');
            humidityChart = new Chart(ctxHumidity, {
                type: 'line',
                data: humidityData,
                options: makeOptions("%")
            });
        }

        if (lightLevelChart) {
            lightLevelChart.data = lightLevelData;
            lightLevelChart.update();
        } else {
            const ctxLight = document.getElementById('lightLevelChart').getContext('2d');
            lightLevelChart = new Chart(ctxLight, {
                type: 'line',
                data: lightLevelData,
                options: makeOptions("lx")
            });
        }
    }

    function renderPieCharts(records) {
        const aboveThreshold = (records, key, threshold) =>
            records.filter(record => record[key] > threshold).length;

        const belowThreshold = (records, key, threshold) =>
            records.length - aboveThreshold(records, key, threshold);

        const tempAbove = aboveThreshold(records, 'temperature', thresholds.temperature)*100/records.length;
        const tempBelow = belowThreshold(records, 'temperature', thresholds.temperature)*100/records.length;
        const humAbove = aboveThreshold(records, 'humidity', thresholds.humidity)*100/records.length;
        const humBelow = belowThreshold(records, 'humidity', thresholds.humidity)*100/records.length;
        const lightAbove = aboveThreshold(records, 'lightLevel', thresholds.lightLevel)*100/records.length;
        const lightBelow = belowThreshold(records, 'lightLevel', thresholds.lightLevel)*100/records.length;


        const temperatureData = {
            labels: ['Above Threshold', 'Below Threshold'],
            datasets: [{
                data: [tempAbove, tempBelow],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)']
            }]
        };

        const humidityData = {
            labels: ['Above Threshold', 'Below Threshold'],
            datasets: [{
                data: [humAbove, humBelow],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)']
            }]
        };

        const lightLevelData = {
            labels: ['Above Threshold', 'Below Threshold'],
            datasets: [{
                data: [lightAbove, lightBelow],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)']
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: (ctx) => ctx.chart.canvas.id.replace('PieChart', ' Pie Chart')
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.raw !== null) {
                                label += `${Math.round(context.raw)}%`;
                            }
                            return label;
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        }

        if (temperaturePieChart) {
            temperaturePieChart.data = temperatureData;
            temperaturePieChart.update();
        } else {
            const ctxTemperature = document.getElementById('temperaturePieChart').getContext('2d');
            temperaturePieChart = new Chart(ctxTemperature, {
                type: 'pie',
                data: temperatureData,
                options: options
            });
        }

        if (humidityPieChart) {
            humidityPieChart.data = humidityData;
            humidityPieChart.update();
        } else {
            const ctxHumidity = document.getElementById('humidityPieChart').getContext('2d');
            humidityPieChart = new Chart(ctxHumidity, {
                type: 'pie',
                data: humidityData,
                options: options
            });
        }

        if (lightLevelPieChart) {
            lightLevelPieChart.data = lightLevelData;
            lightLevelPieChart.update();
        } else {
            const ctxLight = document.getElementById('lightLevelPieChart').getContext('2d');
            lightLevelPieChart = new Chart(ctxLight, {
                type: 'pie',
                data: lightLevelData,
                options: options
            });
        }
    }

    async function renderHeatmaps(records){
        const times = records.map(record => {
            const date = new Date(record.time);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        });

        const response = await fetch('/api/userpots');
        const result = await response.json();
        const pots = result.pots;
        console.log(pots);

        const temperatureData = [];
        const humidityData = [];
        const lightLevelData = [];

        const potRecordsMap = new Map();
        pots.forEach(pot => potRecordsMap.set(pot, []));

        records.forEach(record => {
            if (potRecordsMap.has(record.pot)) {
                potRecordsMap.get(record.pot).push(record);
            }
        });

        const renderHeatmap = (canvasId, data, color) => {

            var margin = {top: 50, right: 30, bottom: 30, left: 100},
                width = 600 - margin.left - margin.right,
                height = 50*pots.length - margin.top - margin.bottom;

            const svgElement = document.getElementById(canvasId);
            svgElement.innerHTML = '';

            const svg = d3.select(`#${canvasId}`)
                .append('svg')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            const xScale = d3.scaleBand()
                .domain(times)
                .range([0, width])
                .padding(0.01);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-45)")
                .attr("dx", "-.8em")
                .attr("dy", ".15em");

            const yScale = d3.scaleBand()
                .domain(pots)
                .range([0, height])
                .padding(0.01);
            svg.append("g")
                .call(d3.axisLeft(yScale));

            // var myColor = d3.scaleLinear()
            //     .range(["white", "#69b3a2"])
            //     .domain([d3.min(data,d => d.value), d3.max(data, d => d.value)])

            var tooltip = d3.select(`#${canvasId}`)
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px")

            var mouseover = function(d) {
                tooltip.style("opacity", 1)
                d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1)
            }
            var mousemove = (data, d) => {
                tooltip
                    .html("The exact value of<br>this cell is: " + d.value)
                    .style("left", (d3.mouse(this)[0]+70) + "px")
                    .style("top", (d3.mouse(this)[1]) + "px")
            }
            var mouseleave = function(d) {
                tooltip.style("opacity", 0)
                d3.select(this)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
            }


            svg.selectAll('rect')
                .data(data)
                .enter().append('rect')
                .attr('x', d => xScale(d.x))
                .attr('y', d => yScale(d.y))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .style('fill', d => color(d.value))
                .style("stroke-width", 4)
                .style("stroke", "none")
                .style("opacity", 0.8)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);

            svg.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .attr("text-anchor", "left")
                .style("font-size", "22px")
                .text(canvasId);
        };

        // const temperatureHeatmapData = {
        //     data: records.map((record,index) => ({
        //         x: times[index],
        //         y: 0,
        //         value: record.temperature
        //     }))
        // };
        //
        // const humidityHeatmapData = {
        //     data: records.map((record,index) => ({
        //         x: times[index],
        //         y: 0,
        //         value: record.humidity
        //     }))
        // };
        //
        // const lightLevelHeatmapData = {
        //     data: records.map((record,index) => ({
        //         x: times[index],
        //         y: 0,
        //         value: record.lightLevel
        //     }))
        // };

        pots.forEach(pot => {
            const potRecords = potRecordsMap.get(pot);

            // Initialize objects to aggregate data
            const aggregatedTemperatureData = {};
            const aggregatedHumidityData = {};
            const aggregatedLightLevelData = {};

            // Aggregate records by timestamp
            potRecords.forEach((record, index) => {
                const timeKey = `${new Date(record.time).getHours()}:${new Date(record.time).getMinutes()}`;
                // Aggregate temperature data
                if (!aggregatedTemperatureData[timeKey]) {
                    aggregatedTemperatureData[timeKey] = {
                        sum: 0,
                        count: 0
                    };
                }
                aggregatedTemperatureData[timeKey].sum += record.temperature;
                aggregatedTemperatureData[timeKey].count++;

                // Aggregate humidity data
                if (!aggregatedHumidityData[timeKey]) {
                    aggregatedHumidityData[timeKey] = {
                        sum: 0,
                        count: 0
                    };
                }
                aggregatedHumidityData[timeKey].sum += record.humidity;
                aggregatedHumidityData[timeKey].count++;

                // Aggregate light level data
                if (!aggregatedLightLevelData[timeKey]) {
                    aggregatedLightLevelData[timeKey] = {
                        sum: 0,
                        count: 0
                    };
                }
                aggregatedLightLevelData[timeKey].sum += record.lightLevel;
                aggregatedLightLevelData[timeKey].count++;
            });

            // Map aggregated data to times array
            const temperaturePotData = times.map(time => {
                const timeKey = time.split(':').map(Number).join(':');
                return {
                    x: time,
                    y: pot,
                    value: aggregatedTemperatureData[timeKey] ? aggregatedTemperatureData[timeKey].sum / aggregatedTemperatureData[timeKey].count : 0
                };
            });

            const humidityPotData = times.map(time => {
                const timeKey = time.split(':').map(Number).join(':');
                return {
                    x: time,
                    y: pot,
                    value: aggregatedHumidityData[timeKey] ? aggregatedHumidityData[timeKey].sum / aggregatedHumidityData[timeKey].count : 0
                };
            });

            const lightLevelPotData = times.map(time => {
                const timeKey = time.split(':').map(Number).join(':');
                return {
                    x: time,
                    y: pot,
                    value: aggregatedLightLevelData[timeKey] ? aggregatedLightLevelData[timeKey].sum / aggregatedLightLevelData[timeKey].count : 0
                };
            });

            // Push mapped data into respective arrays
            temperatureData.push(...temperaturePotData);
            humidityData.push(...humidityPotData);
            lightLevelData.push(...lightLevelPotData);
        });

        var colorScaleTemp = d3.scaleLinear()
            .range(["#6495ED", "#D22B2B"])
            .domain([d3.min(temperatureData, d => d.value), d3.max(temperatureData, d => d.value)]);

        var colorScaleHum = d3.scaleLinear()
            .range(["white", "#0096FF"])
            .domain([d3.min(humidityData, d => d.value), d3.max(humidityData, d => d.value)]);

        var colorScaleLight = d3.scaleLinear()
            .range(["black", "yellow"])
            .domain([d3.min(lightLevelData, d => d.value), d3.max(lightLevelData, d => d.value)]);

        renderHeatmap('temperatureHeatmap', temperatureData, colorScaleTemp);
        renderHeatmap('humidityHeatmap', humidityData, colorScaleHum);
        renderHeatmap('lightLevelHeatmap', lightLevelData, colorScaleLight);
    }


    async function renderBarCharts(records) {
        const potData = {};
        if (!records || records.length ===0) return;
        records.forEach(record => {
            if (!potData[record.pot]) {
                potData[record.pot] = {
                    temperature: [],
                    humidity: [],
                    lightLevel: []
                };
            }
            potData[record.pot].temperature.push(record.temperature);
            potData[record.pot].humidity.push(record.humidity);
            potData[record.pot].lightLevel.push(record.lightLevel);
        });

        const averageData = {
            pots: [],
            temperature: [],
            humidity: [],
            lightLevel: []
        };

        for (const pot in potData) {
            const tempData = potData[pot].temperature;
            const humData = potData[pot].humidity;
            const lightData = potData[pot].lightLevel;

            averageData.pots.push(pot);
            averageData.temperature.push(tempData.reduce((a, b) => a + b, 0) / tempData.length);
            averageData.humidity.push(humData.reduce((a, b) => a + b, 0) / humData.length);
            averageData.lightLevel.push(lightData.reduce((a, b) => a + b, 0) / lightData.length);
        }

        const chartData = (label, data, backgroundColor) => ({
            labels: averageData.pots,
            datasets: [{
                label,
                data,
                backgroundColor
            }]
        });

        const makeOptions = (unit) => ({
            plugins: {
                title: {
                    display: true,
                    text: (ctx) => ctx.chart.canvas.id.replace('Chart', ' Chart')
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `${context.parsed.y}${unit}`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            return value + unit;
                        }
                    }
                }
            },
            animation: {
                duration: 0
            }
        });

        if (temperatureBarChart) {
            temperatureBarChart.data = chartData('Temperature', averageData.temperature, 'rgba(255, 99, 132, 0.2)');
            temperatureBarChart.update();
        } else {
            const temperatureCtx = document.getElementById('temperatureBarChart').getContext('2d');
            temperatureBarChart = new Chart(temperatureCtx, {
                type: 'bar',
                data: chartData('Temperature', averageData.temperature, 'rgba(255, 99, 132, 0.2)'),
                options: makeOptions("°C")
            });
        }

        if (humidityBarChart) {
            humidityBarChart.data = chartData('Humidity', averageData.humidity, 'rgba(54, 162, 235, 0.2)');
            humidityBarChart.update();
        } else {
            const humidityCtx = document.getElementById('humidityBarChart').getContext('2d');
            humidityBarChart = new Chart(humidityCtx, {
                type: 'bar',
                data: chartData('Humidity', averageData.humidity, 'rgba(54, 162, 235, 0.2)'),
                options: makeOptions("%")
            });
        }

        if (lightLevelBarChart) {
            lightLevelBarChart.data = chartData('Light Level', averageData.lightLevel, 'rgba(255, 206, 86, 0.2)');
            lightLevelBarChart.update();
        } else {
            const lightLevelCtx = document.getElementById('lightLevelBarChart').getContext('2d');
            lightLevelBarChart = new Chart(lightLevelCtx, {
                type: 'bar',
                data: chartData('Light Level', averageData.lightLevel, 'rgba(255, 206, 86, 0.2)'),
                options: makeOptions("lx")
            });
        }
    }


    async function renderCandlestickChart(records){
        const temperatureData = [];
        const humidityData = [];
        const lightLevelData = [];

        const groupedByDay = records.reduce((acc, record) => {
            const date = new Date(record.time);
            const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

            if (!acc[day]) {
                acc[day] = {
                    temperature: [],
                    humidity: [],
                    lightLevel: []
                };
            }

            acc[day].temperature.push(record.temperature);
            acc[day].humidity.push(record.humidity);
            acc[day].lightLevel.push(record.lightLevel);

            return acc;
        }, {});


        Object.keys(groupedByDay).forEach(day => {
            const recordsOfDay = groupedByDay[day];
            if (recordsOfDay.temperature.length > 0) {
                const minTemp = Math.min(...recordsOfDay.temperature);
                const maxTemp = Math.max(...recordsOfDay.temperature);
                temperatureData.push({
                    x: new Date(day).valueOf(),
                    o: recordsOfDay.temperature[0],
                    h: maxTemp,
                    l: minTemp,
                    c: recordsOfDay.temperature[recordsOfDay.temperature.length - 1]
                });
            }

            if (recordsOfDay.humidity.length > 0) {
                const minHumidity = Math.min(...recordsOfDay.humidity);
                const maxHumidity = Math.max(...recordsOfDay.humidity);
                humidityData.push({
                    x: new Date(day).valueOf(),
                    o: recordsOfDay.humidity[0],
                    h: maxHumidity,
                    l: minHumidity,
                    c: recordsOfDay.humidity[recordsOfDay.humidity.length - 1]
                });
            }

            if (recordsOfDay.lightLevel.length > 0) {
                const minLightLevel = Math.min(...recordsOfDay.lightLevel);
                const maxLightLevel = Math.max(...recordsOfDay.lightLevel);
                lightLevelData.push({
                    x: new Date(day).valueOf(),
                    o: recordsOfDay.lightLevel[0],
                    h: maxLightLevel,
                    l: minLightLevel,
                    c: recordsOfDay.lightLevel[recordsOfDay.lightLevel.length - 1]
                });
            }
        });

        temperatureData.sort((a, b) => a.x - b.x);
        humidityData.sort((a, b) => a.x - b.x);
        lightLevelData.sort((a, b) => a.x - b.x);


        const temperatureChartData = {
            datasets: [{
                label: 'Temperature Candlestick Data',
                data: temperatureData
            }]
        };

        const humidityChartData = {
            datasets: [{
                label: 'Humidity Candlestick Data',
                data: humidityData
            }]
        };

        const lightLevelChartData = {
            datasets: [{
                label: 'Light Level Candlestick Data',
                data: lightLevelData
            }]
        };

        const candlestickChartOptions = {
            plugins: {
                title: {
                    display: true,
                    text: 'Candlestick Charts'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = `Date: ${context.label}`;
                            label += `\nOpen: ${context.raw.o}`;
                            label += `\nHigh: ${context.raw.h}`;
                            label += `\nLow: ${context.raw.l}`;
                            label += `\nClose: ${context.raw.c}`;
                            return label;
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'timeseries',
                        adapters: {
                            date: Chart._adapters._date
                        }
                    }
                }
            }
        };

        if (temperatureCandlestickChart) {
            temperatureCandlestickChart.data = temperatureChartData;
            temperatureCandlestickChart.update();
        } else {
            const temperatureCtx = document.getElementById('temperatureCandlestickChart').getContext('2d');
            temperatureCandlestickChart = new Chart(temperatureCtx, {
                type: 'candlestick',
                data: temperatureChartData,
                options: candlestickChartOptions
            });
        }

        if (humidityCandlestickChart) {
            humidityCandlestickChart.data = humidityChartData;
            humidityCandlestickChart.update();
        } else {
            const humidityCtx = document.getElementById('humidityCandlestickChart').getContext('2d');
            humidityCandlestickChart = new Chart(humidityCtx, {
                type: 'candlestick',
                data: humidityChartData,
                options: candlestickChartOptions
            });
        }
        if (lightLevelCandlestickChart) {
            lightLevelCandlestickChart.data = lightLevelChartData;
            lightLevelCandlestickChart.update();
        } else {
            const lightLevelCtx = document.getElementById('lightLevelCandlestickChart').getContext('2d');
            lightLevelCandlestickChart = new Chart(lightLevelCtx, {
                type: 'candlestick',
                data: lightLevelChartData,
                options: candlestickChartOptions
            });
        }
    }

    function updateThresholds(newThresholds) {
        thresholds = newThresholds;
        if (temperatureChart && humidityChart && lightLevelChart) {
            temperatureChart.data.datasets[1].data = Array(temperatureChart.data.labels.length).fill(thresholds.temperature);
            humidityChart.data.datasets[1].data = Array(humidityChart.data.labels.length).fill(thresholds.humidity);
            lightLevelChart.data.datasets[1].data = Array(lightLevelChart.data.labels.length).fill(thresholds.lightLevel);

            temperatureChart.update();
            humidityChart.update();
            lightLevelChart.update();
            renderPieCharts(currentRecords);
        }
    }
    window.updateThresholds = updateThresholds;

    const city = 'Astana';

    async function updateSummary(records){
        const summary = document.getElementById('summary');
        console.log(records);
        if (!records || records.length === 0) {
            summary.style.display = 'none';
            return;
        } else {
            summary.style.display = 'block';
        }

        const sum = (acc, val) => acc + val;
        const avg = (arr) => arr.reduce(sum, 0) / arr.length;

        const avgTemperature = avg(records.map(record => record.temperature));
        const avgHumidity = avg(records.map(record => record.humidity));
        const avgLightLevel = avg(records.map(record => record.lightLevel));

        document.getElementById('avgTemperature').innerText = avgTemperature.toFixed(2) + ' °C';
        document.getElementById('avgHumidity').innerText = avgHumidity.toFixed(2) + ' %';
        document.getElementById('avgLightLevel').innerText = avgLightLevel.toFixed(2) + ' lx';

        defineConditions(avgTemperature,avgHumidity,avgLightLevel);

        //forecast data
        if (liveCheckbox.checked === true) {
            try {
                const apiresponse = await fetch('/58907890/weather');
                const apidata = await apiresponse.json();
                const apiKey = apidata.apiKey;

                const coordinates = await getCoordinates(apiKey, city);

                if (!coordinates) {
                    document.getElementById('byforecastTemperature').textContent = '';
                    document.getElementById('byforecastHumidity').textContent = '';
                    return;
                }

                const {lat, lon} = coordinates;
                const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

                const response = await fetch(weatherUrl);
                const data = await response.json();

                if (response.status === 200) {
                    const temperature = data.main.temp;
                    const humidity = data.main.humidity;

                    document.getElementById('byforecastTemperature').textContent = temperature + ' °C by forecast';
                    document.getElementById('byforecastHumidity').textContent = humidity + ' % by forecast';
                } else {
                    console.error(`Failed to get weather data: ${data.message}`);
                }
            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        } else {
            document.getElementById('byforecastTemperature').textContent = '';
            document.getElementById('byforecastHumidity').textContent = '';
        }
    }

    async function getCoordinates(apiKey, city) {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${apiKey}`;
        try {
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (geoResponse.status === 200 && geoData.length > 0) {
                return {
                    lat: geoData[0].lat,
                    lon: geoData[0].lon
                };
            } else {
                throw new Error(`Failed to get coordinates: ${geoData.message || 'City not found'}`);
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
        }
    }

    function defineConditions(avgT, avgH, avgLL){
        let avgConditions = "Normal";
        if (avgT > 30 || avgH > 70 || avgLL > 800) {
            avgConditions = "Harsh";
        } else if (avgT < 10 || avgH < 30 || avgLL < 200) {
            avgConditions = "Cold/Dry";
        }
        document.getElementById('avgConditions').innerText = avgConditions;
    }

    async function fetchPots(){
        const response = await fetch(`/api/userpots`);
        const records = await response.json();
        if (!records.success) return;
        allPots = records.pots;
        console.log(records);
        const selectElement = document.getElementById('selectPot');
        selectElement.innerHTML = '';
        allPots.forEach(pot => {
            const option = document.createElement('option');
            option.value = pot;
            option.textContent = pot;
            selectElement.appendChild(option);
        });
        currentPot = allPots[0];
        selectElement.addEventListener('change', (event) => {
            currentPot = event.target.value;
            console.log('Selected pot:', currentPot);

            if (liveCheckbox.checked === true){
                fetchLastDayAndUpdate(currentDay);
            } else if (currentRangeStart) {
                fetchRangeDataAndUpdate(currentRangeStart, currentDay);
            } else if (currentDay) {
                fetchDataAndUpdate(currentDay);
            }
        });
    }
});
