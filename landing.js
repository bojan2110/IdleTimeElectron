// necessary libraries
const electron = require('electron').remote
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const path = require('path');
const os = require('os');
const { ipcRenderer } = window.require('electron');
var Chart = require('chart.js');
const dialog = require('electron').remote.dialog
const app = require('electron').remote.app
const packager = require('electron-packager')
var options = {
    'arch': 'x64',
    'platform': 'darwin',
    'dir': './',
    'app-copyright': 'Bojan Simoski',
    'app-version': '2.0.0',
    'asar': true,
    'icon': 'assets/icons/mac/icon.icns',
    'name': 'screen-time-tracker-app ',
    'out': './release-builds',
    'overwrite': true,
    'prune': true,
    'version': '1.3.4'
};
async function bundleElectronApp(options) {
  const appPaths = await packager(options)
  console.log('landing Electron app bundles created')
}

bundleElectronApp(options)
// old timestamp calculation: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000)
//global variables
var myChart
var states

//read the username first and then start the data collection
const jsonfile = path.join(app.getPath("userData"),'./userdatastorage.json')
console.log('jsonfile !!!',jsonfile)
fs.readFile(jsonfile, 'utf8', (err, userString) => {
    if (err) {
        console.log("Error reading json file from disk:", err)
        return
    }
    try {
          console.log('USER DATA (Landing Screen): ', userString)

          const user = JSON.parse(userString)
          const computerName = os.hostname() + ' ' + os.type()

          // all functions called here
          appClosePost(user.username,computerName,user.appClosingTime)
          appStartPost(user.username,computerName)
          //this will set the interval
          monitorDailyState(user.username,computerName)
          postAdditionalComputerStates(user.username,computerName)
          get_display_data(user.username,computerName)
          //register the user click event
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
        collectionTime: Math.floor(now.getTime()/1000),
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

function get_display_data(username,computerName){
  //make the start and end interval - take the whole day data (until the current point)
  var start = new Date();
  start.setHours(0,0,0,0);
  //will get the current time
  var end = new Date();
  // var startdate = Math.floor((start.getTime() - start.getTimezoneOffset() *  60000)/1000)
  // var enddate = Math.floor((end.getTime() - end.getTimezoneOffset() *  60000)/1000)

  var startdate = Math.floor(start.getTime()/1000)
  var enddate = Math.floor(end.getTime()/1000)
  //api call for getting daily data
  var apiCall = 'https://health-iot.labs.vu.nl/api/idlestate/user/'+ username+'/device/'+ computerName
  +'/startdate/'+ startdate+'/enddate/'+ enddate

  console.log('Getting daily data', apiCall)

  axios.get(apiCall)
    .then(function (response) {
      // handle success
      states = response.data.intervals
      //no daily data to show on the plot - this is the case when no data has been collected so far
      if(states.length == 0)
      {
        //THIS MEANS THAT THE COMPUTER WAS OFF UNTIL THIS POINT
        // createDailyChart([],'nodata')
      }
      else{

          //deciding what data to obtain (based on highlighted card by the user). Total is the default
          var label
          if(getComputedStyle(document.querySelector('.mcard'), "boxShadow").boxShadow!='none')
            label='min'
          else if(getComputedStyle(document.querySelector('.hcard'), "boxShadow").boxShadow!='none')
            label='hour'
          else
            label='total'


          createDailyChart(states,label)
          fillCards(states)
      }


    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}

function ipcRendererEvents(username,computerName){
  console.log('User clicks icon...')
  //Display latest idle state data
  ipcRenderer.on('MSG_SHOW_PLOT', (event, data) => {
      get_display_data(username,computerName)
  });

  ipcRenderer.on('app-close', _ => {
        console.log('im in app-close')
        // makePostRequest(username,computerName,10)
        fs.readFile(jsonfile, 'utf8', (err, userString) => {
            if (err) {
                console.log("Error reading file from disk:", err)
                return
            }
            try {
                  var now = new Date();
                  var user = JSON.parse(userString)
                  user.login = false
                  user.username = user.username
                  user.appClosingTime = Math.floor(now.getTime()/1000)
                  // user.functionPlace = "ipcRenderer app-close"
                  fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                          if (err)
                          {
                            console.log('Error writing file:', err)
                          }
                          else{
                            ipcRenderer.send('closed');
                            location.href = 'landing.html'

                          }
                  })


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

  var hours
  if(date.getHours() == 0)
  {
    hours = 23
  }
  else{
    hours = date.getHours() -1;
  }

  if(0<=hours && hours<=9)
    hours = "0" + hours


  // Minutes
  var minutes = "0" + date.getMinutes();
  // Seconds
  var seconds = "0" + date.getSeconds();
  // Display date time in MM-dd-yyyy h:m:s format
  var convdataTime = day+'-'+month+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

  return convdataTime
}

document.getElementById('logout_user').onclick = function(){
  var choice = dialog.showMessageBox(
              electron.getCurrentWindow(),
              {
                  type: 'question',
                  buttons: ['Yes', 'No'],
                  title: 'Confirm',
                  message: 'Quit Screen Time Tracker?'
              });
              choice.then(function(res){
                    // 0 for Yes
                   if(res.response== 0){


                    fs.readFile(jsonfile, 'utf8', (err, userString) => {
                        if (err) {
                            console.log("Error reading file from disk:", err)
                            return
                        }
                        try {
                              var now = new Date();
                              var user = JSON.parse(userString)
                              user.login = false
                              user.username = user.username
                              user.appClosingTime = Math.floor(now.getTime()/1000)
                              // user.functionPlace = "ipcRenderer app-close"
                              fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                      if (err)
                                      {
                                        console.log('logout error writing file:', err)
                                      }
                                      else{
                                        console.log('logout user and writing to file')
                                        location.href = 'landing.html'
                                      }
                              })
                              ipcRenderer.send('closed');
                            }
                       catch(err) {
                              console.log('Error parsing JSON string:', err)
                          }
                    })

                   }
                   if(res.response== 1){
                    console.log('NO')

                   }
                 })
}



document.getElementById('minutesCard').onclick = function(){
  console.log('Creating 30-minute plot')
  createDailyChart(states,'min')
}

document.getElementById('hoursCard').onclick = function(){
  console.log('Creating 2-hours plot')
  createDailyChart(states,'hour')
}


document.getElementById('totalCard').onclick = function(){
  console.log('Creating total data plot')
  createDailyChart(states,'total')
}

function intervalSummary(states,start_interval,end_interval,count,firstState){

  //for debugging purposes
  var intervalStartedState = firstState


  var currentState

  var startInterval = 0
  var endInterval = end_interval
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

  //empty interval - in this case only take the last state and add 15 minutes to it
  if(states.length == 0)
  {

    iLength = 15*60

    if(intervalStartedState == 1)
    {
        activeUserTime = activeUserTime + iLength
        computerTimeON = computerTimeON + iLength
    }
    else if(intervalStartedState == 0)
      {
        notactiveUserTime = notactiveUserTime + iLength
        computerTimeON = computerTimeON + iLength
      }
    else if(intervalStartedState = 10)
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
        totalStates = states.length
        // console.log('total data intervals', totalStates)

        for (i=states.length-1; i>=0; i--){
            // console.log('Step:', i)
            // console.log('current state', currentState)
            // console.log('next state', intervals[i].idleTime)
            currentState = states[i].idleTime
            startInterval = states[i].collectionTime
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

            endInterval = startInterval

        }

        //for the last point - 'current state'
        iLength = endInterval - start_interval
        // console.log('length', intervalLength)

        if(intervalStartedState == 1)
        {
            activeUserTime = activeUserTime + iLength
            computerTimeON = computerTimeON + iLength
        }
        else if(intervalStartedState == 0)
        {
            notactiveUserTime = notactiveUserTime + iLength
            computerTimeON = computerTimeON + iLength
        }
        else if(intervalStartedState = 10)
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
                                     "computerTimeON":computerTimeON,"computerTimeOFF":computerTimeOFF,"states":states,"statesLength":totalStates,"intervalStartedState":intervalStartedState, "lastState":currentState}

}

function transformIntervalArray(states){

  // array that will contain the calculated intervals
  var intervalArray = {
      intervals: []
  };
  //15 minutes intervals summary
  var intervalLength = 15*60

  //get current timestamp
  var end = new Date();
  var now = Math.floor(end.getTime()/1000)
  var dayStart

  console.log(states)
  // sort the intervals as sometimes app OFF is saved after app ON
  states = states.sort(function(a, b) {
      return a.collectionTime - b.collectionTime;
  });



  var start = new Date();
  start.setHours(0,0,0,0);
  dayStart = Math.floor(start.getTime()/1000)


  console.log('transformIntervalArray dayStart', dayStart)
  console.log('transformIntervalArray now', now)
  // these two are like interval slider start and end point
  var intervalEnd = now
  var intervalStart = intervalEnd - intervalLength
  intervalCounter = 0;
  // //no data - can happen at the beginning of the day
  // if(intervals.length == 0)
  // {
  //
  // }
  // //
  // else{}
    while(intervalEnd>=dayStart)
    {
          if(intervalStart<dayStart)
          {
            intervalStart = dayStart
          }
          else{
          //slice the interval
          var helpA = states.filter(function (el) {
            return el.collectionTime <= intervalEnd &&
                   el.collectionTime >= intervalStart
          });

          if(helpA.length !=0)
            helpA = helpA.sort(function(a, b) {
                return a.collectionTime - b.collectionTime;
            });

            //initial calculation
            if(intervalArray.intervals.length == 0){
              //t
              if(states.length == helpA.length)
              {
                intervalArray.intervals.push(intervalSummary(helpA,intervalStart,intervalEnd,intervalCounter, 10))

              }
              else{
                intervalArray.intervals.push(intervalSummary(helpA,intervalStart,intervalEnd,intervalCounter, states[states.length - helpA.length - 1].idleTime))
              }
            }
            else {
              ia = intervalArray.intervals
              calculatedStatesSoFar = ia.reduce(function (sum, ia) {
                  return sum + ia.statesLength;
              }, 0);

              indexPreviousState = states.length - helpA.length - calculatedStatesSoFar - 1

              //we have came to the first recorded state of the day
              if(indexPreviousState==-1)
              {
                  intervalArray.intervals.push(intervalSummary(helpA,intervalStart,intervalEnd,intervalCounter,10))

              }
              else{
                  intervalArray.intervals.push(intervalSummary(helpA,intervalStart,intervalEnd,intervalCounter,states[indexPreviousState].idleTime))
              }
            }

            intervalCounter = intervalCounter + 1
            intervalEnd = intervalEnd - intervalLength - 1
            intervalStart = intervalEnd - intervalLength
          }
    }

  console.log('Input States Length ', states.length)
  console.log('Input States', states)
  console.log('Transformed Interval' , intervalArray)
  return intervalArray


}


function fillCards(states){
  console.log('Fill Cards ')
  //first calculate the intervals based on total , will do slicing based on the card below
  intervalArray = transformIntervalArray(states)
  //MINUTES
  minArray = intervalArray.intervals.slice(0,2)

  console.log('minArray', minArray)
  var minAct = Math.round(minArray.reduce(function (sum, minArray) {return sum + minArray.activeUserTime;}, 0)/60)
  var minInact = Math.round(minArray.reduce(function (sum, minArray) {return sum + minArray.notactiveUserTime + minArray.otherNonActive + minArray.computerTimeOFF;}, 0)/60)
  while((minAct+minInact)!=30)
  {
    minInact = minInact - 1
  }
  document.getElementById('minActive').innerHTML = 'Active ' + minAct + 'min';

  document.getElementById('minInactive').innerHTML  ='Idle ' + minInact + 'min';


  //HOURS
  hourArray = intervalArray.intervals.slice(0,8)
  console.log('hourArray', hourArray)

  // console.log('minArray', minArray)
  var hourAct = Math.round(hourArray.reduce(function (sum, hourArray) {return sum + hourArray.activeUserTime;}, 0)/60)
  var hourInact = Math.round(hourArray.reduce(function (sum, hourArray) {return sum + hourArray.notactiveUserTime + hourArray.otherNonActive + hourArray.computerTimeOFF;}, 0)/60)

  while((hourAct+hourInact)!=120)
  {
    hourInact = hourInact - 1
  }
  document.getElementById('hoursActive').innerHTML = 'Active ' + hourAct + 'min';
  document.getElementById('hoursInactive').innerHTML  = 'Idle ' + hourInact + 'min';



  // TOTAL DAY SUMMARY
  totalArray = intervalArray.intervals
  console.log('totalArray', totalArray)

  document.getElementById('totalActive').innerHTML = 'Active ' + Math.round(totalArray.reduce(function (sum, totalArray) {
      return sum + totalArray.activeUserTime+1;
  }, 0)/60) + 'min';

  document.getElementById('totalInactive').innerHTML  ='Idle ' +  Math.round(totalArray.reduce(function (sum, totalArray) {
      return sum + totalArray.notactiveUserTime + totalArray.otherNonActive + totalArray.computerTimeOFF;
  }, 0)/60) + 'min';



}

function createDailyChart(states,label){
          intervalArray = transformIntervalArray(states)
          // var ia
          if(label == 'min'){
            document.getElementById("minutesCard").style["boxShadow"] = "0 0px 8px 4px rgba(241, 158, 49, 0.4)";
            document.getElementById("hoursCard").style["boxShadow"] = "none";
            document.getElementById("totalCard").style["boxShadow"] = "none";
            intervalArray = intervalArray.intervals.slice(0,2)

            // console.log('AI',intervalArray.intervals.length)

          }

          else if(label == 'hour'){
            document.getElementById("hoursCard").style["boxShadow"] = "0 0px 8px 4px rgba(241, 158, 49, 0.4)";
            document.getElementById("minutesCard").style["boxShadow"] = "none";
            document.getElementById("totalCard").style["boxShadow"] = "none";
            // console.log('AI',ia.intervals)
            intervalArray = intervalArray.intervals.slice(0,8)


          }

          else if(label == 'total'){
            document.getElementById("totalCard").style["boxShadow"] = "0 0px 8px 4px rgba(241, 158, 49, 0.4)";
            document.getElementById("hoursCard").style["boxShadow"] = "none";
            document.getElementById("minutesCard").style["boxShadow"] = "none";

            intervalArray = intervalArray.intervals
          }


          document.getElementById('lastUpdate').innerHTML = 'Last Updated: ' + timestampToDate(states[states.length - 1].collectionTime)
          console.log('Plotting Interval Array', intervalArray)
            // For chart 2
            var intervalTime = 60*15
            var timestamps = []
            var active_percentages = []
            var chartData = []
            for (var i = intervalArray.length - 1; i >= 0; i--){
                  // console.log('interval', i, 'perc active', (intervalArray.intervals[i].activeUserTime/intervalTime)*100)
                  active_percentages.push(Math.floor((intervalArray[i].activeUserTime/intervalTime)*100))
                  // console.log('start', timestampToDate(intervalArray.intervals[i].startInterval), 'end', timestampToDate(intervalArray.intervals[i].endInterval))
                  // in milliseconds for chartjs
                  // past version:             timestamps.push((intervalArray[0].startInterval -3600)*1000)
                  timestamps.push((intervalArray[i].startInterval )*1000)
            }

            active_percentages.push(Math.floor((intervalArray[0].activeUserTime/intervalTime)*100))
            // past version:             timestamps.push((intervalArray[0].endInterval -3600)*1000)
            timestamps.push((intervalArray[0].endInterval )*1000)

            console.log('active_percentages:',active_percentages)
            console.log('timestamps:',timestamps)

            var ctx = document.getElementById('myChart2').getContext('2d');

            if (myChart) {
              myChart.destroy();
            }
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
                                  }],
                                  yAxes: [{
                                        ticks: {
                                            max: 100,
                                            min: 0,
                                            stepSize: 10
                                        },scaleLabel: {
                                            display: true,
                                            labelString: 'Active Time (%)'
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


}

function postAdditionalComputerStates(username,computerName){
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
        collectionTime: Math.floor(now.getTime()/1000),
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
        collectionTime: Math.floor(now.getTime()/1000),
        idleTime: 3
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });

  });



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
          collectionTime: Math.floor(now.getTime()/1000),
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
          collectionTime: Math.floor(now.getTime()/1000),
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
          collectionTime: Math.floor(now.getTime()/1000),
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
    const idleThreshold = 5
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

        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System State - ', st, idleState ,Math.floor(now.getTime()/1000),username,computerName);

        if(last_state != current_state){
            axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
              {
                userid: username,
                deviceid: computerName,
                collectionTime: Math.floor(now.getTime()/1000),
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
