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

          createDailyChart(states)
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

function register_user_interaction(username)
{
  now = new Date();
  // var event = document.getElementById("event");
  // event.innerText = ' The system is going to sleep'
  axios.post('https://health-iot.labs.vu.nl/api/user/trackerapp/post',
    {
      userid: username,
      collectionTime: Math.floor(now.getTime()/1000),
    }
  )
  .then((response) => {
    console.log('register_user_interaction POST OK', response);
  }, (error) => {
    console.log('register_user_interaction error');
    console.log(error);
  });

}

function ipcRendererEvents(username,computerName){
  console.log('User clicks icon...')
  //Display latest idle state data
  ipcRenderer.on('MSG_SHOW_PLOT', (event, data) => {
      get_display_data(username,computerName)
      register_user_interaction(username)
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
//from dashboard
function getIntervalSummary(states,start_interval,end_interval,lastState,slidingWindowMinutes){
    var idleIntervalThreshold = 0.3
  // console.log('getIntervalSummary function')
    var currentState = lastState

    var startInterval = start_interval
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

    //empty interval - in this case only take the last state and add the whole interval length to it
    if(states.length == 0)
    {
      iLength = slidingWindowMinutes*60

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
    //in case there are states with actual values in the states array
    else {
          totalStates = states.length
          // console.log('total data intervals', totalStates)

          for (i=0,l=states.length; i<l; i++){
              // console.log('Step:', i)
              // console.log('current state', currentState)
              // console.log('next state', intervals[i].idleTime)


              // dont we get an empty length in case startInterval -- states[0].collectionTime in the first step?
              endInterval = states[i].collectionTime
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
              currentState = states[i].idleTime
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




  // inferredState  0 idle (off screen), 1 active (on screen)

  var inferredState = 0
  var electronState = -1
  // this means that this is a minute when the computer was turned on/off
  //this logic is limited to a slidingWindowMinutes = 1

  if(computerTimeOFF == 60)
      {
        inferedState = 0
        electronState = -1
      }
  else if(activeUserTime/notactiveUserTime < idleIntervalThreshold)
      {
        inferredState = 0
        electronState = 0
      }
  else
      {
        inferredState = 1
        electronState = 1
      }


  return {"interval_begin" : start_interval, "interval_end" : end_interval,
                                     "activeUserTime":activeUserTime,"notactiveUserTime":notactiveUserTime,"inferredState":inferredState,"otherNonActive":otherNonActive,
                                     "computerTimeON":computerTimeON,"computerTimeOFF":computerTimeOFF,"states":states,"statesLength":totalStates,"lastState":currentState, "electronState": electronState}

}
//from dashboard
function createIntervals(states,slidingWindowMinutes,sTime,eTime){

    // array that will contain the calculated intervals
      var intervalArray = {
          intervals: []
      };

      //interval length in seconds
      var intervalLength = slidingWindowMinutes*60

      // sort the intervals as sometimes app OFF is saved after app ON
      states = states.sort(function(a, b) {  return a.collectionTime - b.collectionTime;});

      var currentTime
      var dayStart

        var start = new Date();
        start.setHours(0,0,0,0);
        dayStart =  Math.floor(start.getTime()/1000)




        var end = new Date();
        currentTime = Math.floor(end.getTime())/1000;



      console.log('sTime dayStart eTime currentTime', sTime, dayStart, eTime, currentTime)

        // these two are like interval slider start and end point
      var intervalStart = dayStart
      var intervalEnd = intervalStart + intervalLength - 1

      console.log('createIntervals STATES ', states)

      //only if there are states to be calculated in the day
      if(states.length != 0)
      {

            while(intervalStart<=currentTime){
              //valid for the last interval in case that it exceed the currentTime
              if(intervalEnd>currentTime)
              {
                    intervalEnd = currentTime
              }

              var slicedStates = states.filter(function (el) { return el.collectionTime >= intervalStart && el.collectionTime <= intervalEnd });
              //there is data in the sliced interval
              if(slicedStates.length !=0)
                 slicedStates = slicedStates.sort(function(a, b) { return a.collectionTime - b.collectionTime;});

              // the initial calculation
              if(intervalArray.intervals.length == 0){
                //the first sliced interval is empty - can happen very often
                if(slicedStates.length == 0)
                {
                  intervalArray.intervals.push(getIntervalSummary(slicedStates,intervalStart,intervalEnd,10,slidingWindowMinutes))

                }
                else{
                    intervalArray.intervals.push(getIntervalSummary(slicedStates,intervalStart,intervalEnd,states[0].idleTime,slidingWindowMinutes))

                }

              }
              //intervalArray has already some calculated intervals
              else{
                    //the first state is the last state of the previous interval : intervalArray.intervals[intervalArray.intervals.length-1].lastState
                    intervalArray.intervals.push(getIntervalSummary(slicedStates,intervalStart,intervalEnd, intervalArray.intervals[intervalArray.intervals.length-1].lastState, slidingWindowMinutes))

              }

                  intervalEnd = intervalEnd + intervalLength
                  intervalStart = intervalStart + intervalLength
            }


      }
      else{

        console.log('No States Today')
      }

    return intervalArray


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


  console.log('transformIntervalArray dayStart now', dayStart,now)
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


function createDailyChart(states){
          intervalArray = transformIntervalArray(states)
          //only last two hours
          intervalArray = intervalArray.intervals.slice(0,8)

          document.getElementById('lastUpdate').innerHTML = 'Last Updated: ' + timestampToDate(states[states.length - 1].collectionTime+3600)
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
