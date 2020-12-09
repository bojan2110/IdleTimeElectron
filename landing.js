const electron = require('electron').remote
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const path = require('path');
const os = require('os');
const { ipcRenderer } = window.require('electron');
var Chart = require('chart.js');

//read the username first and then start the data collection
const jsonfile = path.join(__dirname,'./electronuser.json')
fs.readFile(jsonfile, 'utf8', (err, userString) => {
    if (err) {
        console.log("Error reading json file from disk:", err)
        return
    }
    try {
          const user = JSON.parse(userString)
          const computerName = os.hostname() + ' ' + os.type()

          //indicates that the app is active
          // event 0 - app is activated
          appClosePost(user.username,computerName,user.appClosingTime)
          console.log('App close location: ',user.functionPlace)
          console.log(userString)
          appStartPost(user.username,computerName)

          monitorDailyState(user.username,computerName)
          postAdditionalComputerStates(user.username,computerName)
          ipcRendererEvents(user.username,computerName)

        }
   catch(err) {
          console.log('Error parsing JSON string:', err)
      }
})

async function appStartPost(username,computerName) {
  try{
    now = new Date();
    let res = await axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        idleTime: 9
      }
    );

    console.log(res.data);
  } catch (err) {
        // Handle Error Here
        console.error(err);
    }
}


async function appClosePost(username,computerName,time) {
  try{
    now = new Date();
    let res = await axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: time,
        idleTime: 10
      }
    );

    console.log(res.data);
  } catch (err) {
        // Handle Error Here
        console.error(err);
    }
}

function ipcRendererEvents(username,computerName){
  console.log('Registering ipc render events')
  //Display latest idle state data
  ipcRenderer.on('MSG_SHOW_PLOT', (event, data) => {

    var start = new Date();
    start.setHours(0,0,0,0);
    var end = new Date();
    var startdate = Math.floor((start.getTime() - start.getTimezoneOffset() *  60000)/1000)
    var enddate = Math.floor((end.getTime() - end.getTimezoneOffset() *  60000)/1000)

    //call the api
    var apiCall = 'https://health-iot.labs.vu.nl/api/idlestate/user/'+ username+'/device/'+ computerName
    +'/startdate/'+ startdate+'/enddate/'+ enddate

    console.log(apiCall)

    axios.get(apiCall)
      .then(function (response) {
        // handle success
        // console.log(response.data.intervals);
        var intervals = response.data.intervals
        var timeArray2 = []
        var collectionTimeArray = []
        var stateArray = []
        for (i in intervals){
          collectionTimeArray.push(intervals[i].collectionTime)
          var d = new Date(intervals[i].collectionTime*1000)
          // timeArray2.push(new Date(intervals[i].collectionTime*1000).toLocaleTimeString('it-IT'))
          timeArray2.push(d.getUTCHours() + ":" + d.getUTCMinutes())
          // console.log(new Date(intervals[i].collectionTime*1000).getUTCHours(),intervals[i].collectionTime)
          stateArray.push(intervals[i].idleTime)
        }
        // console.log(apiCall)
        // console.log(timeArray2);
        // console.log(stateArray);

        //no daily data to show on the plot
        if(timeArray2.length == 0 || stateArray.length == 0)
        {

        }
        else{
            createDailyChart(stateArray,timeArray2,collectionTimeArray,intervals)
        }


      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });

    });

  ipcRenderer.on('app-close', _ => {
        console.log('renderer closing')
        // makePostRequest(username,computerName,10)
        fs.readFile(jsonfile, 'utf8', (err, userString) => {
            if (err) {
                console.log("Error reading file from disk:", err)
                return
            }
            try {
                  var now = new Date();
                  var user = JSON.parse(userString)
                  user.login = true
                  user.username = user.username
                  user.appClosingTime = Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000)
                  user.functionPlace = "ipcRenderer app-close"
                  fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                          if (err)
                          {
                            console.log('Error writing file:', err)
                          }
                          else{
                            location.href = 'landing.html'
                          }
                  })

                  ipcRenderer.send('closed');
                }
           catch(err) {
                  console.log('Error parsing JSON string:', err)
              }
        })

  });

}

Date.prototype.getUTCTime = function(){
  return this.getTime()-(this.getTimezoneOffset()*60000);
};

function amchart(){
  // Themes begin
  am4core.useTheme(am4themes_dataviz);
  am4core.useTheme(am4themes_animated);
  // Themes end

  // Create chart instance
  var chart = am4core.create("chartdiv", am4charts.XYChart);

  // Add data
  chart.data = generateChartData();

  // Create axes
  var dateAxis = chart.xAxes.push(new am4charts.DateAxis());

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  // Create series
  var series = chart.series.push(new am4charts.LineSeries());
  series.dataFields.valueY = "visits";
  series.dataFields.dateX = "date";
  series.strokeWidth = 1;
  series.minBulletDistance = 10;
  series.tooltipText = "{valueY}";
  series.fillOpacity = 0.1;
  series.tooltip.pointerOrientation = "vertical";
  series.tooltip.background.cornerRadius = 20;
  series.tooltip.background.fillOpacity = 0.5;
  series.tooltip.label.padding(12, 12, 12, 12)

  var seriesRange = dateAxis.createSeriesRange(series);
  seriesRange.contents.strokeDasharray = "2,3";
  seriesRange.contents.stroke = chart.colors.getIndex(8);
  seriesRange.contents.strokeWidth = 1;

  var pattern = new am4core.LinePattern();
  pattern.rotation = -45;
  pattern.stroke = seriesRange.contents.stroke;
  pattern.width = 1000;
  pattern.height = 1000;
  pattern.gap = 6;
  seriesRange.contents.fill = pattern;
  seriesRange.contents.fillOpacity = 0.5;

  // Add scrollbar
  chart.scrollbarX = new am4core.Scrollbar();

  function generateChartData() {
    var chartData = [];
    var firstDate = new Date();
    firstDate.setDate(firstDate.getDate() - 200);
    var visits = 1200;
    for (var i = 0; i < 200; i++) {
      // we create date objects here. In your data, you can have date strings
      // and then set format of your dates using chart.dataDateFormat property,
      // however when possible, use date objects, as this will speed up chart rendering.
      var newDate = new Date(firstDate);
      newDate.setDate(newDate.getDate() + i);

      visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

      chartData.push({
        date: newDate,
        visits: visits
      });
    }
    return chartData;
  }


  // add range
  var range = dateAxis.axisRanges.push(new am4charts.DateAxisDataItem());
  range.grid.stroke = chart.colors.getIndex(0);
  range.grid.strokeOpacity = 1;
  range.bullet = new am4core.ResizeButton();
  range.bullet.background.fill = chart.colors.getIndex(0);
  range.bullet.background.states.copyFrom(chart.zoomOutButton.background.states);
  range.bullet.minX = 0;
  range.bullet.adapter.add("minY", function(minY, target) {
    target.maxY = chart.plotContainer.maxHeight;
    target.maxX = chart.plotContainer.maxWidth;
    return chart.plotContainer.maxHeight;
  })

  range.bullet.events.on("dragged", function() {
    range.value = dateAxis.xToValue(range.bullet.pixelX);
    seriesRange.value = range.value;
  })


  var firstTime = chart.data[0].date.getTime();
  var lastTime = chart.data[chart.data.length - 1].date.getTime();
  var date = new Date(firstTime + (lastTime - firstTime) / 2);

  range.date = date;

  seriesRange.date = date;
  seriesRange.endDate = chart.data[chart.data.length - 1].date;




}


function intervalSummary(intervals,start_interval,end_interval,count,lastState){

  console.log('intervalSummary function')
  var currentState = lastState

  var startInterval = start_interval
  var endInterval = 0
  //recreating idle timeline
  // total active computer usage time
  var activeUserTime=0
  //total nonactive computer usage time
  var notactiveUserTime=0
  //total other nonactive
  var otherNonActive = 0

  var iLength = 0
  var computerTimeON = 0
  var computerTimeOFF = 0

  console.log('totalRecords', intervals.length)

  for (i=0,l=intervals.length; i<l; i++){
      // console.log('Step:', i)
      // console.log('current state', currentState)
      // console.log('next state', intervals[i].idleTime)

      endInterval = intervals[i].collectionTime
      iLength = endInterval - startInterval
      // console.log('length', intervalLength)

      if(currentState == 1)
      {
          activeUserTime = activeUserTime + iLength
          computerTimeON = computerTimeON + iLength
      }
      else if(currentState == 0)
        {
          notactiveUserTime = notactiveUserTime + iLength
          computerTimeON = computerTimeON + iLength
        }
      else if(currentState = 10)
        {
          computerTimeOFF = computerTimeOFF + iLength
        }
      else
        {
          otherNonActive = otherNonActive + iLength
          computerTimeON = computerTimeON + iLength
        }

      startInterval = endInterval
      currentState = intervals[i].idleTime



  }


  //for the last point - 'current state'
  iLength = end_interval - startInterval
  // console.log('length', intervalLength)

  if(currentState == 1)
  {
      activeUserTime = activeUserTime + iLength
      computerTimeON = computerTimeON + iLength
  }
  else if(currentState == 0)
  {
      notactiveUserTime = notactiveUserTime + iLength
      computerTimeON = computerTimeON + iLength
  }
  else if(currentState = 10)
  {
      computerTimeOFF = computerTimeOFF + iLength
  }
  else
  {
      otherNonActive = otherNonActive + iLength
      computerTimeON = computerTimeON + iLength
  }



  return {"startInterval" : start_interval, "endInterval" : end_interval, "countInterval" : count,
                                     "activeUserTime":activeUserTime,"notactiveUserTime":notactiveUserTime,"otherNonActive":otherNonActive,
                                     "computerTimeON":computerTimeON,"computerTimeOFF":computerTimeOFF,"totalStates":intervals.length,"lastState":currentState}

}

function createDailyChart(stateArray,timeArray,collectionTimeArray,intervals){
              // sort the intervals as sometimes app OFF is saved after app ON
              intervals = intervals.sort(function(a, b) {
                  return a.collectionTime - b.collectionTime;
              });




              // final array
              var intervalArray = {
                  intervals: []
              };
              var intervalLength = 15*60

              //start measurement today
              //total computer sleep time/lock
              var startInterval =  startMeasurement = intervals[0].collectionTime
              // take the last measurement
              var endMeasurement = intervals[intervals.length - 1].collectionTime
              var endInterval = startMeasurement + intervalLength - 1



              // Convert timestamp to milliseconds
               var date = new Date(endMeasurement*1000);
               // Year
               var year = date.getFullYear();
               // Month
               // Months array
               var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

               var month = months_arr[date.getMonth()];
               // Day
               var day = date.getDate();
               // Hours
               var hours = date.getHours();
               // Minutes
               var minutes = "0" + date.getMinutes();
               // Seconds
               var seconds = "0" + date.getSeconds();
               // Display date time in MM-dd-yyyy h:m:s format
               var convdataTime = day+'-'+month+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

              document.getElementById('lastUpdate').innerHTML = 'Last Updated: ' + convdataTime

              //while block
              count = 0
              while(startMeasurement <= endMeasurement){


                var helpA = intervals.filter(function (el) {
                  return el.collectionTime <= endInterval &&
                         el.collectionTime >= startMeasurement
                });
                console.log('Current interval',startMeasurement,endInterval, helpA)
                //no data in the current interval, just take the last interval ending state, and add 15 minutes to it.
                if(helpA.length == 0)
                {

                }
                //do the standard calculation
                else{
                  //needed for the last state calculation
                  if(intervalArray.intervals.length == 0){
                    intervalArray.intervals.push(intervalSummary(helpA,startMeasurement,endInterval,count, intervals[0].idleTime))
                    console.log('intervalArray' , intervalArray)
                  }
                  else{
                    intervalArray.intervals.push(intervalSummary(helpA,startMeasurement,endInterval,count, intervalArray.intervals[intervalArray.intervals.length-1].lastState))
                  }

                }

                startMeasurement = endInterval + 1
                endInterval = startMeasurement + intervalLength - 1
                count = count + 1
              }

              console.log('intervalArray' , intervalArray)
              console.log(typeof intervalArray);
            //   for(var i = 0; i < intervalArray.length; i++) {
            //     var obj = intervalArray[i];
            //     console.log('i',i);
            //     console.log('obj',obj);
            // }
              //get last 2 to calculate 30 minutes activity

              //MINUTES
              minArray = intervalArray.intervals.slice(intervalArray.intervals.length-2)

              console.log('minArray', minArray)
              document.getElementById('minActive').innerHTML = 'Active ' + Math.floor(minArray.reduce(function (sum, minArray) {return sum + minArray.activeUserTime;
              }, 0)/60) + 'min';

              document.getElementById('minInactive').innerHTML  ='Idle ' + Math.floor(minArray.reduce(function (sum, minArray) {
                  return sum + minArray.notactiveUserTime + minArray.otherNonActive;
              }, 0)/60);

              document.getElementById('minOff').innerHTML = 'OFF ' +  Math.floor(minArray.reduce(function (sum, minArray) {
                  return sum + minArray.computerTimeOFF;
              }, 0)/60);

              //HOURS
              hourArray = intervalArray.intervals.slice(intervalArray.intervals.length-8)
              console.log('hourArray', hourArray)

              // console.log('minArray', minArray)
              document.getElementById('hoursActive').innerHTML = 'Active ' + Math.floor(hourArray.reduce(function (sum, hourArray) {
                  return sum + hourArray.activeUserTime;
              }, 0)/60) + 'min';

              document.getElementById('hoursInactive').innerHTML  = 'Idle ' + Math.floor(hourArray.reduce(function (sum, hourArray) {
                  return sum + hourArray.notactiveUserTime + hourArray.otherNonActive;
              }, 0)/60) + 'min';

              document.getElementById('hoursOff').innerHTML  =  'OFF ' +Math.floor(hourArray.reduce(function (sum, hourArray) {
                  return sum + hourArray.computerTimeOFF;
              }, 0)/60) + 'min';


              // TOTAL DAY SUMMARY
              totalArray = intervalArray.intervals
              document.getElementById('totalActive').innerHTML = 'Active ' + Math.floor(totalArray.reduce(function (sum, totalArray) {
                  return sum + totalArray.activeUserTime;
              }, 0)/60) + 'min';

              document.getElementById('totalInactive').innerHTML  ='Idle ' +  Math.floor(totalArray.reduce(function (sum, totalArray) {
                  return sum + totalArray.notactiveUserTime + totalArray.otherNonActive;
              }, 0)/60) + 'min';

              document.getElementById('totalOff').innerHTML  =  'OFF ' + Math.floor(totalArray.reduce(function (sum, totalArray) {
                  return sum + totalArray.computerTimeOFF;
              }, 0)/60) + 'min';

              //OLD MEASUREMENT SUMMARY
              var endInterval = startInterval
              var currentState = intervals[0].idleTime
              //recreating idle timeline
              // total active computer usage time
              var activeUserTime=0
              //total nonactive computer usage time
              var notactiveUserTime=0
              //total other nonactive
              var otherNonActive = 0

              var iLength = 0
              var computerTimeON = 0
              var computerTimeOFF = 0

              console.log('totalRecords', intervals.length)

              for (i=1,l=intervals.length; i<l; i++){
                  // console.log('Step:', i)
                  // console.log('current state', currentState)
                  // console.log('next state', intervals[i].idleTime)

                  endInterval = intervals[i].collectionTime
                  iLength = endInterval - startInterval
                  // console.log('length', intervalLength)

                  if(currentState == 1)
                    {
                      activeUserTime = activeUserTime + iLength
                      computerTimeON = computerTimeON + iLength
                    }
                  else if(currentState == 0)
                    {
                      notactiveUserTime = notactiveUserTime + iLength
                      computerTimeON = computerTimeON + iLength
                    }
                  else if(currentState = 10)
                    {
                      computerTimeOFF = computerTimeOFF + iLength
                    }
                  else
                    {
                      otherNonActive = otherNonActive + iLength
                      computerTimeON = computerTimeON + iLength
                    }

                  startInterval = endInterval
                  currentState = intervals[i].idleTime
                  // console.log('activeTime',activeUserTime)
                  // console.log('notactiveTime',notactiveUserTime)
                  // console.log('otherNonActive',otherNonActive)
              }
              //
              // console.log('final activeTime',activeUserTime)
              // console.log('final notactiveTime',notactiveUserTime)
              //
              // console.log('computerTimeON',computerTimeON)
              // console.log('computerTimeOFF',computerTimeOFF)

              var ctx = document.getElementById('myChart').getContext('2d');
              var myChartSitting = new Chart(ctx, {
                              type: 'line',
                              responsive:true,
                              data: {
                                  labels: timeArray,
                                  datasets: [{
                                      data:stateArray,
                                      steppedLine: true,
                                      // backgroundColor: [
                                      //     'rgba(113, 121, 250, 1)'
                                      // ],
                                      borderColor: [
                                          'rgba(113, 121, 250,1)'
                                      ],
                                      borderWidth: 2
                                  }]
                              },
                              options: {
                                legend: {
                                     display: false
                                 },
                                  scales: {
                                      yAxes: [{
                                          scaleLabel: {
                                              display: true,
                                              fontColor: "#CCC",
                                              labelString: 'State ID',
                                              fontSize: 14
                                          },  gridLines: {drawBorder: false,
                                                display:false
                                            },
                                            ticks: {
                                              beginAtZero: true,
                                              callback: function (value) { if (Number.isInteger(value)) { return value; } },
                                              stepSize: 1,
                                              fontColor: "#CCC"
                                          }
                                      }],
                                      xAxes: [{
                                          scaleLabel: {
                                              display: true,
                                              fontColor: "#CCC",
                                              labelString: 'Time'
                                          },
                                          gridLines: {drawBorder: false,
                                            display:false
                                          },
                                          ticks: {
                                              beginAtZero:true,
                                              fontColor: "#CCC"
                                          }
                                      }]
                                  },

                                  animation: {
                                      duration:1000,
                                      easing:'easeOutCubic'
                                  }

                              }

                          });

}

function postAdditionalComputerStates(username,computerName){
  console.log('Registering Additional Computer States...')

  //different states - see if it is useful to save them to database as well
  //suspend - 2
  electron.powerMonitor.on('suspend', () => {
    now = new Date();
    console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is going to sleep');
    // var event = document.getElementById("event");
    // event.innerText = ' The system is going to sleep'


    axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        idleTime: 2
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });

  });

  //resume - 3
  electron.powerMonitor.on('resume', () => {
    now = new Date();
    console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is resuming');
    // var event = document.getElementById("event");
    // event.innerText = ' The system is resuming'

    axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        idleTime: 3
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });

  });

  // on-ac 4
  // electron.powerMonitor.on('on-ac', () => {
  //   now = new Date();
  //   console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on AC Power (charging)');
  //   // var event = document.getElementById("event");
  //   // event.innerText =' The system is on AC Power (charging)'
  //
  //   axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
  //     {
  //       userid: username,
  //       deviceid: computerName,
  //       collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
  //       idleTime: 4
  //     }
  //   )
  //   .then((response) => {
  //     console.log('POST OK');
  //   }, (error) => {
  //     console.log(error);
  //   });
  //
  //
  // });

  // on-battery 5
  // electron.powerMonitor.on('on-battery', () => {
  //      now = new Date();
  //     console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on Battery Power');
  //     // var event = document.getElementById("event");
  //     // event.innerText = ' The system is on Battery Power'
  //
  //     axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
  //       {
  //         userid: username,
  //         deviceid: computerName,
  //         collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
  //         idleTime: 5
  //       }
  //     )
  //     .then((response) => {
  //       console.log('POST OK');
  //     }, (error) => {
  //       console.log(error);
  //     });
  // });

  // shutdown 6
  electron.powerMonitor.on('shutdown', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is Shutting Down');
      // var event = document.getElementById("event");
      // event.innerText = ' The system is Shutting Down'

      axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          idleTime: 6
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });

  // lockscreen 7
  electron.powerMonitor.on('lock-screen', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is about to be locked');
      // var event = document.getElementById("event");
      // event.innerText = ' The system is about to be locked'

      axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          idleTime: 7
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });


  //unlock-screen
  electron.powerMonitor.on('unlock-screen', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is unlocked');
      // var event = document.getElementById("event");
      // event.innerText = ' The system is unlocked'
      axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          idleTime: 8
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });

}


function monitorDailyState(username,computerName){
    console.log('Monitoring daily state...')
    // posting state changes
    // threshold in seconds for changing states
    const idleThreshold = 20
    var last_state = ''
    var current_state = ''
    var idleState = -1

    setInterval(function(){
        now = new Date();
        // in case you want to have the actual idle time
        // const idle = electron.powerMonitor.getSystemIdleTime();
        // console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System Idle Time - ', idle);
        // var idletime = document.getElementById("idletime");
        // idletime.innerText = idle
        const st = electron.powerMonitor.getSystemIdleState(idleThreshold);
        // document.getElementById("state").innerText = st
        current_state = st

        if(current_state == 'active')
          idleState = 1
        else
          idleState = 0

        // console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System State - ', st, idleState , Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),username,computerName);

        if(last_state != current_state){
            axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
              {
                userid: username,
                deviceid: computerName,
                collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
                idleTime: idleState
              }
            )
            .then((response) => {
              console.log('New Idle State POST');
            }, (error) => {
              console.log(error);
            });

            last_state = current_state
        }
      }, 5000);

  }
