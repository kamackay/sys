$(document).ready(function () {

  $('#dataElement').bind('input propertychange', function () {
    options.series[0].data = JSON.parse($('#dataElement').val());
    window.chart = new Highcharts.Chart(options);
    formatChart();
  });

  window.options = {
    chart: {
      renderTo: 'container',
      type: 'spline',
    },
    series: [{}]
  };
  options.series[0].data = '';
  window.chart = new Highcharts.Chart(options);
  formatChart();

  function formatChart() {
    window.chart.setTitle({
      text: 'Custom Data'
    });
  }
});