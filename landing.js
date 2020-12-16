const electron = require('electron').remote
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const path = require('path');
const os = require('os');
const { ipcRenderer } = window.require('electron');
var Chart = require('chart.js');

//de chart
var myChart
//de data
var intervals



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
          intervals = response.data.intervals
        //no daily data to show on the plot
        if(intervals.length == 0)
        {

        }
        else{
            createDailyChart(intervals)
            fillCards(intervals)
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

  var totalStates = 0

  //empty interval
  if(intervals.length == 0)
  {
    totalStates = 1
    iLength = 15*60
    currentState = lastState

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

  }
  else {
        totalStates = intervals.length
        console.log('totalRecords', totalStates)

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
  }



  return {"startInterval" : start_interval, "endInterval" : end_interval, "countInterval" : count,
                                     "activeUserTime":activeUserTime,"notactiveUserTime":notactiveUserTime,"otherNonActive":otherNonActive,
                                     "computerTimeON":computerTimeON,"computerTimeOFF":computerTimeOFF,"totalStates":totalStates,"lastState":currentState}

}

function timestampToDate(timestamp){
  var date = new Date(timestamp*1000);
  // Year
  var year = date.getFullYear();
  // Month
  // Months array
  var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  var month = months_arr[date.getMonth()];
  // Day
  var day = date.getDate();
  // Hours
  var hours = date.getHours() -1;
  // Minutes
  var minutes = "0" + date.getMinutes();
  // Seconds
  var seconds = "0" + date.getSeconds();
  // Display date time in MM-dd-yyyy h:m:s format
  var convdataTime = day+'-'+month+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

  return convdataTime

}


document.getElementById('minutesCard').onclick = function(){
  var now = new Date()
  endMeasurement = Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000)
  // -30 minutes
  startMeasurement = endMeasurement - 30*60
  console.log('ploting',startMeasurement,endMeasurement)
    var helpintervals  = intervals.filter(function (el) {
    return el.collectionTime <= endMeasurement &&
           el.collectionTime >= startMeasurement
  });

  if(helpintervals.length == 0)
  {

  }
  else{
      console.log('ploting',helpintervals)
      createDailyChart(helpintervals)
  }
}

document.getElementById('hoursCard').onclick = function(){
  var now = new Date()
  endMeasurement = Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000)
  // -2h
  startMeasurement = endMeasurement - 30*60*4
  console.log('ploting',startMeasurement,endMeasurement)
  var helpintervals = intervals.filter(function (el) {
    return el.collectionTime <= endMeasurement &&
           el.collectionTime >= startMeasurement
  });

  if(helpintervals.length == 0)
  {

  }
  else{
      console.log('ploting',helpintervals)
      createDailyChart(helpintervals)
  }
}


document.getElementById('totalCard').onclick = function(){

  if(intervals.length == 0)
  {

  }
  else{
      console.log('ploting',intervals)
      createDailyChart(intervals)
  }
}


function transformIntervalArray(intervals){

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
      console.log('no data in interval ', startMeasurement, ' : ', endInterval)
      intervalArray.intervals.push(intervalSummary(helpA,startMeasurement,endInterval,count, intervalArray.intervals[intervalArray.intervals.length-1].lastState))
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
  return intervalArray
}


function fillCards(intervals)
{
  intervalArray = transformIntervalArray(intervals)
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


}

function createDailyChart(intervals){

          document.getElementById('lastUpdate').innerHTML = 'Last Updated: ' + timestampToDate(intervals[intervals.length - 1].collectionTime)
          intervalArray = transformIntervalArray(intervals)
          console.log(typeof intervalArray);
            //   for(var i = 0; i < intervalArray.length; i++) {
            //     var obj = intervalArray[i];
            //     console.log('i',i);
            //     console.log('obj',obj);
            // }
              //get last 2 to calculate 30 minutes activity



              // FOR THE CARDS



              // For chart 2
              var intervalTime = 60*15
              var timestamps = []
              var active_percentages = []
              var chartData = []
              for (i=0,l=intervalArray.intervals.length; i<l; i++){
                    console.log('interval', i, 'perc active', (intervalArray.intervals[i].activeUserTime/intervalTime)*100)
                    active_percentages.push(Math.floor((intervalArray.intervals[i].activeUserTime/intervalTime)*100))
                    console.log('start', timestampToDate(intervalArray.intervals[i].startInterval), 'end', timestampToDate(intervalArray.intervals[i].endInterval))
                    // in milliseconds for chartjs
                    timestamps.push((intervalArray.intervals[i].endInterval - 3600)*1000)
              }
              var ctx = document.getElementById('myChart2').getContext('2d');
              // document.getElementById('myChart2').style.height = "300px"
              // document.getElementById('myChart2').style.width = "300px"
              if (myChart) {
                myChart.destroy();
                // myChart.data.labels = timestamps
                // myChart.data.datasets[0].data = active_percentages
                // myChart.update()

              }

              // else{
              myChart = new Chart(ctx, {
                              type: 'line',
                              responsive:true,
                              data: {
                                  labels: timestamps,
                                  datasets: [{
                                      data:active_percentages
                                  }]
                              },
                              options: {
                                legend: {
                                     display: false
                                 },
                                scales: {
                                    xAxes: [{
                                      type: 'time',
                                      distribution: 'series',
                                      time: {
                                          displayFormats: {
                                              quarter: 'h:mm a'
                                          }
                                      }
                                  }]
                                },

                                plugins: {
					                            zoom: {
                                        pan: {
                                          enabled: true,
                                          mode: "xy",


                                            },
                                        zoom: {
                                          enabled: true,
                                          mode: "xy",

                                            }
                                        }
                                      }

                              },


                          });
                        // }



              // var ctx = document.getElementById('myChart').getContext('2d');
              // var myChartSitting = new Chart(ctx, {
              //                 type: 'line',
              //                 responsive:true,
              //                 data: {
              //                     labels: timeArray,
              //                     datasets: [{
              //                         data:stateArray,
              //                         steppedLine: true,
              //                         // backgroundColor: [
              //                         //     'rgba(113, 121, 250, 1)'
              //                         // ],
              //                         borderColor: [
              //                             'rgba(113, 121, 250,1)'
              //                         ],
              //                         borderWidth: 2
              //                     }]
              //                 },
              //                 options: {
              //                   legend: {
              //                        display: false
              //                    },
              //                     scales: {
              //                         yAxes: [{
              //                             scaleLabel: {
              //                                 display: true,
              //                                 fontColor: "#CCC",
              //                                 labelString: 'State ID',
              //                                 fontSize: 14
              //                             },  gridLines: {drawBorder: false,
              //                                   display:false
              //                               },
              //                               ticks: {
              //                                 beginAtZero: true,
              //                                 callback: function (value) { if (Number.isInteger(value)) { return value; } },
              //                                 stepSize: 1,
              //                                 fontColor: "#CCC"
              //                             }
              //                         }],
              //                         xAxes: [{
              //                             scaleLabel: {
              //                                 display: true,
              //                                 fontColor: "#CCC",
              //                                 labelString: 'Time'
              //                             },
              //                             gridLines: {drawBorder: false,
              //                               display:false
              //                             },
              //                             ticks: {
              //                                 beginAtZero:true,
              //                                 fontColor: "#CCC"
              //                             }
              //                         }]
              //                     },
              //
              //                     animation: {
              //                         duration:1000,
              //                         easing:'easeOutCubic'
              //                     }
              //
              //                 }
              //
              //             });







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
