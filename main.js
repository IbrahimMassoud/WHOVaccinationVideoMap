require([
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/views/MapView",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Home",
  "esri/widgets/TimeSlider",
  "esri/renderers/ClassBreaksRenderer",
  "esri/rest/support/TopFeaturesQuery",
  "esri/rest/support/Query",
  "esri/rest/support/TopFilter",
], (
  Map,
  FeatureLayer,
  MapView,
  Legend,
  Expand,
  Home,
  TimeSlider,
  ClassBreaksRenderer,
  TopFeaturesQuery,
  Query,
  TopFilter
) => {
  let timeSlider, layerView, startDate, endDate;

  const avgPercentage = {
    onStatisticField: "Percentage",
    outStatisticFieldName: "AveragePercentage",
    statisticType: "avg",
  };
  const week = {
    onStatisticField: "Week",
    outStatisticFieldName: "Week",
    statisticType: "avg",
  };
  const year = {
    onStatisticField: "Year",
    outStatisticFieldName: "Year",
    statisticType: "avg",
  };
  const MaxPercentage = {
    onStatisticField: "Percentage",
    outStatisticFieldName: "MaxPercentage",
    statisticType: "max",
  };
  const MinPercentage = {
    onStatisticField: "Percentage",
    outStatisticFieldName: "MinPercentage",
    statisticType: "min",
  };
  const statsFields = {
    Week: "Week",
    Year: "Year",
    MaxPercentage: "Max percentage",
    AveragePercentage: "Average percentage",
    MinPercentage: "Min percentage",
  };

  const outStatistics = [
    week,
    year,
    avgPercentage,
    MaxPercentage,
    MinPercentage,
  ];

  let startQuery = new TopFeaturesQuery({
    topFilter: new TopFilter({
      topCount: 1,
      groupByFields: ["WeekEndDate"],
      orderByFields: ["WeekEndDate"],
    }),
    outFields: ["WeekEndDate"],
    orderByFields: ["WeekEndDate"],
  });

  let endQuery = new TopFeaturesQuery({
    topFilter: new TopFilter({
      topCount: 1,
      groupByFields: ["WeekEndDate"],
      orderByFields: ["WeekEndDate DESC"],
    }),
    outFields: ["WeekEndDate"],
    orderByFields: ["WeekEndDate DESC"],
  });

  const map = new Map({
    basemap: "gray-vector",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 3,
    center: [30, 16],
    constraints: {
      minScale: 75000000,
      maxScale: 3000000,
      rotationEnabled: false,
    },
  });

  const url =
    "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHO_Vaccination_StoryMap/FeatureServer/0";

  const layer = new FeatureLayer({
    url: url,
    outFields: ["*"],
    popupTemplate: {
      title: "{Country}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "Percentage",
              label: "Percentage %",
              format: {
                digitSeparator: true,
                places: 2,
              },
            },
          ],
        },
      ],
    },
    title: "Vaccination percentage per country %",
  });

  view
    .whenLayerView(layer)
    .then((lv) => {
      layerView = lv;

      const statsDiv = document.getElementById("statsDiv");
      const infoDiv = document.getElementById("infoDiv");
    })
    .then(() => {
      layer
        .queryTopFeatures(startQuery)
        .then(function (response) {
          startDate = response.features[0].attributes["WeekEndDate"];
        })
        .then(() => {
          layer
            .queryTopFeatures(endQuery)
            .then(function (response) {
              endDate = response.features[0].attributes["WeekEndDate"];
            })
            .then(() => {
              view.when(() => {
                timeSlider = new TimeSlider({
                  container: "timeSliderDiv",
                  view: view,
                  mode: "instant",
                  layout: "compact",
                  fullTimeExtent: {
                    start: startDate,
                    end: endDate,
                  },
                  timeExtent: {
                    start: endDate,
                    end: endDate,
                  },
                  playRate: 500,
                  stops: {
                    interval: {
                      value: 1,
                      unit: "weeks",
                    },
                  },
                });

                layerView.featureEffect = {
                  filter: {
                    timeExtent: timeSlider.timeExtent,
                    geometry: view.extent,
                  },
                };

                const statQuery = layerView.featureEffect.filter.createQuery();
                statQuery.outStatistics = outStatistics;
                pushInfo(statQuery);

                timeSlider.watch("timeExtent", (event) => {
                  layerView.featureEffect = {
                    filter: {
                      timeExtent: timeSlider.timeExtent,
                      geometry: view.extent,
                    },
                  };

                  const statQuery =
                    layerView.featureEffect.filter.createQuery();
                  statQuery.outStatistics = outStatistics;
                  pushInfo(statQuery);
                });
              });
            });
        });
    });

  const pushInfo = (statQuery) => {
    layer
      .queryFeatures(statQuery)
      .then((result) => {
        let htmls = [];
        statsDiv.innerHTML = "";
        if (result.error) {
          return result.error;
        } else {
          if (result.features.length >= 1) {
            const attributes = result.features[0].attributes;

            for (var name in statsFields) {
              if (attributes[name] != null) {
                const value =
                  name === "Year" || name === "Week"
                    ? attributes[name].toFixed(0)
                    : attributes[name].toFixed(2) + "%";
                const html =
                  "<br/>" +
                  statsFields[name] +
                  ": <b><span> " +
                  value +
                  "</span></b>";
                htmls.push(html);
              }
            }
            if (htmls[0] == undefined) {
              statsDiv.innerHTML = yearHtml;
            } else {
              statsDiv.innerHTML = htmls;
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // function createSymbol(color) {
  //   return {
  //     type: "simple-fill",
  //     color,
  //     style: "solid",
  //     outline: {
  //       width: 0.5,
  //       color: [255, 255, 255, 0.5]
  //     }
  //   };
  // }

  // const renderer = new ClassBreaksRenderer({
  //   field: "Percentage",
  //   legendOptions: {
  //     title: " "
  //   },
  //   classBreakInfos: [
  //     {
  //       minValue: 0,
  //       maxValue: 9.99,
  //       symbol: createSymbol("#edf8fb"),
  //       label: "< 10%"
  //     },
  //     {
  //       minValue: 10,
  //       maxValue: 29.999,
  //       symbol: createSymbol("#b3cde3"),
  //       label: "10 - 30%"
  //     },
  //     {
  //       minValue: 30,
  //       maxValue: 49.9999,
  //       symbol: createSymbol("#8c96c6"),
  //       label: "30 - 50%"
  //     },
  //     {
  //       minValue: 50,
  //       maxValue: 100,
  //       symbol: createSymbol("#88419d"),
  //       label: "> 50%"
  //     }
  //   ]
  // });
  // renderer.visualVariables = [{
  //   type: "size",
  //   valueExpression: "$view.scale",
  //   target: "outline",
  //   stops: [
  //     { size: 2, value: 56187 },
  //     { size: 1, value: 175583 },
  //     { size: 0.5, value: 702332 },
  //     { size: 0, value: 1404664 }
  //   ]
  // }];

  const renderer = {
    type: "simple",
    symbol: {
      type: "simple-fill",
      outline: {
        width: 0.5,
        color: "gray",
      },
    },
    visualVariables: [
      {
        type: "color",
        field: "Percentage",
        stops: [
          { value: 0, color: "#00b7ff" },
          { value: 100, color: "#00497c" },
        ],
      },
    ],
  };
  layer.renderer = renderer;
  map.add(layer);

  const homeWidget = new Home({
    view: view,
  });

  const legend = new Legend({
    view: view,
  });

  const infoDivExpand = new Expand({
    collapsedIconClass: "esri-icon-collapse",
    expandIconClass: "esri-icon-expand",
    expandTooltip: "Expand vaccination info",
    view: view,
    content: infoDiv,
    expanded: true,
  });

  const legendExpand = new Expand({
    collapsedIconClass: "esri-icon-collapse",
    expandIconClass: "esri-icon-legend",
    expandTooltip: "Expand legend",
    view: view,
    content: legend,
    expanded: false,
  });

  view.ui.move("zoom", "top-right");

  view.ui.add(infoDivExpand, {
    position: "top-left",
    index: 0,
  });

  view.ui.add(homeWidget, {
    position: "top-right",
    index: 1,
  });

  view.ui.add(legendExpand, "top-right");
});
